import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";

export const settingsSchema = z
  .object({
    mode: z.enum(["demo", "supabase"]),
    aiUrl: z.string().url().max(500),
    aiModel: z.string().trim().min(1).max(100),
    aiKey: z.string().max(4000),
    speechProvider: z.enum(["azure", "compatible"]),
    speechRegion: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/),
    speechUrl: z.string().url().max(500),
    speechModel: z.string().trim().min(1).max(100),
    speechKey: z.string().max(4000),
    ttsProvider: z.enum(["disabled", "azure", "compatible"]),
    ttsUrl: z.string().url().max(500),
    ttsModel: z.string().trim().min(1).max(100),
    ttsVoice: z.string().trim().min(1).max(100),
    ttsKey: z.string().max(4000),
    azureRegion: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/),
    azureVoice: z.string().regex(/^zh-HK-[A-Za-z]+Neural$/),
    supabaseUrl: z.union([z.literal(""), z.string().url().max(500)]),
    supabaseKey: z.string().max(4000),
    databaseUrl: z.string().max(4000),
    serviceKey: z.string().max(4000),
  })
  .strict();
export type Settings = z.infer<typeof settingsSchema>;
export const secretFields = [
  "aiKey",
  "speechKey",
  "ttsKey",
  "supabaseKey",
  "databaseUrl",
  "serviceKey",
] as const;
type Vault = {
  passwordHash: string;
  salt: string;
  settings: Partial<Settings>;
};
function root() {
  return (
    process.env.DEVELOPER_DATA_DIR ||
    process.env.DEMO_DATA_DIR ||
    path.join(process.cwd(), ".data")
  );
}
async function key() {
  await fs.mkdir(root(), { recursive: true, mode: 0o700 });
  const filename = path.join(root(), "developer.key");
  try {
    return await fs.readFile(filename);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  const value = randomBytes(32);
  try {
    await fs.writeFile(filename, value, { flag: "wx", mode: 0o600 });
    return value;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST")
      return fs.readFile(filename);
    throw e;
  }
}
async function readVault(): Promise<Vault | null> {
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(path.join(root(), "developer.enc"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    await key(),
    buffer.subarray(0, 12),
  );
  decipher.setAuthTag(buffer.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(buffer.subarray(28)),
      decipher.final(),
    ]).toString(),
  );
}
async function writeVault(vault: Vault) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", await key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(vault)),
    cipher.final(),
  ]);
  const file = path.join(root(), "developer.enc");
  await fs.writeFile(
    file + ".tmp",
    Buffer.concat([iv, cipher.getAuthTag(), encrypted]),
    { mode: 0o600 },
  );
  await fs.rename(file + ".tmp", file);
}
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const job = queue.then(fn);
  queue = job.catch(() => {});
  return job;
}
export async function hasDeveloper() {
  return !!(await readVault());
}
export async function initializeDeveloper(password: string) {
  return exclusive(async () => {
    if (await readVault()) throw new Error("Developer account already exists.");
    if (password.length < 12 || password.length > 128)
      throw new Error("Use a developer password of 12–128 characters.");
    const salt = randomBytes(16).toString("hex");
    await writeVault({
      salt,
      passwordHash: scryptSync(password, salt, 64).toString("hex"),
      settings: {},
    });
  });
}
export async function checkPassword(password: string) {
  const vault = await readVault();
  return (
    !!vault &&
    password.length <= 128 &&
    timingSafeEqual(
      Buffer.from(vault.passwordHash, "hex"),
      scryptSync(password, vault.salt, 64),
    )
  );
}
export async function developerSession() {
  const vault = await readVault();
  if (!vault) throw new Error("Developer sign in required.");
  const payload = Buffer.from(
    JSON.stringify({
      expires: Date.now() + 8 * 60 * 60 * 1000,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", await key())
    .update(payload + vault.passwordHash)
    .digest("base64url");
  return payload + "." + signature;
}
export async function validDeveloperSession(token?: string) {
  if (!token || token.length > 1000) return false;
  try {
    const vault = await readVault();
    if (!vault) return false;
    const [payload, signature, ...extra] = token.split(".");
    if (!payload || !signature || extra.length) return false;
    const expected = createHmac("sha256", await key())
      .update(payload + vault.passwordHash)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    return (
      actual.length === expected.length &&
      timingSafeEqual(actual, expected) &&
      JSON.parse(Buffer.from(payload, "base64url").toString()).expires >
        Date.now()
    );
  } catch {
    return false;
  }
}
export async function readSettings(): Promise<Settings> {
  const stored = (await readVault())?.settings || {};
  const aiUrl =
    stored.aiUrl ||
    process.env.AI_BASE_URL ||
    (stored.aiKey || process.env.AI_API_KEY
      ? "https://api.openai.com/v1"
      : "https://openrouter.ai/api/v1");
  return settingsSchema.parse({
    mode: process.env.APP_MODE === "supabase" ? "supabase" : "demo",
    aiUrl,
    aiModel:
      process.env.AI_MODEL ||
      (new URL(aiUrl).hostname === "openrouter.ai"
        ? "openai/gpt-4.1-mini"
        : "gpt-4o-mini"),
    aiKey: process.env.AI_API_KEY || "",
    speechProvider:
      process.env.SPEECH_PROVIDER === "azure"
        ? "azure"
        : process.env.SPEECH_PROVIDER === "compatible" ||
            (!stored.speechProvider &&
              (stored.speechUrl ||
                stored.speechKey ||
                process.env.SPEECH_API_URL ||
                process.env.SPEECH_API_KEY))
          ? "compatible"
          : "azure",
    speechRegion: process.env.SPEECH_REGION || "eastasia",
    speechUrl:
      process.env.SPEECH_API_URL ||
      "https://api.openai.com/v1/audio/transcriptions",
    speechModel: process.env.SPEECH_MODEL || "whisper-1",
    speechKey: process.env.SPEECH_API_KEY || "",
    ttsProvider: "azure",
    ttsUrl: "https://api.openai.com/v1/audio/speech",
    ttsModel: "gpt-4o-mini-tts",
    ttsVoice: "alloy",
    ttsKey: "",
    azureRegion: "eastasia",
    azureVoice: "zh-HK-HiuMaanNeural",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    databaseUrl: process.env.DATABASE_URL || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    ...stored,
  });
}
export function redactedSettings(settings: Settings) {
  const {
    aiKey,
    speechKey,
    ttsKey,
    supabaseKey,
    databaseUrl,
    serviceKey,
    ...publicValues
  } = settings;
  return {
    ...publicValues,
    configured: {
      aiKey: !!aiKey,
      speechKey: !!speechKey,
      ttsKey: !!ttsKey,
      supabaseKey: !!supabaseKey,
      databaseUrl: !!databaseUrl,
      serviceKey: !!serviceKey,
    },
  };
}
export function validateEndpoints(settings: Settings) {
  for (const value of [
    settings.aiUrl,
    settings.speechUrl,
    settings.ttsUrl,
    settings.supabaseUrl,
  ].filter(Boolean)) {
    const url = new URL(value);
    const local =
      process.env.LOCAL_DEVELOPER_SETUP === "true" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    )
      throw new Error(
        "Use an HTTPS service URL without embedded credentials or query parameters.",
      );
  }
  if (settings.databaseUrl) {
    const url = new URL(settings.databaseUrl);
    if (!["postgres:", "postgresql:"].includes(url.protocol))
      throw new Error(
        "Use the PostgreSQL connection string from Supabase Connect.",
      );
  }
  if (settings.supabaseKey.startsWith("sb_secret_"))
    throw new Error("Use a public Supabase key in the public key field.");
  if (settings.supabaseKey.split(".").length === 3) {
    try {
      if (
        JSON.parse(
          Buffer.from(
            settings.supabaseKey.split(".")[1],
            "base64url",
          ).toString(),
        ).role === "service_role"
      )
        throw new Error("Use a public Supabase key in the public key field.");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Use a public")) throw e;
    }
  }
}
export function publicConfiguration(
  settings: Settings,
  developerAvailable = false,
) {
  validateEndpoints(settings);
  return {
    mode: settings.mode,
    developerAvailable,
    supabase:
      settings.mode === "supabase" &&
      settings.supabaseUrl &&
      settings.supabaseKey
        ? { url: settings.supabaseUrl, key: settings.supabaseKey }
        : null,
  };
}
export async function saveSettings(patch: Record<string, unknown>) {
  return exclusive(async () => {
    const vault = await readVault();
    if (!vault) throw new Error("Developer sign in required.");
    const merged: Record<string, unknown> = { ...(await readSettings()) };
    for (const [name, value] of Object.entries(patch)) {
      if (!(name in merged)) throw new Error("Unknown service setting.");
      if (
        secretFields.includes(name as (typeof secretFields)[number]) &&
        value === ""
      )
        continue;
      merged[name] = value === null ? "" : value;
    }
    const settings = settingsSchema.parse(merged);
    validateEndpoints(settings);
    if (
      settings.mode === "supabase" &&
      (!settings.supabaseUrl || !settings.supabaseKey)
    )
      throw new Error(
        "Add a Supabase project URL and public key before connecting.",
      );
    await writeVault({ ...vault, settings });
    return redactedSettings(settings);
  });
}
