import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { studioMaterial } from "../tests/helpers/studio-material";
import { workshopOne } from "../lib/content/workshop-one";
import { workshopTwo } from "../lib/content/workshop-two";

async function checkVisitor(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  base: string,
) {
  const context = await browser.newContext({ permissions: ["microphone"] });
  try {
    const page = await context.newPage();
    const progressWrites: string[] = [];
    const submittedAudio: Buffer[] = [];
    const pronunciationPath = "/api/workshop-pronunciation";
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().startsWith(base + "/api/") &&
        !request.url().endsWith(pronunciationPath)
      )
        progressWrites.push(request.url());
    });
    await page.route(base + pronunciationPath, async (route) => {
      const request = route.request();
      const upload = await new Response(
        new Uint8Array(request.postDataBuffer()!),
        {
          headers: { "Content-Type": request.headers()["content-type"] },
        },
      ).formData();
      const audio = upload.get("audio");
      if (!(audio instanceof File))
        throw new Error("Missing visitor recording.");
      expect(audio.type).toBe("audio/wav");
      const wav = Buffer.from(await audio.arrayBuffer());
      expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
      expect(wav.readUInt32LE(24)).toBe(16000);
      expect(wav.readUInt32LE(40)).toBeGreaterThan(0);
      const word = workshopOne.vocabulary.find(
        (entry) => entry.id === upload.get("vocabularyId"),
      );
      if (!word) throw new Error("Missing the visitor flashcard target.");
      submittedAudio.push(wav);
      await route.fulfill({
        json: {
          available: true,
          expected: word.traditional,
          recognized: word.traditional,
          message: "Phrase matched.",
          note: "Pronunciation score",
          assessment: {
            overall: 90,
            accuracy: 91,
            fluency: 89,
            completeness: 90,
            words: [],
          },
        },
      });
    });
    await page.goto(base);
    await expect(page.getByText(/practising as a visitor/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Volunteer Studio" }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await page.getByRole("link", { name: "Back to lessons" }).click();

    await page.locator(`a[href="/journey/${workshopTwo.id}"]`).first().click();
    await expect(
      page.getByRole("heading", { name: workshopTwo.title_zh, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".module-reference a")).toHaveAttribute(
      "href",
      workshopTwo.module!.references![0].url,
    );
    await page.goto(base);

    const first = workshopOne.module!.sections[0];
    await page.locator(`a[href="/journey/${workshopOne.id}"]`).first().click();
    await page.getByRole("button", { name: "Begin my journey" }).click();
    await page.getByRole("button", { name: "Continue to practice" }).click();
    await expect(page.getByRole("button", { name: "Save word" })).toHaveCount(
      0,
    );
    await expect(
      page.getByText(
        /Check pronunciation sends this recording to Azure Speech/,
      ),
    ).toBeVisible();
    for (let i = 1; i < first.vocabularyIds.length; i++)
      await page.getByRole("button", { name: "Next word" }).click();
    await page.getByRole("button", { name: "Start recording" }).click();
    const stop = page.getByRole("button", { name: "Stop recording" });
    await expect(stop).toBeVisible();
    await page.waitForTimeout(600);
    await stop.click();
    const replay = page.getByRole("button", { name: "Replay recording" });
    await replay.click();
    await expect
      .poll(() =>
        page
          .locator("audio")
          .evaluate((media) => (media as HTMLAudioElement).currentTime),
      )
      .toBeGreaterThan(0);
    const check = page.getByRole("button", { name: "Check pronunciation" });
    await check.click();
    await expect(
      page.getByRole("heading", { name: "Your pronunciation" }),
    ).toBeVisible();
    await check.click();
    await expect.poll(() => submittedAudio.length).toBe(2);
    expect(submittedAudio[1]).toEqual(submittedAudio[0]);
    await page.locator(".exercise-actions .btn").last().click();
    await expect(page.locator(".feedback")).toBeVisible();
    await page.getByRole("button", { name: "Record again" }).click();
    await expect(stop).toBeVisible();
    await page.waitForTimeout(900);
    await stop.click();
    await replay.click();
    await expect
      .poll(() =>
        page
          .locator("audio")
          .evaluate((media) => (media as HTMLAudioElement).currentTime),
      )
      .toBeGreaterThan(0);
    await check.click();
    await expect.poll(() => submittedAudio.length).toBe(3);
    expect(submittedAudio[2]).not.toEqual(submittedAudio[0]);
    await page.getByRole("button", { name: "Back to journey map" }).click();
    await expect(
      page.getByRole("button", { name: "Continue practice" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to my journeys" }).click();
    await page.locator(`a[href="/journey/${workshopOne.id}"]`).first().click();
    await expect(
      page.getByRole("button", { name: "Continue practice" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Begin my journey" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("saved-words")),
    ).toBeNull();
    expect(progressWrites).toEqual([]);

    await page.goto(base + "/studio");
    await expect(
      page.getByRole("heading", { name: "Volunteer access required" }),
    ).toBeVisible();
    const blocked = await context.request.post(base + "/api/studio", {
      data: { action: "generate" },
    });
    expect(blocked.status()).toBe(401);
    const attempt = await context.request.post(base + "/api/data", {
      data: { action: "attempt" },
    });
    expect(attempt.status()).toBe(401);
  } finally {
    await context.close();
  }
}

async function main() {
  const artifacts = process.env.BROWSER_ARTIFACT_DIR || "artifacts";
  await mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--no-sandbox",
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["microphone"],
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = process.env.TEST_BASE_URL || "http://localhost:3001";
  await page.goto(base);
  await expect(
    page.getByRole("heading", { name: "My lessons", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Your after-class lessons/ }),
  ).toBeVisible();
  await expect(page.locator(".card-unit")).toHaveText([
    "WORKSHOP 1",
    "WORKSHOP 2",
  ]);
  await page.screenshot({
    path: path.join(artifacts, "dashboard-desktop.png"),
    fullPage: true,
  });
  const moduleData = await (
    await context.request.get(base + "/api/data")
  ).json();
  for (const lesson of moduleData.lessons.filter(
    (l: any) => l.createdBy === "system",
  )) {
    await page.goto(base + "/journey/" + lesson.id);
    await expect(
      page.getByRole("heading", { name: lesson.title_zh, exact: true }),
    ).toBeVisible();
    const links = page.locator(".module-reference a");
    await expect(links).toHaveCount(lesson.module.references.length);
    for (const [index, reference] of lesson.module.references.entries()) {
      await expect(links.nth(index)).toHaveAttribute("href", reference.url);
      const response = await context.request.get(base + reference.url);
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(
        lesson.workshop.split(" · ").at(-1),
      );
    }
    await expect(page.locator(".module-path-section")).toHaveCount(
      lesson.module.sections.length,
    );
    for (let i = 0; i < lesson.module.sections.length; i++) {
      await page.locator(".module-path-section button").nth(i).click();
      await expect(page.locator(".module-teaching h3").first()).toHaveText(
        lesson.module.sections[i].title,
      );
      if (i === 0) {
        await page.setViewportSize({ width: 390, height: 844 });
        await expect
          .poll(() =>
            page
              .locator(".sidebar")
              .evaluate((sidebar) =>
                Math.round(sidebar.getBoundingClientRect().right),
              ),
          )
          .toBeLessThanOrEqual(0);
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          )
        )
          throw new Error("Mobile module overflow");
        await page.screenshot({
          path: path.join(artifacts, "module-mobile.png"),
          fullPage: true,
        });
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      await page.getByRole("button", { name: "Continue to practice" }).click();
      await expect(page.locator(".exercise-panel h2")).toHaveText(
        lesson.exercises.find(
          (e: any) => e.id === lesson.module.sections[i].exerciseIds[0],
        ).instruction,
      );
      await page.getByRole("button", { name: "Back to journey map" }).click();
    }
    if (lesson.id === "workshop-2026-11-13") {
      await page.getByRole("button", { name: "Begin my journey" }).click();
      for (const e of lesson.exercises) {
        if (
          await page
            .getByRole("button", { name: "Continue to practice" })
            .isVisible()
        )
          await page
            .getByRole("button", { name: "Continue to practice" })
            .click();
        await expect(page.locator(".exercise-panel h2")).toHaveText(
          e.instruction,
        );
        if (e.type === "flashcard") {
          await expect(
            page.getByRole("heading", { name: "Look, listen and say" }),
          ).toBeVisible();
          await expect(
            page.getByRole("button", { name: "Start recording" }),
          ).toBeVisible();
          await page.getByRole("button", { name: "Start recording" }).click();
          await page.getByRole("button", { name: "Stop recording" }).waitFor();
          await page.waitForTimeout(500);
          await page.getByRole("button", { name: "Stop recording" }).click();
          await expect(
            page.getByRole("button", { name: "Check pronunciation" }),
          ).toBeVisible();
          for (
            let i = 1;
            i <
            (lesson.module?.sections.find((s: any) =>
              s.exerciseIds.includes(e.id),
            )?.vocabularyIds.length || lesson.vocabulary.length);
            i++
          )
            await page.getByRole("button", { name: "Next word" }).click();
        } else if (
          [
            "multiple_choice",
            "listen_choose",
            "conversation_choice",
            "scenario",
          ].includes(e.type)
        ) {
          for (const option of e.options.filter((o: string) =>
            /[\u3400-\u9fff]/u.test(o),
          ))
            await expect(
              page.locator(".exercise-options").getByRole("button", {
                name: `Listen to ${option}`,
                exact: true,
              }),
            ).toBeVisible();
          await page
            .locator(".exercise-options")
            .locator(".option")
            .nth(e.options.indexOf(e.answer))
            .click();
        } else if (e.type === "match") {
          for (const p of e.pairs) {
            await page
              .locator(".match-column")
              .first()
              .getByRole("button", { name: p.left, exact: true })
              .click();
            await page
              .locator(".match-column")
              .last()
              .getByRole("button", { name: p.right, exact: true })
              .click();
          }
        } else if (e.type === "sentence_order") {
          for (const token of e.tokens)
            await page
              .locator(".tokens")
              .getByRole("button", { name: token, exact: true })
              .first()
              .click();
        } else if (e.type === "fill_blank")
          await page.getByLabel("Your answer", { exact: true }).fill(e.answer);
        else if (e.personalPractice) {
          const values = ["Sam", "Ghana", "Sha Tin"];
          for (const [index, frame] of e.personalPractice.entries()) {
            await page
              .getByLabel(frame.label, { exact: true })
              .fill(values[index]);
            await expect(
              page.locator(".dialogue-line").nth(index),
            ).toContainText(values[index]);
          }
          await page.getByRole("button", { name: "I said it aloud" }).click();
        } else if (e.type === "speak") {
          await page.getByRole("button", { name: "Start recording" }).click();
          await expect(
            page.getByRole("button", { name: "Stop recording" }),
          ).toBeVisible();
          await page.waitForTimeout(500);
          await page.getByRole("button", { name: "Stop recording" }).click();
          await expect(page.locator("audio")).toBeVisible();
          await page
            .getByRole("button", { name: "Check pronunciation" })
            .click();
          await expect(
            page.getByText(/Transcription is not connected/),
          ).toBeVisible();
        } else if (e.type === "ai_roleplay") {
          await page
            .getByRole("button", { name: "Meet my workshop buddy" })
            .click();
          for (let i = 0; i < 3; i++) {
            await page.locator(".chat-replies button").first().click();
            await expect(page.locator(".chat-bubble.mine")).toHaveCount(i + 1);
          }
          await expect(
            page.getByText("好叻！Three replies practised."),
          ).toBeVisible();
        }
        const check = page.locator(".exercise-actions .btn").last();
        await expect(check).toBeEnabled();
        await check.click();
        await expect(page.locator(".feedback")).toBeVisible();
        await page
          .getByRole("button", {
            name:
              e.id === lesson.exercises.at(-1).id
                ? "Finish journey"
                : "Continue",
            exact: true,
          })
          .click();
      }
      await expect(
        page.getByRole("heading", { name: "好叻！You did it." }),
      ).toBeVisible();
    }
  }
  await page.goto(base);
  await page.getByRole("button", { name: "Switch to volunteer" }).click();
  await expect(
    page.getByRole("heading", { name: "Your workshop, their next adventure." }),
  ).toBeVisible();
  await expect(page.getByText("Workshop Demo — 茶餐廳")).toHaveCount(0);
  await page.getByRole("button", { name: "Create practice journey" }).click();
  await page
    .locator("#material-file")
    .setInputFiles("sample-materials/classroom-introductions.pdf");
  const pdfUpload = page.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().endsWith("/api/studio"),
  );
  await page.getByRole("button", { name: "Find the learning content" }).click();
  expect((await pdfUpload).postData()).toContain('name="pdfPages"');
  await expect(
    page.getByRole("heading", { name: "Here’s what your workshop contains." }),
  ).toBeVisible();
  await expect(page.getByText(/page 1/).first()).toBeVisible();
  await page
    .getByRole("button", { name: /Back to Studio · unsaved edits/ })
    .click();
  await page.getByRole("button", { name: "Create practice journey" }).click();
  await page.locator("#material-file").setInputFiles({
    name: "Example workshop upload.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(studioMaterial),
  });
  await page.getByRole("button", { name: "Find the learning content" }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s what your workshop contains." }),
  ).toBeVisible();
  await expect(page.getByText("4 workshop words")).toBeVisible();
  await page
    .getByRole("button", { name: "Use this reviewed material" })
    .click();
  await page.getByRole("button", { name: "Create practice draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Make every little step feel right." }),
  ).toBeVisible();
  await page
    .getByLabel("Instruction", { exact: true })
    .fill("Explore our workshop words");
  await page.getByText("Review module teaching and context").click();
  await page.getByRole("button", { name: "Add reference link" }).click();
  await page.getByLabel("Reference title").fill("Class reading");
  await page
    .getByLabel("Learner-accessible HTTPS link")
    .fill("https://example.com/class-notes.pdf");
  await page.getByRole("button", { name: "Ready to review & publish" }).click();
  await expect(
    page.getByRole("button", { name: "Publish to students" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Approve this draft" }).click();
  await expect(
    page.getByRole("button", { name: "Publish to students" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Publish to students" }).click();
  await expect(
    page.getByRole("heading", { name: "工作坊練習 is live." }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(artifacts, "studio-published.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "View student journey" }).click();
  await expect(
    page.getByRole("link", { name: /Class reading/ }),
  ).toHaveAttribute("href", "https://example.com/class-notes.pdf");
  await page.getByRole("button", { name: "Begin my journey" }).click();
  const response = await context.request.get(base + "/api/data");
  const data = await response.json();
  const lesson = data.lessons
    .filter((l: any) => l.title_zh === "工作坊練習")
    .at(-1);
  for (const e of lesson.exercises) {
    if (
      await page
        .getByRole("button", { name: "Continue to practice" })
        .isVisible()
    )
      await page.getByRole("button", { name: "Continue to practice" }).click();
    await expect(page.locator(".exercise-panel h2")).toHaveText(e.instruction);
    if (e.type === "flashcard") {
      for (
        let i = 1;
        i <
        (lesson.module?.sections.find((s: any) => s.exerciseIds.includes(e.id))
          ?.vocabularyIds.length || lesson.vocabulary.length);
        i++
      )
        await page.getByRole("button", { name: "Next word" }).click();
    } else if (
      [
        "multiple_choice",
        "listen_choose",
        "conversation_choice",
        "scenario",
      ].includes(e.type)
    )
      await page
        .locator(".exercise-options")
        .locator(".option")
        .nth(e.options.indexOf(e.answer))
        .click();
    else if (e.type === "match") {
      for (const p of e.pairs) {
        await page
          .locator(".match-column")
          .first()
          .getByRole("button", { name: p.left, exact: true })
          .click();
        await page
          .locator(".match-column")
          .last()
          .getByRole("button", { name: p.right, exact: true })
          .click();
      }
    } else if (e.type === "sentence_order") {
      for (const token of e.tokens)
        await page
          .locator(".tokens")
          .getByRole("button", { name: token, exact: true })
          .first()
          .click();
    } else if (e.type === "fill_blank")
      await page.getByLabel("Your answer", { exact: true }).fill(e.answer);
    else if (e.type === "speak") {
      await page.getByRole("button", { name: "Start recording" }).click();
      await expect(
        page.getByRole("button", { name: "Stop recording" }),
      ).toBeVisible();
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "Stop recording" }).click();
      await expect(page.locator("audio")).toBeVisible();
      await page.getByRole("button", { name: "Check pronunciation" }).click();
      await expect(
        page.getByText(/Transcription is not connected/),
      ).toBeVisible();
    } else if (e.type === "ai_roleplay") {
      await page
        .getByRole("button", { name: "Meet my workshop buddy" })
        .click();
      for (let i = 0; i < 3; i++) {
        await page.locator(".chat-replies button").first().click();
        await expect(page.locator(".chat-bubble.mine")).toHaveCount(i + 1);
      }
      await expect(
        page.getByText("好叻！Three replies practised."),
      ).toBeVisible();
    }
    const check = page.locator(".exercise-actions .btn").last();
    await expect(check).toBeEnabled();
    await check.click();
    await expect(page.locator(".feedback")).toBeVisible();
    await page
      .getByRole("button", {
        name:
          e.id === lesson.exercises.at(-1).id ? "Finish journey" : "Continue",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "好叻！You did it." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Review my words" }).click();
  await expect(
    page.getByRole("heading", { name: "Review today" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start a 5-question review" }).click();
  await expect(page.locator(".exercise-panel")).toBeVisible();
  await page.goto(base);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Mobile horizontal overflow");
  await page.screenshot({
    path: path.join(artifacts, "dashboard-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("link", { name: "Volunteer Studio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your workshop, their next adventure." }),
  ).toBeVisible();
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Mobile studio overflow");
  await page.screenshot({
    path: path.join(artifacts, "studio-mobile.png"),
    fullPage: true,
  });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Browser checks passed: Workshop 1, personal practice, references, Studio publication, review and mobile navigation.",
  );
  if (process.env.TEST_VISITOR_BASE_URL) {
    await checkVisitor(browser, process.env.TEST_VISITOR_BASE_URL);
    console.log(
      "Visitor browser checks passed: default access, temporary progress, sign-in and Studio restrictions.",
    );
  }
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
