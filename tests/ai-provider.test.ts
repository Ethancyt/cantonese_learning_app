import test from "node:test";
import assert from "node:assert/strict";
import { CompatibleProvider } from "../lib/ai/provider";
import { readSettings } from "../lib/server/settings";

test("AI timeouts during connection and response-body reading return safe guidance", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const provider = new CompatibleProvider({
    ...(await readSettings()),
    aiKey: "test-provider-key",
  });
  for (const stage of ["connection", "body"]) {
    globalThis.fetch = async () => {
      if (stage === "connection")
        throw new DOMException("private-provider-timeout", "TimeoutError");
      const response = Response.json({});
      response.json = async () => {
        throw new DOMException("private-provider-timeout", "AbortError");
      };
      return response;
    };
    await assert.rejects(provider.json("test", {}), (error: Error) => {
      assert.match(error.message, /AI provider took too long/);
      assert.doesNotMatch(
        error.message,
        /private-provider-timeout|test-provider-key/,
      );
      return true;
    });
  }
});

test("AI requests bound output and report truncation and malformed JSON safely", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const provider = new CompatibleProvider(await readSettings());
  let content = '{"connected":true}';
  let finishReason = "stop";
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(String(options?.body));
    assert.equal(request.max_tokens, 6000);
    return Response.json({
      choices: [{ message: { content }, finish_reason: finishReason }],
    });
  };
  const options = { timeoutMs: 1000, maxTokens: 6000 };
  assert.deepEqual(await provider.json("test", {}, options), {
    connected: true,
  });
  finishReason = "length";
  await assert.rejects(
    provider.json("test", {}, options),
    /exceeded the output limit/,
  );
  finishReason = "stop";
  content = "private-malformed-response";
  await assert.rejects(provider.json("test", {}, options), (error: Error) => {
    assert.match(error.message, /AI provider returned invalid JSON/);
    assert.doesNotMatch(error.message, /private-malformed-response/);
    return true;
  });
});
