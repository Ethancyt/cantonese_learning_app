import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  initializeDeveloper,
  checkPassword,
  developerSession,
  validDeveloperSession,
  readSettings,
  saveSettings,
  redactedSettings,
  publicConfiguration,
} from "../lib/server/settings";
import { provider } from "../lib/ai/provider";
test("browser-managed service settings encrypt secrets, protect sessions, and apply at runtime", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "cantonese-settings-"));
  const previous = process.env.DEVELOPER_DATA_DIR;
  process.env.DEVELOPER_DATA_DIR = root;
  t.after(async () => {
    if (previous === undefined) delete process.env.DEVELOPER_DATA_DIR;
    else process.env.DEVELOPER_DATA_DIR = previous;
    await rm(root, { recursive: true, force: true });
  });
  const password = "test-developer-password-42";
  await initializeDeveloper(password);
  await assert.rejects(() => initializeDeveloper(password), /already exists/);
  assert.equal(await checkPassword(password), true);
  assert.equal(await checkPassword("incorrect-password"), false);
  const session = await developerSession();
  assert.equal(await validDeveloperSession(session), true);
  assert.equal(await validDeveloperSession(session + "bad"), false);
  assert.equal(await validDeveloperSession(), false);
  const canary = "private-key-for-settings-test";
  const saved = await saveSettings({
    aiKey: canary,
    speechKey: "private-speech",
    ttsKey: "private-voice",
    serviceKey: "private-service",
    aiModel: "custom-model",
  });
  assert.equal(saved.configured.aiKey, true);
  assert.equal(JSON.stringify(saved).includes(canary), false);
  const raw = await readFile(path.join(root, "developer.enc"));
  assert.equal(raw.includes(Buffer.from(canary)), false);
  assert.equal(raw.includes(Buffer.from(password)), false);
  if (process.platform !== "win32") {
    assert.equal(
      (await stat(path.join(root, "developer.enc"))).mode & 0o777,
      0o600,
    );
    assert.equal(
      (await stat(path.join(root, "developer.key"))).mode & 0o777,
      0o600,
    );
  }
  await saveSettings({ aiKey: "", speechKey: "" });
  assert.equal((await readSettings()).aiKey, canary);
  assert.equal((await readSettings()).aiModel, "custom-model");
  assert.ok(await provider());
  assert.equal(
    JSON.stringify(redactedSettings(await readSettings())).includes("private-"),
    false,
  );
  assert.equal(
    JSON.stringify(publicConfiguration(await readSettings())).includes(
      "private-",
    ),
    false,
  );
  await assert.rejects(
    () => saveSettings({ supabaseKey: "sb_secret_fake-private-key" }),
    /public Supabase/,
  );
  const serviceJWT =
    "eyJhbGciOiJIUzI1NiJ9." +
    Buffer.from(JSON.stringify({ role: "service_role" })).toString(
      "base64url",
    ) +
    ".signature";
  await assert.rejects(
    () => saveSettings({ supabaseKey: serviceJWT }),
    /public Supabase/,
  );
  await assert.rejects(
    () => saveSettings({ aiUrl: "https://user:password@example.com/v1" }),
    /HTTPS/,
  );
  await assert.rejects(() => saveSettings({ mode: "supabase" }), /project URL/);
  await saveSettings({
    supabaseUrl: "https://workshop.supabase.co",
    supabaseKey: "sb_publishable_test",
    mode: "supabase",
  });
  const publicConfig = publicConfiguration(await readSettings());
  assert.equal(publicConfig.supabase?.key, "sb_publishable_test");
  assert.equal(JSON.stringify(publicConfig).includes(canary), false);
  await saveSettings({
    mode: "demo",
    aiKey: null,
    speechKey: null,
    ttsKey: null,
    serviceKey: null,
  });
  assert.equal(await provider(), null);
});
