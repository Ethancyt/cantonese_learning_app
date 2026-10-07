import test from "node:test";
import assert from "node:assert/strict";
import { synthesize } from "../lib/server/lesson-audio";
import { readSettings } from "../lib/server/settings";

test("speech synthesis errors expose status and actionable guidance without provider bodies or secrets", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const settings = {
    ...(await readSettings()),
    ttsProvider: "azure" as const,
    ttsKey: "private-tts-error-canary",
    azureRegion: "eastasia",
  };
  const cases = [
    [400, "voice/model"],
    [401, "exact region"],
    [402, "billing"],
    [403, "network restrictions"],
    [404, "region"],
    [429, "capacity"],
    [500, "Retry later"],
  ] as const;
  for (const [status, guidance] of cases) {
    globalThis.fetch = async () =>
      Response.json({ error: settings.ttsKey }, { status });
    await assert.rejects(
      () => synthesize("你好", settings),
      (e: Error) => {
        assert.match(e.message, new RegExp(`Azure Speech HTTP ${status}`));
        assert.ok(e.message.includes(guidance));
        assert.equal(e.message.includes(settings.ttsKey), false);
        return true;
      },
    );
  }
  globalThis.fetch = async () =>
    Response.json({ error: settings.ttsKey }, { status: 401 });
  await assert.rejects(
    () => synthesize("你好", { ...settings, ttsProvider: "compatible" }),
    (e: Error) => {
      assert.match(e.message, /Voice provider HTTP 401/);
      assert.doesNotMatch(e.message, /Azure Speech|private-tts-error-canary/);
      return true;
    },
  );
});
