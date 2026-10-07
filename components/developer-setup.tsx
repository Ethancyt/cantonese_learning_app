"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Settings,
  ShieldCheck,
  KeyRound,
  Database,
  Check,
  ExternalLink,
} from "lucide-react";
import { useApp } from "./app-provider";
import type { Settings as ServiceSettings } from "@/lib/server/settings";
type Secret =
  | "aiKey"
  | "speechKey"
  | "ttsKey"
  | "supabaseKey"
  | "databaseUrl"
  | "serviceKey";
type SafeSettings = Omit<ServiceSettings, Secret> & {
  configured: Record<Secret, boolean>;
};
type State = {
  initialized: boolean;
  authenticated: boolean;
  bootstrapAllowed: boolean;
  settings?: SafeSettings;
};
const secrets: Secret[] = [
  "aiKey",
  "speechKey",
  "ttsKey",
  "supabaseKey",
  "databaseUrl",
  "serviceKey",
];
export function DeveloperSetup() {
  const { reloadConfiguration } = useApp();
  const [state, setState] = useState<State | null>(null),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [form, setForm] = useState<ServiceSettings | null>(null),
    [removed, setRemoved] = useState<Secret[]>([]),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [databaseConfirmed, setDatabaseConfirmed] = useState(false),
    [account, setAccount] = useState({
      email: "",
      password: "",
      role: "student",
    });
  async function call(body: unknown) {
    const response = await fetch("/api/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Setup request failed.");
    return result;
  }
  async function load() {
    const response = await fetch("/api/developer", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load developer setup.");
    const result: State = await response.json();
    setState(result);
    if (result.settings) {
      setForm({
        ...result.settings,
        aiKey: "",
        speechKey: "",
        ttsKey: "",
        supabaseKey: "",
        databaseUrl: "",
        serviceKey: "",
      });
      setRemoved([]);
    }
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function field(name: keyof ServiceSettings, value: string) {
    setForm((f) => (f ? { ...f, [name]: value } : f));
    if (secrets.includes(name as Secret))
      setRemoved((r) => r.filter((k) => k !== name));
  }
  async function save() {
    if (!form) return;
    const payload: Record<string, unknown> = { ...form };
    delete payload.configured;
    for (const key of removed) payload[key] = null;
    const result = await call({ action: "save", settings: payload });
    await load();
    await reloadConfiguration();
    return result;
  }
  function secret(name: Secret, label: string, help: string) {
    return (
      <label className="field">
        {label}
        <input
          type="password"
          aria-label={label}
          autoComplete="new-password"
          value={form?.[name] || ""}
          onChange={(e) => field(name, e.target.value)}
          placeholder={
            removed.includes(name)
              ? "Will be removed on save"
              : state?.settings?.configured[name]
                ? "Saved · leave blank to keep"
                : "Paste here"
          }
        />
        <span className="setup-field-help">{help}</span>
        {state?.settings?.configured[name] && (
          <button
            type="button"
            className="text-link"
            onClick={() => {
              field(name, "");
              setRemoved((r) => [...new Set([...r, name])]);
            }}
          >
            Remove saved credential
          </button>
        )}
      </label>
    );
  }
  function test(service: string) {
    run(async () => {
      await save();
      const result = await call({ action: "test", service });
      setNote(result.message);
    });
  }
  return (
    <div className="developer-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DEVELOPER WORKSPACE</span>
          <h1>
            <Settings size={27} /> Set up your workshop
          </h1>
          <p>Connect services here. Your learners can focus on Cantonese.</p>
        </div>
        <Link href="/" className="text-link">
          Back to learning ↗
        </Link>
      </div>
      {error && (
        <div className="error-note" role="alert">
          {error}
        </div>
      )}
      {note && (
        <div className="setup-success" role="status">
          <Check size={18} />
          {note}
        </div>
      )}
      {!state && !error && <div className="empty panel">Loading setup…</div>}
      {state && !state.authenticated && (
        <section className="panel developer-login">
          <div className="setup-icon">
            <ShieldCheck size={26} />
          </div>
          <h2>
            {state.initialized
              ? "Unlock developer settings"
              : "Create your developer password"}
          </h2>
          <p>
            {state.initialized
              ? "Only the developer can change service connections and create workshop accounts."
              : "Choose a password to protect service keys and workshop setup on this computer."}
          </p>
          {!state.initialized && !state.bootstrapAllowed ? (
            <p>
              First-time setup is available from the local server started with{" "}
              <strong>npm run dev</strong>. Once configured, your developer
              password also works on the same server’s hosted website.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  if (!state.initialized && password !== confirmPassword)
                    throw new Error("The passwords do not match.");
                  await call({
                    action: state.initialized ? "login" : "initialize",
                    password,
                  });
                  setPassword("");
                  setConfirmPassword("");
                  await load();
                });
              }}
            >
              <label className="field">
                Developer password
                <input
                  type="password"
                  autoComplete={
                    state.initialized ? "current-password" : "new-password"
                  }
                  required
                  minLength={state.initialized ? 1 : 12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {!state.initialized && (
                <label className="field">
                  Confirm password
                  <input
                    type="password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
              )}
              <button className="btn" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : state.initialized
                    ? "Unlock settings"
                    : "Create developer account"}
              </button>
            </form>
          )}
        </section>
      )}
      {state?.authenticated && form && (
        <>
          <div className="setup-overview panel">
            <ShieldCheck size={23} />
            <div>
              <strong>Your keys stay on this server</strong>
              <p>
                Saved credentials are encrypted and never shown again. You can
                replace or remove them here. Connection tests send a small
                request to the selected provider.
              </p>
            </div>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await call({ action: "logout" });
                  setForm(null);
                  await load();
                })
              }
            >
              Lock settings
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const result = await save();
                setNote(result?.message || "Saved.");
              });
            }}
          >
            <section className="panel setup-card">
              <div className="setup-card-heading">
                <span className="setup-number">1</span>
                <div>
                  <h2>Choose how learners connect</h2>
                  <p>
                    Local practice works immediately. Supabase adds individual
                    accounts and shared workshop data.
                  </p>
                </div>
              </div>
              <label className="field">
                Learning mode
                <select
                  value={form.mode}
                  onChange={(e) => field("mode", e.target.value)}
                >
                  <option value="demo">Local demo · no accounts needed</option>
                  <option value="supabase">
                    Connected accounts · Supabase
                  </option>
                </select>
              </label>
            </section>
            <div className="setup-grid">
              <section className="panel setup-card">
                <div className="setup-card-heading">
                  <KeyRound size={23} />
                  <div>
                    <h2>AI lesson generation</h2>
                    <p>
                      Optional · original source-based practice works without a
                      key.
                    </p>
                  </div>
                </div>
                <label className="field">
                  AI API base URL
                  <input
                    type="url"
                    required
                    value={form.aiUrl}
                    onChange={(e) => field("aiUrl", e.target.value)}
                  />
                </label>
                <label className="field">
                  AI model
                  <input
                    required
                    value={form.aiModel}
                    onChange={(e) => field("aiModel", e.target.value)}
                  />
                </label>
                {secret(
                  "aiKey",
                  "AI API key",
                  "Use the key from your OpenAI-compatible provider.",
                )}
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => test("ai")}
                >
                  Save & test AI
                </button>
              </section>
              <section className="panel setup-card">
                <div className="setup-card-heading">
                  <KeyRound size={23} />
                  <div>
                    <h2>Speech transcription</h2>
                    <p>
                      Optional · learners can record and replay without a key.
                    </p>
                  </div>
                </div>
                <label className="field">
                  Speech API endpoint
                  <input
                    type="url"
                    required
                    value={form.speechUrl}
                    onChange={(e) => field("speechUrl", e.target.value)}
                  />
                </label>
                <label className="field">
                  Speech model
                  <input
                    required
                    value={form.speechModel}
                    onChange={(e) => field("speechModel", e.target.value)}
                  />
                </label>
                {secret(
                  "speechKey",
                  "Speech API key",
                  "You can use the same provider key if it supports transcription.",
                )}
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => test("speech")}
                >
                  Save & test speech
                </button>
              </section>
            </div>
            <section className="panel setup-card">
              <div className="setup-card-heading">
                <KeyRound size={23} />
                <div>
                  <h2>Saved Cantonese lesson audio</h2>
                  <p>
                    Generate once in the Studio and replay without another AI
                    request. Azure provides dedicated Hong Kong Cantonese
                    voices.
                  </p>
                </div>
              </div>
              <label className="field">
                Voice provider
                <select
                  value={form.ttsProvider}
                  onChange={(e) => field("ttsProvider", e.target.value)}
                >
                  <option value="disabled">Device voices only</option>
                  <option value="azure">
                    Azure Speech · Hong Kong Cantonese
                  </option>
                  <option value="compatible">
                    OpenAI-compatible speech generation
                  </option>
                </select>
              </label>
              {form.ttsProvider === "azure" && (
                <div className="form-grid">
                  <label className="field">
                    Azure Speech region
                    <input
                      value={form.azureRegion}
                      onChange={(e) => field("azureRegion", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Cantonese voice
                    <select
                      value={form.azureVoice}
                      onChange={(e) => field("azureVoice", e.target.value)}
                    >
                      <option value="zh-HK-HiuMaanNeural">
                        HiuMaan · female
                      </option>
                      <option value="zh-HK-HiuGaaiNeural">
                        HiuGaai · female
                      </option>
                      <option value="zh-HK-WanLungNeural">
                        WanLung · male
                      </option>
                    </select>
                  </label>
                </div>
              )}
              {form.ttsProvider === "compatible" && (
                <div className="form-grid">
                  <label className="field">
                    Voice API endpoint
                    <input
                      type="url"
                      value={form.ttsUrl}
                      onChange={(e) => field("ttsUrl", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Voice model
                    <input
                      value={form.ttsModel}
                      onChange={(e) => field("ttsModel", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Voice name
                    <input
                      value={form.ttsVoice}
                      onChange={(e) => field("ttsVoice", e.target.value)}
                    />
                  </label>
                  <p>
                    Choose a model that supports Cantonese and preview every
                    clip. OpenRouter chat settings are separate from this speech
                    endpoint.
                  </p>
                </div>
              )}
              {secret(
                "ttsKey",
                "Lesson voice API key",
                "Azure Speech resource key, or your compatible speech-generation provider key.",
              )}
              <button
                type="button"
                className="btn secondary"
                disabled={busy || form.ttsProvider === "disabled"}
                onClick={() => test("tts")}
              >
                Save & test lesson voice
              </button>
              <p className="setup-field-help">
                Provider charges or free-tier limits apply when generating.
                Local clips stay on this computer; connected mode uses private
                Supabase Storage. Run Initialize database to add audio storage
                to an existing project.
              </p>
            </section>
            <section className="panel setup-card">
              <div className="setup-card-heading">
                <span className="setup-number">2</span>
                <div>
                  <h2>Connect Supabase</h2>
                  <p>
                    Open or create your project, then paste its connection
                    details below.
                  </p>
                </div>
                <a
                  className="text-link"
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Supabase <ExternalLink size={14} />
                </a>
              </div>
              <div className="setup-grid">
                <div>
                  <label className="field">
                    Supabase project URL
                    <input
                      type="url"
                      value={form.supabaseUrl}
                      placeholder="https://your-project.supabase.co"
                      onChange={(e) => field("supabaseUrl", e.target.value)}
                    />
                    <span className="setup-field-help">
                      Find this in your project’s Connect dialog.
                    </span>
                  </label>
                  {secret(
                    "supabaseKey",
                    "Supabase public / publishable key",
                    "Find this in Project Settings → API Keys. This public key is used by the sign-in page.",
                  )}
                </div>
                <div>
                  {secret(
                    "databaseUrl",
                    "Database connection string",
                    "Copy the session-pooler URI from Connect and include your database password. Used only for database setup.",
                  )}
                  {secret(
                    "serviceKey",
                    "Supabase secret / service-role key",
                    "Find this in API Keys. Used only on this server to create workshop accounts.",
                  )}
                </div>
              </div>
              <div className="speech-controls">
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => test("supabase")}
                >
                  Save & test Supabase
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => test("database")}
                >
                  Save & test database
                </button>
              </div>
            </section>
            <div className="setup-save">
              <p>
                No source files to edit. Changes take effect as soon as you
                save.
              </p>
              <button className="btn" disabled={busy}>
                {busy ? "Working…" : "Save service settings"}
              </button>
            </div>
          </form>
          <section className="panel setup-card">
            <div className="setup-card-heading">
              <span className="setup-number">3</span>
              <div>
                <h2>Prepare your learning database</h2>
                <p>
                  Install the app tables, access rules, and four modules
                  directly from this page. Existing app data is preserved.
                </p>
              </div>
              <Database size={25} />
            </div>
            <label className="approval-check">
              <input
                type="checkbox"
                checked={databaseConfirmed}
                onChange={(e) => setDatabaseConfirmed(e.target.checked)}
              />
              I want to initialize or upgrade this Supabase project for the
              workshop app.
            </label>
            <button
              className="btn"
              disabled={busy || !databaseConfirmed}
              onClick={() =>
                run(async () => {
                  await save();
                  const result = await call({
                    action: "database",
                    confirm: true,
                  });
                  setNote(result.message);
                  setDatabaseConfirmed(false);
                })
              }
            >
              Initialize learning database
            </button>
          </section>
          <section className="panel setup-card">
            <div className="setup-card-heading">
              <span className="setup-number">4</span>
              <div>
                <h2>Create a workshop account</h2>
                <p>
                  After database setup, create a student, volunteer, or
                  administrator. Then select Connected accounts above to enable
                  sign-in.
                </p>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await save();
                  const result = await call({ action: "account", ...account });
                  setNote(result.message);
                  setAccount({ email: "", password: "", role: "student" });
                });
              }}
            >
              <div className="setup-grid">
                <label className="field">
                  Account email
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={account.email}
                    onChange={(e) =>
                      setAccount((a) => ({ ...a, email: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  Account password
                  <input
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={account.password}
                    onChange={(e) =>
                      setAccount((a) => ({ ...a, password: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="field">
                Account role
                <select
                  aria-label="Account role"
                  value={account.role}
                  onChange={(e) =>
                    setAccount((a) => ({ ...a, role: e.target.value }))
                  }
                >
                  <option value="student">Student</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
              <button className="btn" disabled={busy}>
                Create account
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
