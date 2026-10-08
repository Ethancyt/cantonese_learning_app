import { structureWorkshop } from "../content/structure";
import {
  Analysis,
  analysisSchema,
  exerciseTypes,
  Lesson,
  lessonSchema,
  Source,
} from "../schema";
import { makeExercises } from "../seeds";
import { provider } from "./provider";
import { normalizeAIProvenance } from "./provenance";
import { completeLessonResponse } from "./lesson-response";
import { validatedAI } from "./validated";
function promptSource(source: Source) {
  return {
    id: source.id,
    filename: source.filename,
    chunks: source.chunks,
  };
}
function groundedAnalysisSchema(source: Source) {
  return analysisSchema.superRefine((analysis, ctx) => {
    for (const [index, vocabulary] of analysis.vocabulary.entries())
      if (
        !source.chunks.some((chunk) =>
          chunk.text.includes(vocabulary.traditional),
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["vocabulary", index, "traditional"],
          message: "Vocabulary is not grounded in the workshop source.",
        });
  });
}
export function grounded(
  analysis: Analysis,
  source: Source,
  generatedByAI = false,
) {
  for (const v of analysis.vocabulary) {
    const chunk = source.chunks.find((c) => c.text.includes(v.traditional));
    if (!chunk)
      throw new Error("Vocabulary is not grounded in the workshop source.");
    v.provenance = {
      sourceMaterialId: source.id,
      sourceChunk: chunk.index,
      sourcePage: chunk.page,
      sourceExcerpt: chunk.text.slice(0, 1500),
      generatedByAI,
    };
  }
  return analysis;
}
export async function analyze(
  source: Source,
): Promise<{ analysis: Analysis; mode: string }> {
  const ai = await provider();
  if (ai) {
    const result = await validatedAI(
      ai,
      {
        task: "Analyze source and return learningObjectives:string[], vocabulary:{id,traditional,jyutping,english,example,exampleJyutping,exampleEnglish}[], expressions:string[],grammar:string[],dialogue:string[], culturalNotes:{title,body}[]",
        responseLimits: {
          vocabulary:
            "Select up to 20 key source words or phrases, without duplicates.",
          summaries: "Return up to 6 concise entries in each other collection.",
          wording:
            "Use short phrases and one short example per word. Keep English meanings and translations concise; do not add paragraphs or alternative examples.",
          provenance:
            "Omit provenance and source excerpts; the server assigns them after verification.",
        },
        source: promptSource(source),
        schema: {
          learningObjectives: ["A source-based learning goal"],
          vocabulary: [
            {
              id: "unique-id",
              traditional: "Exact source vocabulary",
              jyutping: "Jyutping with tone numbers",
              english: "English meaning",
              example: "Traditional Chinese example from the source",
              exampleJyutping: "Example Jyutping",
              exampleEnglish: "Example English meaning",
            },
          ],
          expressions: ["Source expression"],
          grammar: ["Source grammar point"],
          dialogue: ["Source dialogue line"],
          culturalNotes: [
            { title: "Source note", body: "Source-based explanation" },
          ],
        },
      },
      groundedAnalysisSchema(source),
      normalizeAIProvenance,
      "analysis",
    );
    return {
      analysis: grounded(result, source, true),
      mode: "AI-assisted",
    };
  }
  const vocabulary = source.text
    .split(/\r?\n/)
    .flatMap((line, i) => {
      const parts = line.split("|").map((x) => x.trim());
      if (
        parts.length !== 3 ||
        !/[\u3400-\u9fff]/.test(parts[0]) ||
        !/[1-6]/.test(parts[1])
      )
        return [];
      return [
        {
          id: `${source.id}-v${i}`,
          traditional: parts[0],
          jyutping: parts[1],
          english: parts[2],
          example: parts[0],
          exampleJyutping: parts[1],
          exampleEnglish: parts[2],
        },
      ];
    })
    .slice(0, 30);
  if (!vocabulary.length)
    throw new Error(
      "Demo extraction needs lines in this format: 你好 | nei5 hou2 | Hello. Add at least one workshop word with Jyutping and an English meaning, or configure an AI provider.",
    );
  const lines = source.text.split(/\r?\n/);
  return {
    analysis: grounded(
      analysisSchema.parse({
        learningObjectives: lines
          .filter((l) => /^Goal:/i.test(l))
          .map((l) => l.replace(/^Goal:\s*/i, "")).length
          ? lines
              .filter((l) => /^Goal:/i.test(l))
              .map((l) => l.replace(/^Goal:\s*/i, ""))
          : ["Practise the words in this workshop."],
        vocabulary,
        expressions: vocabulary
          .filter((v) => v.traditional.length > 3)
          .map((v) => v.traditional),
        grammar: lines
          .filter((l) => /^Grammar:/i.test(l))
          .map((l) => l.replace(/^Grammar:\s*/i, "")),
        dialogue: lines
          .filter((l) => /^Dialogue:/i.test(l))
          .map((l) => l.replace(/^Dialogue:\s*/i, "")),
        culturalNotes: lines
          .filter((l) => /^Culture:/i.test(l))
          .map((l) => ({
            title: "From your workshop",
            body: l.replace(/^Culture:\s*/i, ""),
          })),
      }),
      source,
    ),
    mode: "Demo · source-based extraction",
  };
}
export async function generate(
  source: Source,
  analysis: Analysis,
  settings: {
    types: string[];
    level: string;
    minutes: number;
    age: string;
    references: boolean;
  },
  references: Lesson[],
): Promise<{ lesson: Lesson; mode: string }> {
  const id = crypto.randomUUID(),
    now = new Date().toISOString();
  const ai = await provider();
  grounded(analysis, source, !!ai);
  if (!ai && settings.level !== "beginner")
    throw new Error(
      "Demo generation supports beginner practice. Connect an AI provider for other levels.",
    );
  let lesson: Lesson;
  if (ai) {
    const style = references
      .map((l) => ({
        overlap: l.vocabulary.filter((v) =>
          analysis.vocabulary.some((w) => w.traditional === v.traditional),
        ).length,
        lesson: l,
      }))
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 2)
      .filter((x) => x.overlap > 0)
      .map((x) => ({
        title: x.lesson.title,
        level: x.lesson.level,
        exerciseStyles: x.lesson.exercises.map((e) => ({
          type: e.type,
          instruction: e.instruction,
        })),
      }));
    lesson = await validatedAI(
      ai,
      {
        task: "Create lesson. Use only selected exercise types. Return the complete compact response matching schema; the server adds reviewed content and metadata.",
        responseLimits: {
          activities: `Return at most ${Math.max(settings.types.length, Math.min(20, Math.ceil(settings.minutes * 1.2)))} activities, including each selected type.`,
          wording:
            "One short instruction and one-sentence explanation per activity. At most 4 options or 5 matching pairs. Omit empty optional fields.",
          provenance:
            "Only sourceChunk and sourceExcerpt on each exercise; use an exact quote of at most 120 characters. Never copy whole source chunks.",
          serverFields:
            "Omit vocabulary, learningObjectives, grammar, culturalNotes, module, audio, authorship, IDs and version metadata at lesson level. The server preserves the reviewed analysis.",
        },
        activityRules: {
          match:
            "Include pairs:[{left,right}] with 2–5 Cantonese-to-English pairs from approvedAnalysis.vocabulary. Every left value and every right value must be unique. Do not repeat a word or meaning.",
          sentence_order:
            "Include tokens:string[] in the CORRECT answer order, not shuffled. tokens.join('') must equal answer exactly, including spaces and punctuation. The website shuffles their display.",
          choice:
            "For multiple_choice, listen_choose, conversation_choice, and scenario, include at least two distinct options. answer must exactly match one option.",
          answers:
            "Include a nonempty answer for fill_blank and speak. Use unique exercise IDs and keep source metadata inside provenance.",
        },
        source: promptSource(source),
        approvedAnalysis: {
          ...analysis,
          vocabulary: analysis.vocabulary.map(
            ({ provenance: _provenance, ...word }) => word,
          ),
        },
        settings,
        styleReferences: settings.references ? style : [],
        schema: {
          title: "English title",
          title_zh: "Traditional Chinese title",
          description: "short",
          icon: "☕",
          topic: "topic",
          exercises: [
            {
              id: "unique",
              type: settings.types[0],
              instruction: "short",
              prompt: "prompt",
              jyutping: "Jyutping",
              english: "meaning",
              options: ["a", "b"],
              answer: "a",
              explanation: "short",
              difficulty: 1,
              tags: [analysis.vocabulary[0].traditional],
              pairs: undefined,
              tokens: undefined,
              provenance: {
                sourceChunk: analysis.vocabulary[0].provenance?.sourceChunk,
                sourceExcerpt: analysis.vocabulary[0].traditional,
              },
            },
          ],
          roleplay: {
            scenario: "workshop",
            studentRole: "learner",
            aiRole: "buddy",
            goal: "simple",
          },
        },
      },
      lessonSchema,
      (response) =>
        completeLessonResponse(response, source, analysis, settings, id, now),
      "lesson",
    );
  } else {
    const words = analysis.vocabulary;
    const first = words[0];
    const exercises = makeExercises(
      id,
      words.length >= 3
        ? words.slice(0, 3)
        : [
            first,
            ...Array.from({ length: 2 }, (_, i) => ({
              ...first,
              id: `extra-${i}`,
              traditional: i === 0 ? "再試一次" : "聽清楚先",
              english: i === 0 ? "Try again" : "Listen first",
            })),
          ],
      [first.traditional],
      first.jyutping,
      first.english,
      `At this workshop, which phrase means “${first.english}”?`,
      first.traditional,
    ).filter((e) => settings.types.includes(e.type));
    for (const e of exercises) {
      e.provenance = first.provenance;
      if (
        [
          "multiple_choice",
          "listen_choose",
          "conversation_choice",
          "scenario",
          "fill_blank",
        ].includes(e.type)
      ) {
        e.options = words.map((w) =>
          e.type === "listen_choose" ? w.english : w.traditional,
        );
        if (e.options.length < 2) e.options.push("I am not sure yet");
        e.answer =
          e.type === "listen_choose" ? first.english : first.traditional;
      }
      if (e.type === "match") {
        e.pairs = words.map((w) => ({ left: w.traditional, right: w.english }));
        e.prompt = `Match ${words.length} workshop words with their meanings`;
      }
      e.tags = [first.traditional];
    }
    lesson = lessonSchema.parse({
      id,
      title: "Your workshop practice",
      title_zh: source.filename.includes("茶餐廳") ? "去茶餐廳" : "工作坊練習",
      description: "A little practice made from your workshop material.",
      level: settings.level,
      estimated_minutes: settings.minutes,
      icon: source.filename.includes("茶餐廳") ? "☕" : "📚",
      topic: "Workshop practice",
      workshop: source.filename,
      availability: "available",
      learningObjectives: analysis.learningObjectives,
      vocabulary: words,
      grammar: analysis.grammar,
      culturalNotes: analysis.culturalNotes,
      exercises,
      roleplay: {
        scenario: "Practise today’s workshop words with a friendly buddy.",
        studentRole: "Workshop learner",
        aiRole: "Workshop buddy",
        allowedVocabulary: words.map((w) => w.traditional),
        goal: "Use three workshop phrases.",
      },
      status: "ai_generated",
      version: 1,
      origin: "assisted",
      createdBy: source.createdBy,
      createdAt: now,
      updatedAt: now,
      sourceMaterialId: source.id,
    });
  }
  for (const v of lesson.vocabulary) {
    const reviewed = analysis.vocabulary.find(
      (w) => w.traditional === v.traditional,
    );
    if (!reviewed)
      throw new Error(
        "Generated vocabulary must remain within the reviewed source.",
      );
    v.provenance = reviewed.provenance;
  }
  for (const e of lesson.exercises) {
    if (!settings.types.includes(e.type) || !exerciseTypes.includes(e.type))
      throw new Error("The provider returned an unselected exercise type.");
    const p = e.provenance;
    if (
      !p ||
      p.sourceMaterialId !== source.id ||
      !source.chunks.some(
        (c) => c.index === p.sourceChunk && c.text.includes(p.sourceExcerpt),
      )
    )
      throw new Error("Generated activity needs verified source provenance.");
  }
  return {
    lesson: lessonSchema.parse(structureWorkshop(lesson, analysis)),
    mode: ai
      ? "AI-generated · review required"
      : "Demo · template-generated, review required",
  };
}
