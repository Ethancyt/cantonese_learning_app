import { readFile } from "node:fs/promises";
import { lessonAudioTexts } from "../lib/lesson-audio";
import { demoMaterial } from "../lib/seeds";
import { createServer } from "node:http";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";
import { seedLessons } from "../lib/seeds";
async function main() {
  let voiceStatus = 200;
  let recognizedText = "你好";
  const audioFixture = await readFile("tests/fixtures/audio-test-tone.mp3");
  const calls: {
    path: string;
    authorization?: string;
    apiKey?: string;
    body: string;
  }[] = [];
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
      apiKey: req.headers["x-api-key"] as string | undefined,
      body,
    });
    let result: unknown = [];
    if (pathname === "/v1/chat/completions")
      result = { choices: [{ message: { content: '{"connected":true}' } }] };
    else if (pathname === "/v1/audio/speech") {
      if (voiceStatus !== 200) {
        res.statusCode = voiceStatus;
        res.end(JSON.stringify({ error: "developer-test-voice-key" }));
        return;
      }
      res.setHeader("Content-Type", "audio/mpeg");
      res.end(audioFixture);
      return;
    } else if (pathname === "/v1/audio/transcriptions")
      result = { text: recognizedText };
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
    args: [
      "--no-sandbox",
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      permissions: ["microphone"],
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
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
      .getByLabel("Recognition provider", { exact: true })
      .selectOption("compatible");
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
    await page.getByLabel(/^Voice provider/).selectOption("compatible");
    await page
      .getByLabel("Voice API endpoint", { exact: true })
      .fill(service + "/v1/audio/speech");
    await page
      .getByLabel("Lesson voice API key", { exact: true })
      .fill("developer-test-voice-key");
    await page
      .getByRole("button", { name: "Save & test lesson voice" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Lesson audio connected",
    );
    const voicePreview = page.getByLabel("Lesson voice preview", {
      exact: true,
    });
    await expect(voicePreview).toBeVisible();
    await expect(voicePreview).toHaveAttribute(
      "src",
      /^data:audio\/mpeg;base64,/,
    );
    await expect
      .poll(() =>
        voicePreview.evaluate((audio: HTMLAudioElement) => audio.duration),
      )
      .toBeGreaterThan(0);
    voiceStatus = 401;
    await page
      .getByRole("button", { name: "Save & test lesson voice" })
      .click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Voice provider HTTP 401" }),
    ).toContainText("Authentication failed");
    await expect(
      page.getByRole("alert").filter({ hasText: "Voice provider HTTP 401" }),
    ).not.toContainText("developer-test-voice-key");
    voiceStatus = 200;
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
    await page
      .getByRole("button", { name: "Use OpenRouter + Azure defaults" })
      .click();
    await expect(
      page.getByLabel("AI API base URL", { exact: true }),
    ).toHaveValue("https://openrouter.ai/api/v1");
    await expect(page.getByLabel("AI model", { exact: true })).toHaveValue(
      "openai/gpt-4.1-mini",
    );
    await expect(
      page.getByLabel("Recognition provider", { exact: true }),
    ).toHaveValue("azure");
    await expect(page.getByLabel(/^Voice provider/)).toHaveValue("azure");
    await expect(
      page.getByLabel("Azure recognition region", { exact: true }),
    ).toHaveValue("eastasia");
    await expect(page.getByLabel(/^Azure Speech region/)).toHaveValue(
      "eastasia",
    );
    await page.getByRole("button", { name: "Save service settings" }).click();
    await expect(page.getByRole("status")).toContainText("Settings saved");
    const presetState = await (
      await context.request.get(base + "/api/developer")
    ).json();
    expect(presetState.settings.configured.aiKey).toBe(false);
    expect(presetState.settings.configured.speechKey).toBe(false);
    expect(presetState.settings.configured.ttsKey).toBe(false);
    expect(presetState.settings.configured.serviceKey).toBe(true);
    await expect(page.getByRole("option", { name: /Knowlez/ })).toHaveCount(0);
    await page
      .getByLabel("AI API base URL", { exact: true })
      .fill(service + "/v1");
    await page.getByLabel("AI model", { exact: true }).fill("test-model");
    await page.getByLabel(/^AI API key/).fill("developer-test-ai-key");
    await page
      .getByLabel("Recognition provider", { exact: true })
      .selectOption("compatible");
    await page
      .getByLabel("Speech API endpoint", { exact: true })
      .fill(service + "/v1/audio/transcriptions");
    await page.getByLabel(/^Speech API key/).fill("developer-test-speech-key");
    await page.getByLabel(/^Voice provider/).selectOption("compatible");
    await page
      .getByLabel("Voice API endpoint", { exact: true })
      .fill(service + "/v1/audio/speech");
    await page
      .getByLabel("Lesson voice API key", { exact: true })
      .fill("developer-test-voice-key");
    await page.getByRole("button", { name: "Save service settings" }).click();
    await expect(page.getByRole("status")).toContainText("Settings saved");
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
    // Exercise the complete saved-audio workflow through the Studio and real HTTP routes.
    const developerAction = async (data: unknown) => {
      const response = await context.request.post(base + "/api/developer", {
        headers: { Origin: base },
        data,
      });
      expect(response.ok()).toBe(true);
      return response.json();
    };
    await developerAction({ action: "save", settings: { aiKey: null } });
    const studioAction = async (data: unknown) => {
      const response = await context.request.post(base + "/api/studio", {
        headers: { Origin: base },
        data,
      });
      expect(response.ok(), await response.text()).toBe(true);
      return response.json();
    };
    await context.request.post(base + "/api/data", {
      data: { action: "role", role: "volunteer" },
    });
    const uploaded = await context.request.post(base + "/api/studio", {
      multipart: { filename: "Audio workshop test", text: demoMaterial },
    });
    expect(uploaded.ok()).toBe(true);
    const material = await uploaded.json();
    const generated = await studioAction({
      action: "generate",
      sourceId: material.source.id,
      analysis: material.analysis,
      settings: {
        types: ["flashcard", "listen_choose", "speak"],
        level: "beginner",
        minutes: 5,
        age: "Adults",
        references: false,
      },
    });
    await page.goto(base + "/studio");
    await page
      .locator(".draft-row")
      .filter({ hasText: generated.lesson.title_zh })
      .getByRole("button", { name: "Open draft" })
      .click();
    await page
      .getByRole("button", { name: "Generate lesson audio", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Listen to the clips before approving",
      { timeout: 90000 },
    );
    let savedLesson = (
      await (await context.request.get(base + "/api/data")).json()
    ).drafts.find((l: any) => l.id === generated.lesson.id);
    expect(savedLesson.audio.length).toBe(lessonAudioTexts(savedLesson).length);
    const voiceCalls = () =>
      calls.filter((c) => c.path === "/v1/audio/speech").length;
    const afterGeneration = voiceCalls();
    await page.evaluate(() => {
      const original = HTMLMediaElement.prototype.play;
      (window as any).successfulAudioPlays = 0;
      HTMLMediaElement.prototype.play = async function () {
        await original.call(this);
        (window as any).successfulAudioPlays++;
      };
    });
    const voicePanel = page
      .getByRole("heading", { name: "Lesson voice clips" })
      .locator("..");
    await voicePanel
      .getByRole("button", { name: /^Listen to/ })
      .first()
      .click();
    await expect
      .poll(() => page.evaluate(() => (window as any).successfulAudioPlays))
      .toBe(1);
    await voicePanel
      .getByRole("button", { name: /^Listen to/ })
      .first()
      .click();
    await expect
      .poll(() => page.evaluate(() => (window as any).successfulAudioPlays))
      .toBe(2);
    expect(voiceCalls()).toBe(afterGeneration);
    const clip = savedLesson.audio[0];
    const audioURL =
      base +
      "/api/audio?" +
      new URLSearchParams({
        lessonId: savedLesson.id,
        version: String(savedLesson.version),
        clipId: clip.id,
      });
    expect((await anonymous.request.get(audioURL)).status()).toBe(400);
    expect(
      (
        await anonymous.request.post(base + "/api/studio", {
          data: { action: "audio", lessonId: savedLesson.id },
        })
      ).status(),
    ).toBe(403);
    const completedRetry = await studioAction({
      action: "audio",
      lessonId: savedLesson.id,
    });
    expect(completedRetry.remaining).toBe(0);
    expect(voiceCalls()).toBe(afterGeneration);
    // Saving cannot forge audio metadata.
    savedLesson = (
      await studioAction({
        action: "save",
        lesson: { ...savedLesson, audio: [] },
      })
    ).lesson;
    expect(savedLesson.audio.length).toBe(lessonAudioTexts(savedLesson).length);
    await studioAction({ action: "approve", lesson: savedLesson });
    await studioAction({ action: "publish", lessonId: savedLesson.id });
    const studentAudio = await anonymous.request.get(audioURL);
    expect(studentAudio.ok()).toBe(true);
    expect(studentAudio.headers()["content-type"]).toBe("audio/mpeg");
    expect(await studentAudio.body()).toEqual(audioFixture);
    const speaking = savedLesson.exercises.find((e: any) => e.type === "speak");
    await developerAction({
      action: "save",
      settings: {
        speechProvider: "compatible",
        speechUrl: service + "/v1/audio/transcriptions",
        speechKey: "browser-stt-canary",
      },
    });
    recognizedText = speaking.answer;
    const sectionIndex = savedLesson.module.sections.findIndex((s: any) =>
      s.exerciseIds.includes(speaking.id),
    );
    await page.goto(base + "/journey/" + savedLesson.id);
    await page.locator(".module-path-section button").nth(sectionIndex).click();
    await page.getByRole("button", { name: "Continue to practice" }).click();
    await expect(
      page.getByRole("button", {
        name: `Listen to ${speaking.answer}`,
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Start recording" }).click();
    await expect(
      page.getByRole("button", { name: "Stop recording" }),
    ).toBeVisible();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Stop recording" }).click();
    await expect(page.locator("audio")).toBeVisible();
    await page.getByRole("button", { name: "Check pronunciation" }).click();
    await expect(page.locator(".record-note")).toContainText(
      `Recognized: ${speaking.answer}`,
    );
    await expect(page.locator(".record-note")).toContainText(
      `Expected: ${speaking.answer}`,
    );
    await expect(page.locator(".record-note")).toContainText(
      "The recognized words match",
    );
    const recognitionCall = calls
      .filter((c) => c.path === "/v1/audio/transcriptions")
      .at(-1)!;
    expect(recognitionCall.authorization).toBe("Bearer browser-stt-canary");
    expect(recognitionCall.body).toContain('filename="practice.wav"');
    expect(recognitionCall.body).toContain("RIFF");
    expect(recognitionCall.body).toContain("WAVE");
    recognizedText = "這是不同的句子";
    await page.getByRole("button", { name: "Check pronunciation" }).click();
    await expect(page.locator(".record-note")).toContainText(
      "The recognized words differ",
    );

    // Test presentation separately from the real compatible request above;
    // Azure request headers and provider result parsing are checked by unit tests.
    let assessmentResponse: Record<string, unknown> = {
      available: true,
      expected: speaking.answer,
      recognized: speaking.answer,
      message: "The recognized words match. Great effort!",
      note: "Azure estimates pronunciation for this Cantonese phrase.",
      assessment: {
        overall: 73.4,
        accuracy: 65.2,
        fluency: 82.1,
        completeness: 90,
        words: [
          { word: "你好", accuracy: 54, error: "Mispronunciation" },
          { word: "老師", accuracy: 0, error: "Omission" },
          { word: "我", accuracy: null, error: "Insertion" },
        ],
      },
    };
    await page.route("**/api/transcribe", (route) =>
      route.fulfill({ json: assessmentResponse }),
    );
    await page.getByRole("button", { name: "Check pronunciation" }).click();
    const assessmentPanel = page.getByRole("region", {
      name: "Pronunciation assessment",
    });
    await expect(assessmentPanel).toBeVisible();
    await expect(assessmentPanel.locator("dd")).toHaveText([
      "73 / 100",
      "65 / 100",
      "82 / 100",
      "90 / 100",
    ]);
    await expect(assessmentPanel).toContainText("Try this word again");
    await expect(assessmentPanel).toContainText("Skipped word");
    await expect(assessmentPanel).toContainText("Extra word");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("button", { name: "Start recording" }).click();
    await expect(assessmentPanel).toHaveCount(0);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Stop recording" }).click();
    assessmentResponse = {
      ...assessmentResponse,
      assessment: null,
      note: "No pronunciation score is given; try another recording.",
    };
    await page.getByRole("button", { name: "Check pronunciation" }).click();
    await expect(page.locator(".record-note")).toContainText(
      "No pronunciation score",
    );
    await expect(assessmentPanel).toHaveCount(0);
    await page.unroute("**/api/transcribe");

    expect(
      (await studioAction({ action: "revise", lessonId: savedLesson.id }))
        .lesson.version,
    ).toBe(2);
    expect((await anonymous.request.get(audioURL)).ok()).toBe(true);
    // A new material can use the same stored-voice workflow.
    const second = await studioAction({
      action: "generate",
      sourceId: material.source.id,
      analysis: material.analysis,
      settings: {
        types: ["listen_choose"],
        level: "beginner",
        minutes: 5,
        age: "Adults",
        references: false,
      },
    });
    let batch = await studioAction({
      action: "audio",
      lessonId: second.lesson.id,
    });
    while (batch.remaining)
      batch = await studioAction({
        action: "audio",
        lessonId: second.lesson.id,
      });
    expect(batch.lesson.audio.length).toBe(
      lessonAudioTexts(batch.lesson).length,
    );
    await developerAction({
      action: "save",
      settings: { aiKey: "developer-test-ai-key" },
    });
    await page.goto(base + "/developer");
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
          ttsKey: null,
          ttsProvider: "disabled",
          ttsUrl: "https://api.openai.com/v1/audio/speech",
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
      "Developer browser checks passed: password setup, protected settings, saved keys, AI/speech/voice tests, saved-clip generation and playback, word checks, pronunciation score/word feedback display, stale/missing score handling, retry reuse, draft privacy, immutable audio, new materials, account provisioning, runtime Supabase sign-in, persistence, locking, and mobile layout. Provider requests used local mocks; assessment presentation used a mocked response.",
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
