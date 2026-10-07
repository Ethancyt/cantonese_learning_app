import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { readFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL;
test(
  "Studio HTTP accepts AI matching/token errors as a corrected unapproved draft",
  { skip: !base },
  async (t) => {
    const cookies = new Map<string, string>();
    async function call(path: string, data?: unknown) {
      const form = data instanceof FormData;
      const response = await fetch(base + path, {
        method: data === undefined ? "GET" : "POST",
        headers: {
          Origin: base!,
          Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
          ...(data !== undefined && !form
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body:
          data === undefined
            ? undefined
            : form
              ? (data as FormData)
              : JSON.stringify(data),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const first = cookie.split(";")[0],
          equals = first.indexOf("=");
        cookies.set(first.slice(0, equals), first.slice(equals + 1));
      }
      const body = await response.json();
      assert.equal(response.status, 200, JSON.stringify(body));
      return body;
    }
    let providerCalls = 0;
    const mock = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const request = JSON.parse(Buffer.concat(chunks).toString());
      const input = JSON.parse(request.messages[1].content);
      providerCalls++;
      let output: unknown;
      if (input.task.startsWith("Analyze")) {
        output = {
          learningObjectives: ["Introduce a fictional student."],
          vocabulary: [
            ["我", "ngo5", "I / me"],
            ["係", "hai6", "To be / yes"],
            ["學生", "hok6 saang1", "Student"],
          ].map(([traditional, jyutping, english], i) => ({
            id: `word-${i}`,
            traditional,
            jyutping,
            english,
            example: traditional,
            exampleJyutping: jyutping,
            exampleEnglish: english,
          })),
          expressions: ["我係學生"],
          grammar: ["我係 + role means I am ..."],
          dialogue: ["學生：我係學生。"],
          culturalNotes: [],
        };
      } else {
        const exercise = input.schema.exercises[0];
        output = {
          ...input.schema,
          exercises: [
            {
              ...exercise,
              id: "match-error",
              type: "match",
              options: [],
              answer: "",
              pairs: [
                { left: "學生", right: "Student" },
                { left: "學生", right: "Wrong duplicate" },
              ],
            },
            {
              ...exercise,
              id: "token-error",
              type: "sentence_order",
              options: [],
              answer: "我係學生。",
              tokens: ["學生", "我", "係"],
            },
          ],
        };
      }
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(output) } }],
        }),
      );
    });
    mock.listen(0, "127.0.0.1");
    await once(mock, "listening");
    const address = mock.address();
    assert.ok(address && typeof address !== "string");
    t.after(async () => {
      try {
        await call("/api/developer", {
          action: "save",
          settings: { aiKey: null },
        });
      } finally {
        await new Promise<void>((resolve, reject) =>
          mock.close((e) => (e ? reject(e) : resolve())),
        );
      }
    });
    await call("/api/developer", {
      action: "initialize",
      password: "studio-ai-validation-password",
    });
    await call("/api/data");
    await call("/api/data", { action: "role", role: "volunteer" });
    await call("/api/developer", {
      action: "save",
      settings: {
        aiUrl: `http://127.0.0.1:${address.port}/v1`,
        aiModel: "test-model",
        aiKey: "test-only-studio-ai-canary",
      },
    });
    const form = new FormData();
    form.set(
      "file",
      new File(
        [await readFile("sample-materials/quick-speech-test.txt")],
        "quick-speech-test.txt",
        { type: "text/plain" },
      ),
    );
    const material = await call("/api/studio", form);
    const result = await call("/api/studio", {
      action: "generate",
      sourceId: material.source.id,
      analysis: material.analysis,
      settings: {
        types: ["match", "sentence_order"],
        level: "beginner",
        minutes: 5,
        age: "Adults",
        references: false,
      },
    });
    assert.equal(result.lesson.status, "ai_generated");
    const matching = result.lesson.exercises.find(
      (e: { type: string }) => e.type === "match",
    );
    assert.equal(matching.pairs.length, 3);
    assert.equal(
      new Set(matching.pairs.map((p: { left: string }) => p.left)).size,
      3,
    );
    assert.ok(
      matching.pairs.every((p: { left: string; right: string }) =>
        material.analysis.vocabulary.some(
          (v: { traditional: string; english: string }) =>
            v.traditional === p.left && v.english === p.right,
        ),
      ),
    );
    const sentence = result.lesson.exercises.find(
      (e: { type: string }) => e.type === "sentence_order",
    );
    assert.equal(sentence.tokens.join(""), "我係學生。");
    const stored = await call("/api/data");
    assert.ok(
      stored.drafts.some((l: { id: string }) => l.id === result.lesson.id),
    );
    assert.equal(
      providerCalls,
      2,
      "known structure errors are repaired without another provider request",
    );
  },
);
