import { curriculumModules } from "./content/modules";
import { Lesson, Vocabulary, Exercise, lessonSchema } from "./schema";
const rows = [
  {
    id: "start",
    zh: "開始學廣東話",
    title: "Your first Cantonese steps",
    icon: "🧭",
    topic: "Getting started",
    desc: "A little listening, a little speaking. Your Hong Kong adventure starts here.",
    words: [
      ["你好", "nei5 hou2", "Hello"],
      ["早晨", "zou2 san4", "Good morning"],
      ["再見", "zoi3 gin3", "Goodbye"],
    ],
    sentence: ["我", "學", "廣東話"],
    jp: "ngo5 hok6 gwong2 dung1 waa2",
    en: "I learn Cantonese",
    scenario: "You arrive at a morning workshop. How do you greet everyone?",
    answer: "早晨",
    culture:
      "Jyutping is a sound guide. Numbers 1–6 show Cantonese tones; listen first and copy gently.",
  },
  {
    id: "greetings",
    zh: "打招呼",
    title: "Hello, new friend",
    icon: "👋",
    topic: "Greetings",
    desc: "Meet someone new at your workshop. A friendly hello goes a long way.",
    words: [
      ["你好", "nei5 hou2", "Hello"],
      ["早晨", "zou2 san4", "Good morning"],
      ["再見", "zoi3 gin3", "Goodbye"],
    ],
    sentence: ["你", "好"],
    jp: "nei5 hou2",
    en: "Hello",
    scenario: "A new learner joins your workshop. What would you say first?",
    answer: "你好",
    culture:
      "早晨 is a friendly morning greeting. Wave and say 再見 when the workshop ends.",
  },
  {
    id: "introductions",
    zh: "自我介紹",
    title: "Nice to meet you",
    icon: "💬",
    topic: "Introductions",
    desc: "Share a pretend name, ask a question, and make a workshop friend.",
    words: [
      ["我叫小晴", "ngo5 giu3 siu2 cing4", "My name is Siu Ching"],
      ["你叫咩名？", "nei5 giu3 me1 meng2", "What is your name?"],
      ["我鍾意畫畫", "ngo5 zung1 ji3 waak6 waa2", "I like drawing"],
      [
        "我嚟自香港",
        "ngo5 lai4 zi6 hoeng1 gong2",
        "I come from Hong Kong (pretend place)",
      ],
      [
        "你鍾唔鍾意畫畫？",
        "nei5 zung1 m4 zung1 ji3 waak6 waa2",
        "Do you like drawing?",
      ],
    ],
    sentence: ["我", "叫", "小晴"],
    jp: "ngo5 giu3 siu2 cing4",
    en: "My name is Siu Ching",
    scenario:
      "A workshop buddy asks your name. Use the pretend name Siu Ching.",
    answer: "我叫小晴",
    culture:
      "Practise with a pretend name. You never need to share your real name, school, or address.",
  },
  {
    id: "manners",
    zh: "有禮貌",
    title: "Little words, big kindness",
    icon: "🌼",
    topic: "Manners",
    desc: "Say thanks, ask for help, and practise kindness in everyday Hong Kong.",
    words: [
      ["唔該", "m4 goi1", "Thank you for helping"],
      ["對唔住", "deoi3 m4 zyu6", "Sorry"],
      ["多謝", "do1 ze6", "Thank you for a gift"],
      ["唔使客氣", "m4 sai2 haak3 hei3", "You are welcome"],
      ["唔該幫我", "m4 goi1 bong1 ngo5", "Please help me"],
    ],
    sentence: ["唔該", "幫", "我"],
    jp: "m4 goi1 bong1 ngo5",
    en: "Please help me",
    scenario:
      "You accidentally bump into someone at the community centre. What do you say?",
    answer: "對唔住",
    culture:
      "唔該 commonly thanks someone for a service. 多謝 commonly thanks someone for a gift or a compliment.",
  },
];
export function makeExercises(
  id: string,
  words: Vocabulary[],
  sentence: string[],
  jp: string,
  en: string,
  scenario: string,
  answer: string,
): Exercise[] {
  const base = {
    difficulty: 1,
    explanation: "Listen, look, and try again. Small steps count!",
    tags: [words[0].traditional],
    jyutping: "",
    english: "",
    options: [],
    answer: "",
  };
  const make = (type: Exercise["type"], data: Partial<Exercise>): Exercise => ({
    ...base,
    id: `${id}-${type}`,
    type,
    instruction: "Choose the best answer",
    prompt: words[0].traditional,
    ...data,
  });
  return [
    make("flashcard", {
      instruction: "Meet your workshop words",
      jyutping: words[0].jyutping,
      english: words[0].english,
    }),
    make("listen_choose", {
      instruction: "Listen and choose the meaning",
      jyutping: words[0].jyutping,
      options: words.map((w) => w.english),
      answer: words[0].english,
      explanation: `${words[0].traditional} means “${words[0].english}”.`,
    }),
    make("match", {
      instruction: "Match the words with their meanings",
      prompt: `Make ${words.length} pairs`,
      pairs: words.map((w) => ({ left: w.traditional, right: w.english })),
    }),
    make("sentence_order", {
      instruction: "Build the sentence",
      prompt: en,
      tokens: sentence,
      answer: sentence.join(""),
      jyutping: jp,
      explanation: `${sentence.join("")} · ${jp} · ${en}`,
    }),
    make("fill_blank", {
      instruction: "Fill in the missing word",
      prompt: `Complete: ${sentence.slice(0, -1).join("")} ___`,
      answer: sentence.at(-1)!,
      options: [sentence.at(-1)!, words[1].traditional, words[2].traditional],
      explanation: `The full phrase is ${sentence.join("")}.`,
    }),
    make("speak", {
      instruction: "Listen, then try saying it",
      prompt: words[0].traditional,
      jyutping: words[0].jyutping,
      english: words[0].english,
      answer: words[0].traditional,
    }),
    make("conversation_choice", {
      instruction: "Your workshop buddy says…",
      prompt: words[0].traditional,
      options: words.map((w) => w.traditional),
      answer: words[0].traditional,
      explanation:
        "A friendly greeting or response keeps the conversation going.",
    }),
    make("scenario", {
      instruction: "What would you say?",
      prompt: scenario,
      options: words.map((w) => w.traditional),
      answer,
      tags: [answer],
      explanation: `In this situation, try 「${answer}」.`,
    }),
    make("ai_roleplay", {
      instruction: "Try a little conversation",
      prompt:
        "Practise with your workshop buddy. Use the suggested replies; no personal details needed.",
    }),
    make("multiple_choice", {
      instruction: "One last challenge",
      prompt: words[1].english,
      options: words.map((w) => w.traditional),
      answer: words[1].traditional,
      tags: [words[1].traditional],
      explanation: `${words[1].traditional} · ${words[1].jyutping}`,
    }),
  ];
}
export const legacySeedLessons: Lesson[] = rows.map((r, i) => {
  const vocabulary = r.words.map(([traditional, jyutping, english], n) => ({
    id: `${r.id}-v${n}`,
    traditional,
    jyutping,
    english,
    example: traditional,
    exampleJyutping: jyutping,
    exampleEnglish: english,
  }));
  return lessonSchema.parse({
    id: r.id,
    title: r.title,
    title_zh: r.zh,
    description: r.desc,
    level: "beginner",
    estimated_minutes: i === 0 ? 5 : 10,
    icon: r.icon,
    topic: r.topic,
    workshop: "Saturday community workshop",
    learningObjectives: [
      `Practise ${r.topic.toLowerCase()} after your workshop.`,
      `Listen and respond in simple Cantonese.`,
    ],
    vocabulary,
    grammar:
      i === 2
        ? [
            "我叫 + pretend name",
            "你鍾唔鍾意畫畫？ is an A-not-A question: Do you like drawing?",
          ]
        : ["Put the person before the action: 我 + 學 + 廣東話."],
    culturalNotes: [
      ...(i === 0
        ? [
            {
              title: "Three little tools",
              body: "Listen: tap the speaker. Speak: tap the microphone, then replay your recording. Save: tap the bookmark on a word card to keep it in your wordbook.",
            },
          ]
        : []),
      {
        title: i === 0 ? "Your sound companion" : "A little Hong Kong know-how",
        body: r.culture,
      },
    ],
    exercises: makeExercises(
      r.id,
      vocabulary,
      r.sentence,
      r.jp,
      r.en,
      r.scenario,
      r.answer,
    ),
    roleplay: {
      scenario: r.scenario,
      studentRole: "Workshop learner using a pretend name",
      aiRole: "Friendly workshop buddy",
      allowedVocabulary: vocabulary.map((v) => v.traditional),
      goal: "Try three short replies using today’s workshop words.",
    },
    status: "published",
    version: 1,
    origin: "human",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  });
});
// Original prototype material, not reproduced from the curriculum reference.
export const demoMaterial =
  "Workshop Demo — 茶餐廳\nGoal: order a drink politely.\n奶茶 | naai5 caa4 | Milk tea\n凍水 | dung3 seoi2 | Cold water\n唔該 | m4 goi1 | Please / thank you for service\n我想要奶茶 | ngo5 soeng2 jiu3 naai5 caa4 | I would like milk tea\nCulture: A 茶餐廳 is a Hong Kong-style café. Use 唔該 when asking for service.\nDialogue: 唔該，我想要奶茶。";

export const seedLessons = curriculumModules;
