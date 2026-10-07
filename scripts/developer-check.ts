import { createServer } from "node:http";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";
import { seedLessons } from "../lib/seeds";
async function main() {
  const calls: { path: string; authorization?: string; body: string }[] = [];
  const id = "11111111-1111-4111-8111-111111111111";
  const user = {
    id,
    email: "learner@example.com",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    app_metadata: { provider: "email" },
    user_metadata: {},
  };
  const accessToken =
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ) +
    "." +
    Buffer.from(
      JSON.stringify({
        sub: id,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: "authenticated",
      }),
    ).toString("base64url") +
    ".mock-signature";
  const mock = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] ||
        "authorization,apikey,x-client-info,content-type,x-supabase-api-version",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    calls.push({
      path: pathname,
      authorization: req.headers.authorization,
      body,
    });
    let result: unknown = [];
    if (pathname === "/v1/chat/completions")
      result = { choices: [{ message: { content: '{"connected":true}' } }] };
    else if (pathname === "/v1/audio/transcriptions") result = { text: "你好" };
    else if (pathname === "/auth/v1/settings")
      result = { external: { email: true } };
    else if (pathname === "/auth/v1/admin/users") {
      result = user;
      res.statusCode = 200;
    } else if (pathname === "/auth/v1/token")
      result = {
        access_token: accessToken,
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        user,
      };
    else if (pathname === "/auth/v1/user") result = user;
    else if (pathname === "/rest/v1/profiles")
      result = req.method === "PATCH" ? { id } : { role: "student" };
    else if (
      pathname === "/rest/v1/lessons" ||
      pathname === "/rest/v1/published_versions"
    )
      result = seedLessons.map((payload) => ({
        payload,
        lesson_id: payload.id,
      }));
    res.end(JSON.stringify(result));
  });
  mock.listen(0, "127.0.0.1");
  await once(mock, "listening");
  const address = mock.address();
  if (!address || typeof address === "string")
    throw new Error("Mock address unavailable");
  const service = "http://127.0.0.1:" + address.port;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const base = process.env.TEST_BASE_URL || "http://localhost:3000";
    const anonymous = await browser.newContext();
    const denied = await anonymous.request.post(base + "/api/developer", {
      headers: { Origin: base, Cookie: "demo_role=volunteer" },
      data: { action: "save", settings: { aiKey: "malicious" } },
    });
    expect(denied.status()).toBe(401);
    const crossSite = await anonymous.request.post(base + "/api/developer", {
      headers: { Origin: "https://another-site.example" },
      data: { action: "initialize", password: "attacker-password" },
    });
    expect(crossSite.status()).toBe(403);
    await page.goto(base + "/developer");
    await page
      .getByLabel("Developer password", { exact: true })
      .fill("browser-developer-password");
    if (await page.getByLabel("Confirm password").isVisible()) {
      await page
        .getByLabel("Confirm password")
        .fill("browser-developer-password");
      await page
        .getByRole("button", { name: "Create developer account" })
        .click();
    } else await page.getByRole("button", { name: "Unlock settings" }).click();
    await expect(
      page.getByRole("heading", { name: "AI lesson generation" }),
    ).toBeVisible();
    await page
      .getByLabel("AI API base URL", { exact: true })
      .fill(service + "/v1");
    await page.getByLabel("AI model", { exact: true }).fill("test-model");
    await page.getByLabel(/^AI API key/).fill("developer-test-ai-key");
    await page
      .getByLabel("Speech API endpoint", { exact: true })
      .fill(service + "/v1/audio/transcriptions");
    await page.getByLabel(/^Speech API key/).fill("developer-test-speech-key");
    await page.getByLabel(/^Supabase project URL/).fill(service);
    await page.getByLabel(/^Supabase public/).fill("sb_publishable_test");
    await page
      .getByLabel(/^Supabase secret/)
      .fill("developer-test-service-key");
    await page
      .getByRole("button", { name: "Save & test AI", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "AI generation connected",
    );
    await page.getByRole("button", { name: "Save & test speech" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Speech transcription connected",
    );
    await page.getByRole("button", { name: "Save & test Supabase" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Supabase Auth and lesson tables",
    );
    expect(
      calls.find((c) => c.path === "/v1/chat/completions")?.authorization,
    ).toBe("Bearer developer-test-ai-key");
    expect(
      calls.find((c) => c.path === "/v1/audio/transcriptions")?.authorization,
    ).toBe("Bearer developer-test-speech-key");
    await page.getByLabel("Account email", { exact: true }).fill(user.email);
    await page
      .getByLabel("Account password", { exact: true })
      .fill("student-password-test");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Account created");
    expect(
      calls.find((c) => c.path === "/auth/v1/admin/users")?.authorization,
    ).toBe("Bearer developer-test-service-key");
    const protectedState = await (
      await context.request.get(base + "/api/developer")
    ).json();
    expect(protectedState.settings.configured.aiKey).toBe(true);
    expect(JSON.stringify(protectedState)).not.toContain("developer-test-");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.waitForTimeout(250);
    await page.screenshot({
      path: "/workspace/artifacts/developer-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(250);
    await page.screenshot({
      path: "/workspace/artifacts/developer-desktop.png",
      fullPage: true,
    });
    await page.getByLabel(/^Learning mode/).selectOption("supabase");
    await page.getByRole("button", { name: "Save service settings" }).click();
    await expect(page.getByRole("status")).toContainText("Settings saved");
    const config = await (
      await anonymous.request.get(base + "/api/config")
    ).json();
    expect(config.supabase.key).toBe("sb_publishable_test");
    expect(JSON.stringify(config)).not.toContain("developer-test-");
    await page.goto(base);
    await page.getByLabel("Email", { exact: true }).fill(user.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("student-password-test");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "你好，little explorer" }),
    ).toBeVisible();
    await expect(
      page.getByText("Connected account", { exact: true }),
    ).toBeVisible();
    await page.goto(base + "/developer");
    await expect(
      page.getByRole("heading", { name: "AI lesson generation" }),
    ).toBeVisible();
    const reset = await context.request.post(base + "/api/developer", {
      headers: { Origin: base },
      data: {
        action: "save",
        settings: {
          mode: "demo",
          aiKey: null,
          speechKey: null,
          serviceKey: null,
          supabaseKey: null,
          supabaseUrl: "",
          aiUrl: "https://api.openai.com/v1",
          speechUrl: "https://api.openai.com/v1/audio/transcriptions",
        },
      },
    });
    expect(reset.ok()).toBe(true);
    await page.reload();
    await page.getByRole("button", { name: "Lock settings" }).click();
    await expect(
      page.getByRole("heading", { name: "Unlock developer settings" }),
    ).toBeVisible();
    const locked = await (
      await context.request.get(base + "/api/developer")
    ).json();
    expect(locked.authenticated).toBe(false);
    expect(locked.settings).toBeUndefined();
    await page
      .getByLabel("Developer password", { exact: true })
      .fill("browser-developer-password");
    await page.getByRole("button", { name: "Unlock settings" }).click();
    await expect(
      page.getByRole("heading", { name: "AI lesson generation" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    console.log(
      "Developer browser checks passed: password setup, protected settings, saved keys, AI/speech tests, account provisioning, runtime Supabase sign-in, persistence, locking, and mobile layout. Provider requests used local mocks.",
    );
  } finally {
    await browser.close();
    mock.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
