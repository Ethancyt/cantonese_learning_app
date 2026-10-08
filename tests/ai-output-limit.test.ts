import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { AIOutputLimitError, type AIProvider } from "../lib/ai/provider";
import { validatedAI } from "../lib/ai/validated";

const schema = z.object({ complete: z.literal(true) }).strict();

test("truncated analysis and lesson responses get one compact retry", async () => {
  for (const kind of ["analysis", "lesson"] as const) {
    const requests: Record<string, unknown>[] = [];
    const ai: AIProvider = {
      async json(_system, input, options) {
        requests.push(input as Record<string, unknown>);
        assert.equal(options?.maxTokens, kind === "analysis" ? 6000 : 12000);
        if (requests.length === 1) throw new AIOutputLimitError();
        return { complete: true };
      },
    };
    const result = await validatedAI(
      ai,
      { source: { id: "reviewed-source" }, settings: { types: ["match"] } },
      schema,
      (v) => v,
      kind,
    );
    assert.deepEqual(result, { complete: true });
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[1].source, requests[0].source);
    assert.deepEqual(requests[1].settings, requests[0].settings);
    assert.match(
      JSON.stringify(requests[1].responseLimits),
      /previous response exceeded/,
    );
    assert.equal(Object.hasOwn(requests[1], "previousResponse"), false);
  }
});

test("truncation recovery and validation share one retry allowance", async () => {
  for (const first of ["truncated", "invalid"]) {
    let calls = 0;
    const ai: AIProvider = {
      async json() {
        calls++;
        if (first === "invalid" && calls === 1) return {};
        throw new AIOutputLimitError();
      },
    };
    await assert.rejects(
      () => validatedAI(ai, {}, schema, (v) => v, "lesson"),
      AIOutputLimitError,
    );
    assert.equal(calls, 2);
  }
  let calls = 0;
  const failed: AIProvider = {
    async json() {
      calls++;
      throw new Error("Provider unavailable");
    },
  };
  await assert.rejects(
    () => validatedAI(failed, {}, schema, (v) => v, "analysis"),
    /Provider unavailable/,
  );
  assert.equal(
    calls,
    1,
    "connection/provider failures are not automatically retried",
  );
});

test("truncation recovery uses only the remaining shared deadline", async (t) => {
  const originalNow = Date.now;
  let elapsed = 0;
  Date.now = () => elapsed;
  t.after(() => {
    Date.now = originalNow;
  });
  for (const consumed of [65000, 85000]) {
    elapsed = 0;
    const timeouts: number[] = [];
    const ai: AIProvider = {
      async json(_system, _input, options) {
        timeouts.push(options!.timeoutMs);
        if (timeouts.length === 1) {
          elapsed = consumed;
          throw new AIOutputLimitError();
        }
        return { complete: true };
      },
    };
    if (consumed === 65000) {
      await validatedAI(ai, {}, schema, (v) => v, "lesson");
      assert.deepEqual(timeouts, [75000, 20000]);
    } else {
      await assert.rejects(
        () => validatedAI(ai, {}, schema, (v) => v, "lesson"),
        AIOutputLimitError,
      );
      assert.deepEqual(timeouts, [75000]);
    }
  }
});
