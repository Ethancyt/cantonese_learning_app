// Run with a server: TEST_BASE_URL=http://localhost:3000 npm test
import test from "node:test";
import assert from "node:assert/strict";
import { demoMaterial } from "../lib/seeds";
const base = process.env.TEST_BASE_URL;
test(
  "HTTP demo: permission, upload, generation, approval, versioning, progress and review",
  { skip: !base },
  async () => {
    let cookie = "";
    async function call(path: string, body?: unknown) {
      const form = body instanceof FormData;
      const r = await fetch(`${base}${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          cookie,
          ...(body && !form ? { "content-type": "application/json" } : {}),
          origin: base!,
        },
        body: body ? (form ? body : JSON.stringify(body)) : undefined,
      });
      const cookies = r.headers.getSetCookie();
      if (cookies.length) {
        const map = new Map(
          cookie
            .split("; ")
            .filter(Boolean)
            .map((s) => s.split("=") as [string, string]),
        );
        for (const c of cookies) {
          const [name, value] = c.split(";")[0].split("=");
          map.set(name, value);
        }
        cookie = [...map].map(([k, v]) => `${k}=${v}`).join("; ");
      }
      return { status: r.status, data: await r.json() };
    }
    const initial = await call("/api/data");
    assert.equal(initial.status, 200);
    assert.equal(
      initial.data.lessons.filter((l: any) => l.createdBy === "system").length,
      4,
    );
    assert.equal(
      (await call("/api/studio", { action: "generate" })).status,
      403,
    );
    await call("/api/data", { action: "role", role: "volunteer" });
    const upload = new FormData();
    upload.set(
      "file",
      new File([demoMaterial], "Workshop Demo — 茶餐廳.txt", {
        type: "text/plain",
      }),
    );
    const analysis = await call("/api/studio", upload);
    assert.equal(analysis.status, 200);
    const result = await call("/api/studio", {
      action: "generate",
      sourceId: analysis.data.source.id,
      analysis: analysis.data.analysis,
      settings: {
        types: [
          "flashcard",
          "listen_choose",
          "sentence_order",
          "scenario",
          "ai_roleplay",
        ],
        level: "beginner",
        minutes: 5,
        age: "Children",
        references: true,
      },
    });
    assert.equal(result.status, 200, JSON.stringify(result.data));
    let lesson = result.data.lesson;
    assert.equal(
      (await call("/api/studio", { action: "publish", lessonId: lesson.id }))
        .status,
      400,
    );
    assert.equal(
      (await call("/api/data")).data.lessons.some(
        (l: any) => l.id === lesson.id,
      ),
      false,
    );
    lesson.exercises[1].instruction = "Listen to your café workshop phrase";
    const approve = await call("/api/studio", { action: "approve", lesson });
    assert.equal(approve.status, 200);
    assert.equal(
      (await call("/api/studio", { action: "publish", lessonId: lesson.id }))
        .status,
      200,
    );
    assert.ok(
      (await call("/api/data")).data.lessons.some(
        (l: any) => l.id === lesson.id,
      ),
    );
    const revise = await call("/api/studio", {
      action: "revise",
      lessonId: lesson.id,
    });
    assert.equal(revise.data.lesson.version, 2);
    assert.equal(
      (await call("/api/data")).data.lessons.find(
        (l: any) => l.id === lesson.id,
      ).version,
      1,
    );
    await call("/api/data", { action: "role", role: "student" });
    assert.equal(
      (await call("/api/studio", { action: "approve", lesson })).status,
      403,
    );
    assert.equal(
      (
        await call("/api/data", {
          action: "complete",
          lessonId: lesson.id,
          version: 1,
        })
      ).status,
      400,
    );
    const listen = lesson.exercises.find(
      (e: any) => e.type === "listen_choose",
    );
    const wrong = await call("/api/data", {
      action: "attempt",
      lessonId: lesson.id,
      version: 1,
      exerciseId: listen.id,
      answer: "Wrong",
      attemptId: crypto.randomUUID(),
    });
    assert.equal(wrong.data.correct, false);
    for (const e of lesson.exercises) {
      const answer =
        e.type === "match" ? JSON.stringify(e.pairs) : e.answer || "practised";
      assert.equal(
        (
          await call("/api/data", {
            action: "attempt",
            lessonId: lesson.id,
            version: 1,
            exerciseId: e.id,
            answer,
            attemptId: crypto.randomUUID(),
          })
        ).status,
        200,
      );
    }
    const complete = await call("/api/data", {
      action: "complete",
      lessonId: lesson.id,
      version: 1,
    });
    assert.equal(complete.status, 200);
    await call("/api/data", {
      action: "complete",
      lessonId: lesson.id,
      version: 1,
    });
    const final = await call("/api/data");
    assert.equal(
      final.data.completions.filter((c: any) => c.lessonId === lesson.id)
        .length,
      1,
    );
    assert.ok(final.data.mastery.some((m: any) => m.score < 100));
    const reply = await call("/api/roleplay", {
      lessonId: lesson.id,
      version: 1,
      messages: [{ role: "user", content: "奶茶" }],
    });
    assert.equal(reply.status, 200);
    assert.match(reply.data.mode, /Demo/);
    assert.equal(final.data.drafts.length, 0);
  },
);
