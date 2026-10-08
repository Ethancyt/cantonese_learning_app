import { chromium, expect } from "@playwright/test";
import { demoMaterial } from "../lib/seeds";
async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
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
    "LESSON 1",
    "LESSON 2",
    "LESSON 3",
    "LESSON 4",
  ]);
  await page.screenshot({
    path: "/workspace/artifacts/dashboard-desktop.png",
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
    await expect(page.locator(".module-reference a")).toHaveAttribute(
      "href",
      lesson.module.reference.url,
    );
    await expect(page.locator(".module-path-section")).toHaveCount(
      lesson.module.sections.length,
    );
    for (let i = 0; i < lesson.module.sections.length; i++) {
      await page.locator(".module-path-section button").nth(i).click();
      await expect(page.locator(".module-teaching h3").first()).toHaveText(
        lesson.module.sections[i].title,
      );
      if (lesson.id === "introductions" && i === 0) {
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
          path: "/workspace/artifacts/module-mobile.png",
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
    if (lesson.id === "manners") {
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
        else if (e.type === "speak") {
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
  await page.getByRole("button", { name: "Try sample workshop" }).click();
  await expect(page.getByLabel("Or paste your workshop notes")).toContainText(
    "奶茶",
  );
  await page.locator("#material-file").setInputFiles({
    name: "Workshop Demo — 茶餐廳.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(demoMaterial),
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
    .fill("Explore our café workshop words");
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
    page.getByRole("heading", { name: "去茶餐廳 is live." }),
  ).toBeVisible();
  await page.screenshot({
    path: "/workspace/artifacts/studio-published.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "View student journey" }).click();
  await page.getByRole("button", { name: "Begin my journey" }).click();
  const response = await context.request.get(base + "/api/data");
  const data = await response.json();
  const lesson = data.lessons
    .filter((l: any) => l.title_zh === "去茶餐廳")
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
    path: "/workspace/artifacts/dashboard-mobile.png",
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
    path: "/workspace/artifacts/studio-mobile.png",
    fullPage: true,
  });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Browser demonstration passed: edit, approval gate, publication, all 10 exercises, roleplay, completion, review, and mobile navigation.",
  );
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
