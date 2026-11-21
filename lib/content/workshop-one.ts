import { lessonSchema, type Exercise, type Lesson } from "../schema";
import {
  build,
  cards,
  gap,
  listen,
  match,
  quiz,
  speak,
  vocabulary,
  type Phrase,
} from "./course-types";

const id = "workshop-2026-11-13";
const words = vocabulary(`
你好 | Néih hóu | Hello
大家好 | Daaih gā hóu | Hello everyone
早晨 | Jóu sàhn | Good morning
好高興識你 | Hóu gōu hing sīk néih | Nice to meet you
再見 | Joi gin | Goodbye
拜拜 | Bāai baai | Bye-bye
聽日見 | Tīng yaht gin | See you tomorrow
詩 | sī | poem
史 | sí | history
試 | si | try / test
時 | sìh | time
市 | síh | market / city
事 | sih | matter / affair
你叫咩名呀？ | Néih giu mē méng a? | What is your name?
你呢？ | Néih nē? | And you?
你姓咩呀？ | Néih sing mē a? | What is your surname?
叫 | giu | be called
姓 | sing | surname
你係邊度人呀？ | Néih haih bīn douh yàhn a? | Where are you from?
香港 | Hēung Góng | Hong Kong
加納 | Gā Naahp | Ghana
南非 | Nàahm Fēi | South Africa
尼日利亞 | Nèih Yaht Leih A | Nigeria
埃及 | Oi Kahp | Egypt
肯雅 | Háng Ngáh | Kenya
英國 | Yīng Gwok | United Kingdom
美國 | Méih Gwok | United States
印尼 | Yan Nèih | Indonesia
菲律賓 | Fēi Leuht Bān | Philippines
日本 | Yaht Bún | Japan
佐敦 | Jó Dēun | Jordan
旺角 | Wohng Gok | Mong Kok
尖沙咀 | Jīm Sā Jéui | Tsim Sha Tsui
沙田 | Sā Tìhn | Sha Tin
中環 | Jūng Wàahn | Central
油麻地 | Yàuh Màh Déi | Yau Ma Tei
柯士甸 | Ō Sih Dihn | Austin
深水埗 | Sām Séui Bóu | Sham Shui Po
太子 | Taai Jí | Prince Edward
紅磡 | Hùhng Ham | Hung Hom
金鐘 | Gām Jūng | Admiralty
銅鑼灣 | Tùhng Lòh Wāan | Causeway Bay
灣仔 | Wāan Jái | Wan Chai
九龍塘 | Gáu Lùhng Tòhng | Kowloon Tong
荃灣 | Chỳuhn Wāan | Tsuen Wan
大埔墟 | Daaih Bou Hēui | Tai Po Market
元朗 | Yùhn Lóhng | Yuen Long
機場 | Gēi Chèuhng | Airport
你住喺邊度呀？ | Néih jyuh hái bīn douh a? | Where do you live?
`);
const byText = new Map(words.map((entry) => [entry[0], entry]));
function phrase(text: string): Phrase {
  const entry = byText.get(text);
  if (!entry) throw new Error(`Unknown Workshop 1 phrase: ${text}`);
  return entry;
}

const fromGhana: Phrase = [
  "我係加納人。",
  "Ngóh haih Gā Naahp yàhn.",
  "I am from Ghana.",
];
const fromHongKong: Phrase = [
  "我係香港人。",
  "Ngóh haih Hēung Góng yàhn.",
  "I am from Hong Kong.",
];
const fromSouthAfrica: Phrase = [
  "我係南非人。",
  "Ngóh haih Nàahm Fēi yàhn.",
  "I am from South Africa.",
];
const fromEgypt: Phrase = [
  "我喺埃及嚟㗎。",
  "Ngóh hái Oi Kahp làih ga.",
  "I come from Egypt.",
];
const livesInShaTin: Phrase = [
  "我住喺沙田。",
  "Ngóh jyuh hái Sā Tìhn.",
  "I live in Sha Tin.",
];
const livesInMongKok: Phrase = [
  "我住喺旺角。",
  "Ngóh jyuh hái Wohng Gok.",
  "I live in Mong Kok.",
];
const livesInYuenLong: Phrase = [
  "我住喺元朗。",
  "Ngóh jyuh hái Yùhn Lóhng.",
  "I live in Yuen Long.",
];
const livesInJordan: Phrase = [
  "我住喺佐敦。",
  "Ngóh jyuh hái Jó Dēun.",
  "I live in Jordan.",
];
const myNameAmina: Phrase = [
  "我叫 Amina。",
  "Ngóh giu Amina.",
  "My name is Amina.",
];
const myNameDaniel: Phrase = [
  "我叫 Daniel。",
  "Ngóh giu Daniel.",
  "My name is Daniel.",
];
const mySurname: Phrase = [
  "我姓 Chan。",
  "Ngóh sing Chan.",
  "My surname is Chan.",
];
const hello: Phrase = ["你好！", "Néih hóu!", "Hello!"];
const goodbye: Phrase = [
  "好高興識你！拜拜！",
  "Hóu gōu hing sīk néih! Bāai baai!",
  "Nice to meet you! Bye-bye!",
];

type Activity = [key: string, exercise: Partial<Exercise>, terms?: string[]];
type Section = {
  key: string;
  title: string;
  chinese: string;
  description: string;
  points: string[];
  terms: string[];
  examples: Phrase[];
  dialogue?: [speaker: string, phrase: Phrase][];
  activities: Activity[];
};
const greetingChoices = ["大家好", "聽日見", "早晨", "好高興識你"];
const vocabularyMatch = (terms: string[]) =>
  match(terms.map((word) => [word, phrase(word)[2]]));
const explanation = (word: string) => phrase(word).join(" · ");
const grammarGap = (prompt: string, answer: "係" | "喺") =>
  gap(
    prompt,
    answer,
    ["係", "喺"],
    "係 (haih) identifies someone. 喺 (hái) marks a location.",
  );

const sections: Section[] = [
  {
    key: "greetings",
    title: "Greetings",
    chinese: "打招呼",
    description: "Choose a greeting for the person and situation.",
    points: [
      "Say 大家好 to a group, and 早晨 in the morning.",
      "Use 聽日見 when you expect to see the person tomorrow. 都 (dōu) means also or too.",
    ],
    terms: ["你好", "大家好", "早晨", "好高興識你", "再見", "拜拜", "聽日見"],
    examples: [hello, goodbye],
    dialogue: [
      ["Amina (fictional)", hello],
      [
        "Daniel (fictional)",
        [
          "你好！好高興識你！",
          "Néih hóu! Hóu gōu hing sīk néih!",
          "Hello! Nice to meet you!",
        ],
      ],
      [
        "Amina (fictional)",
        [
          "我都好高興識你！",
          "Ngóh dōu hóu gōu hing sīk néih!",
          "Nice to meet you too!",
        ],
      ],
    ],
    activities: [
      ["cards", cards()],
      [
        "morning",
        quiz(
          "You greet a class at 9 am.",
          greetingChoices,
          "早晨",
          explanation("早晨"),
        ),
        ["早晨"],
      ],
      [
        "group",
        quiz(
          "You greet the whole group.",
          greetingChoices,
          "大家好",
          explanation("大家好"),
        ),
        ["大家好"],
      ],
      [
        "meeting",
        quiz(
          "You meet a new classmate.",
          greetingChoices,
          "好高興識你",
          explanation("好高興識你"),
        ),
        ["好高興識你"],
      ],
      [
        "tomorrow",
        quiz(
          "You say goodbye and will meet tomorrow.",
          greetingChoices,
          "聽日見",
          explanation("聽日見"),
        ),
        ["聽日見"],
      ],
      [
        "listen",
        listen(phrase("聽日見"), ["Good morning", "Hello everyone"]),
        ["聽日見"],
      ],
    ],
  },
  {
    key: "tones",
    title: "Pronunciation and tones",
    chinese: "發音同聲調",
    description: "Read Yale tone marks and hear how pitch changes meaning.",
    points: [
      "Level means steady, rising means your voice goes up, and falling means it goes down.",
      "The six examples in tone order are sī (high level), sí (rising), si (mid level), sìh (low falling), síh (low rising), and sih (low level).",
      "The h after the vowel in Ngóh marks a low tone. The initial h in hóu is a consonant.",
    ],
    terms: ["詩", "史", "試", "時", "市", "事", "你好", "早晨", "拜拜"],
    examples: [hello, phrase("早晨"), phrase("拜拜")],
    activities: [
      ["cards", cards()],
      [
        "low",
        quiz(
          "Which set has only low tones?",
          ["sī, sí, si", "sìh, síh, sih", "sī, si, sih"],
          "sìh, síh, sih",
          "The h following the vowel marks a low tone.",
        ),
        ["時", "市", "事"],
      ],
      [
        "rising",
        quiz(
          "Which two example syllables rise?",
          ["sī and si", "sìh and sih", "sí and síh"],
          "sí and síh",
          "Both rising examples have an acute accent.",
        ),
        ["史", "市"],
      ],
      [
        "tone-h",
        quiz(
          "What does the final h in Ngóh show?",
          ["A low tone", "A separate sound"],
          "A low tone",
          "In Ngóh, the h is a tone marker.",
        ),
        ["你好"],
      ],
      [
        "listen",
        {
          ...listen(phrase("市"), []),
          options: ["sī", "sí", "síh", "sih"],
          answer: "síh",
        },
        ["市"],
      ],
      ["speak", speak(hello), ["你好"]],
    ],
  },
  {
    key: "names",
    title: "Names and surnames",
    chinese: "名同姓",
    description:
      "Ask for a name, give your preferred name and return the question.",
    points: [
      "Use 我叫 + your preferred or fictional name. Say the name as you usually do.",
      "姓 (sing) refers to a surname. 你呢？ (Néih nē?) returns a question.",
    ],
    terms: ["你叫咩名呀？", "你呢？", "你姓咩呀？", "叫", "姓"],
    examples: [myNameAmina, myNameDaniel, mySurname],
    dialogue: [
      ["Daniel (fictional)", phrase("你叫咩名呀？")],
      [
        "Amina (fictional)",
        [
          "我叫 Amina。你呢？",
          "Ngóh giu Amina. Néih nē?",
          "My name is Amina. And you?",
        ],
      ],
      ["Daniel (fictional)", myNameDaniel],
    ],
    activities: [
      [
        "name",
        gap(
          "Fictional example: 我＿＿ Daniel。 / Ngóh ＿＿ Daniel.",
          "叫",
          ["叫", "姓", "呢"],
          explanation("叫"),
        ),
        ["叫"],
      ],
      [
        "return",
        gap(
          "And you? 你＿＿？ / Néih ＿＿?",
          "呢",
          ["姓", "呢", "叫"],
          explanation("你呢？"),
        ),
        ["你呢？"],
      ],
      [
        "surname",
        gap(
          "My surname is Chan. 我＿＿ Chan。 / Ngóh ＿＿ Chan.",
          "姓",
          ["呢", "姓", "叫"],
          explanation("姓"),
        ),
        ["姓"],
      ],
      [
        "order",
        {
          ...build(myNameAmina, ["我", "叫 ", "Amina。"]),
          prompt: "Build the fictional example: My name is Amina.",
          jyutping: "",
        },
        ["叫"],
      ],
      [
        "your-name",
        {
          type: "speak",
          instruction: "Say your preferred or fictional name",
          prompt: "Answer 你叫咩名呀？",
          personalPractice: [
            {
              label: "Name",
              traditional: "我叫＿＿。",
              yale: "Ngóh giu ＿＿.",
              english: "My name is ＿＿.",
            },
          ],
        },
        ["你叫咩名呀？", "叫"],
      ],
    ],
  },
  {
    key: "origins",
    title: "Countries and origins",
    chinese: "國家同家鄉",
    description:
      "Ask where someone is from and choose a place for your answer.",
    points: [
      "Use 我係 + place + 人. 係 (haih) means am or are, and 人 (yàhn) means person.",
      "You can also say 我喺 + place + 嚟㗎 or 我嚟自 + place.",
    ],
    terms: [
      "你係邊度人呀？",
      "香港",
      "加納",
      "南非",
      "尼日利亞",
      "埃及",
      "肯雅",
      "英國",
      "美國",
      "印尼",
      "菲律賓",
      "日本",
      "你呢？",
    ],
    examples: [
      fromGhana,
      fromHongKong,
      fromEgypt,
      ["我嚟自加納。", "Ngóh làih jih Gā Naahp.", "I am from Ghana."],
    ],
    dialogue: [
      ["Daniel (fictional)", phrase("你係邊度人呀？")],
      [
        "Amina (fictional)",
        [
          "我係加納人。你呢？",
          "Ngóh haih Gā Naahp yàhn. Néih nē?",
          "I am from Ghana. And you?",
        ],
      ],
      ["Daniel (fictional)", fromHongKong],
    ],
    activities: [
      ["cards", cards()],
      [
        "exchange-identity",
        gap(
          "Amina’s line: 我＿＿加納人。 / Ngóh ＿＿ Gā Naahp yàhn.",
          "係",
          ["係", "你呢", "人"],
          fromGhana.join(" · "),
        ),
        ["加納"],
      ],
      [
        "exchange-return",
        gap(
          "Amina returns the question: ＿＿？ / And you?",
          "你呢",
          ["人", "係", "你呢"],
          explanation("你呢？"),
        ),
        ["你呢？"],
      ],
      [
        "exchange-person",
        gap(
          "Daniel’s line: 我係香港＿＿。 / Ngóh haih Hēung Góng ＿＿.",
          "人",
          ["你呢", "人", "係"],
          fromHongKong.join(" · "),
        ),
        ["香港"],
      ],
      [
        "south-africa",
        quiz(
          "Your place card says South Africa. Answer 你係邊度人呀？",
          [fromGhana[0], fromSouthAfrica[0], fromHongKong[0]],
          fromSouthAfrica[0],
          fromSouthAfrica.join(" · "),
        ),
        ["南非"],
      ],
      [
        "egypt",
        gap(
          "Your card says Egypt. Complete 我喺＿＿嚟㗎。",
          "埃及",
          ["加納", "埃及", "肯雅"],
          fromEgypt.join(" · "),
        ),
        ["埃及"],
      ],
    ],
  },
  {
    key: "mtr",
    title: "Hong Kong places and MTR stations",
    chinese: "香港地方同港鐵站",
    description: "Recognise familiar names on signs and the MTR map.",
    points: [
      "Use the English names to recognise signs and Yale to say the names in Cantonese. 站 (jaahm) means station.",
      "Mong Kok and Mong Kok East are different stations. Sha Tin and Sha Tin Wai are also different.",
    ],
    terms: [
      "佐敦",
      "旺角",
      "尖沙咀",
      "沙田",
      "中環",
      "油麻地",
      "柯士甸",
      "深水埗",
      "太子",
      "紅磡",
      "金鐘",
      "銅鑼灣",
      "灣仔",
      "九龍塘",
      "荃灣",
      "大埔墟",
      "元朗",
      "機場",
    ],
    examples: [phrase("佐敦"), phrase("深水埗")],
    activities: [
      [
        "match-places",
        vocabularyMatch(["佐敦", "深水埗", "沙田", "中環"]),
        ["佐敦", "深水埗", "沙田", "中環"],
      ],
      ["listen", listen(phrase("旺角"), ["Tsim Sha Tsui", "Jordan"]), ["旺角"]],
    ],
  },
  {
    key: "residence",
    title: "Where you live",
    chinese: "住喺邊度",
    description: "Say where you live using a real or fictional area.",
    points: [
      "Use 我 + 住喺 + place. 住 (jyuh) means live, and 喺 (hái) marks the location.",
      "An area or city is enough for this exercise. Your home and your place of origin can differ.",
    ],
    terms: ["你住喺邊度呀？", "你係邊度人呀？", "旺角", "沙田", "元朗", "南非"],
    examples: [livesInMongKok, livesInShaTin],
    dialogue: [
      ["Amina (fictional)", phrase("你住喺邊度呀？")],
      [
        "Daniel (fictional)",
        [
          "我住喺旺角。你呢？",
          "Ngóh jyuh hái Wohng Gok. Néih nē?",
          "I live in Mong Kok. And you?",
        ],
      ],
      ["Amina (fictional)", livesInShaTin],
    ],
    activities: [
      [
        "daniel",
        quiz(
          "Daniel’s fictional card: from Hong Kong, lives in Mong Kok. Answer 你住喺邊度呀？",
          [fromHongKong[0], livesInMongKok[0], livesInShaTin[0]],
          livesInMongKok[0],
          livesInMongKok.join(" · "),
        ),
        ["旺角"],
      ],
      [
        "amina",
        quiz(
          "Amina’s fictional card: from Ghana, lives in Sha Tin. Answer 你住喺邊度呀？",
          [livesInMongKok[0], fromGhana[0], livesInShaTin[0]],
          livesInShaTin[0],
          livesInShaTin.join(" · "),
        ),
        ["沙田"],
      ],
      [
        "maya-origin",
        quiz(
          "Maya’s fictional card: from South Africa, lives in Yuen Long. Answer 你係邊度人呀？",
          [fromSouthAfrica[0], livesInYuenLong[0], livesInShaTin[0]],
          fromSouthAfrica[0],
          fromSouthAfrica.join(" · "),
        ),
        ["南非"],
      ],
      [
        "maya-home",
        quiz(
          "Maya’s fictional card: from South Africa, lives in Yuen Long. Answer 你住喺邊度呀？",
          [livesInMongKok[0], livesInYuenLong[0], fromSouthAfrica[0]],
          livesInYuenLong[0],
          livesInYuenLong.join(" · "),
        ),
        ["元朗"],
      ],
      ["speak", speak(livesInShaTin), ["沙田"]],
    ],
  },
  {
    key: "introduction",
    title: "Introduce yourself",
    chinese: "自我介紹",
    description: "Put your greeting, name, origin and home together.",
    points: [
      "Use details you choose. Amina, Daniel and Maya are fictional practice characters.",
      "Read your introduction aloud, then try it once from memory.",
    ],
    terms: [
      "你好",
      "你叫咩名呀？",
      "你係邊度人呀？",
      "你住喺邊度呀？",
      "你呢？",
    ],
    examples: [hello, myNameAmina, fromGhana, livesInShaTin, goodbye],
    activities: [
      [
        "your-introduction",
        {
          type: "speak",
          instruction: "Build and say your introduction",
          prompt:
            "Start with 你好！ (Néih hóu!). Finish with 好高興識你！拜拜！ (Hóu gōu hing sīk néih! Bāai baai!).",
          personalPractice: [
            {
              label: "Name",
              traditional: "我叫＿＿。",
              yale: "Ngóh giu ＿＿.",
              english: "My name is ＿＿.",
            },
            {
              label: "Place of origin",
              traditional: "我係＿＿人。",
              yale: "Ngóh haih ＿＿ yàhn.",
              english: "I am from ＿＿.",
            },
            {
              label: "City or area where you live",
              traditional: "我住喺＿＿。",
              yale: "Ngóh jyuh hái ＿＿.",
              english: "I live in ＿＿.",
            },
          ],
        },
      ],
    ],
  },
  {
    key: "review",
    title: "Workshop review",
    chinese: "工作坊溫習",
    description: "Review the written exercises and check what you can say.",
    points: [
      "Use 你叫咩名呀？ for names, 你係邊度人呀？ for origins, and 你住喺邊度呀？ for homes.",
      "Read the whole sentence before choosing between 係 (haih) and 喺 (hái).",
    ],
    terms: [
      "你叫咩名呀？",
      "你姓咩呀？",
      "你係邊度人呀？",
      "你住喺邊度呀？",
      "沙田",
      "南非",
      "深水埗",
    ],
    examples: [livesInJordan, fromSouthAfrica],
    activities: [
      [
        "questions",
        match([
          ["你叫咩名呀？", myNameDaniel[0]],
          ["你係邊度人呀？", fromGhana[0]],
          ["你住喺邊度呀？", livesInJordan[0]],
          ["你姓咩呀？", mySurname[0]],
        ]),
        ["你叫咩名呀？", "你姓咩呀？", "你係邊度人呀？", "你住喺邊度呀？"],
      ],
      [
        "order-home",
        { ...build(livesInShaTin, ["我", "住喺", "沙田。"]), jyutping: "" },
        ["沙田"],
      ],
      [
        "order-origin",
        {
          ...build(fromSouthAfrica, ["我", "係", "南非", "人。"]),
          jyutping: "",
        },
        ["南非"],
      ],
      [
        "order-name",
        {
          ...build(phrase("你叫咩名呀？"), ["你", "叫", "咩", "名", "呀？"]),
          jyutping: "",
        },
        ["你叫咩名呀？"],
      ],
      [
        "haih-origin",
        grammarGap("我＿＿加納人。 / Ngóh ＿＿ Gā Naahp yàhn.", "係"),
        ["你係邊度人呀？"],
      ],
      [
        "hai-home",
        grammarGap("我住＿＿元朗。 / Ngóh jyuh ＿＿ Yùhn Lóhng.", "喺"),
        ["你住喺邊度呀？"],
      ],
      [
        "haih-question",
        grammarGap("你＿＿邊度人呀？ / Néih ＿＿ bīn douh yàhn a?", "係"),
        ["你係邊度人呀？"],
      ],
      [
        "hai-question",
        grammarGap("你住＿＿邊度呀？ / Néih jyuh ＿＿ bīn douh a?", "喺"),
        ["你住喺邊度呀？"],
      ],
      [
        "meaning",
        quiz(
          "我係南非人。我住喺深水埗。",
          [
            "I am from Hong Kong. I live in Sha Tin.",
            "I am from South Africa. I live in Sham Shui Po.",
            "I am from Ghana. I live in Mong Kok.",
          ],
          "I am from South Africa. I live in Sham Shui Po.",
          "Ngóh haih Nàahm Fēi yàhn. Ngóh jyuh hái Sām Séui Bóu.",
        ),
        ["南非", "深水埗"],
      ],
    ],
  },
];

function example([traditional, jyutping, english]: Phrase) {
  return { traditional, jyutping, english };
}

const exercises: Exercise[] = [];
const moduleSections = sections.map((section, index) => {
  const sectionId = `${id}-${section.key}`;
  const activities = section.activities.map(
    ([key, activity, tags], position) => {
      const options = activity.options ?? [];
      const offset = options.length ? (index + position) % options.length : 0;
      return {
        id: `${sectionId}-${key}`,
        type: activity.type!,
        instruction: activity.instruction!,
        prompt: activity.prompt!,
        jyutping: "",
        english: "",
        answer: "",
        explanation: "Review the examples from this section and try again.",
        difficulty: 1,
        tags: tags ?? section.terms,
        ...activity,
        options: [...options.slice(offset), ...options.slice(0, offset)],
      };
    },
  );
  exercises.push(...activities);
  return {
    id: sectionId,
    title: section.title,
    title_zh: section.chinese,
    description: section.description,
    teachingPoints: section.points,
    examples: section.examples.map(example),
    dialogue:
      section.dialogue?.map(([speaker, line]) => ({
        speaker,
        ...example(line),
      })) ?? [],
    vocabularyIds: section.terms.map((term) => `${id}-v-${term}`),
    exerciseIds: activities.map((activity) => activity.id),
  };
});

export const workshopOne: Lesson = lessonSchema.parse({
  id,
  title: "Workshop 1 · Greetings and introductions",
  title_zh: "工作坊一 · 打招呼同自我介紹",
  description:
    "Practise the Cantonese you learned at the 13 November 2026 workshop.",
  level: "beginner",
  estimated_minutes: 30,
  icon: "👋",
  topic: "Everyday interactions",
  workshop: "Cantonese Workshop 1 · 13 November 2026",
  learningObjectives: [
    "Greet someone and recognise the six Cantonese tones.",
    "Ask and answer questions about names, origins and where you live.",
    "Recognise familiar Hong Kong places and MTR stations.",
    "Give a short introduction with details you choose.",
  ],
  vocabulary: words.map(([traditional, jyutping, english]) => ({
    id: `${id}-v-${traditional}`,
    traditional,
    jyutping,
    english,
    example: traditional,
    exampleJyutping: jyutping,
    exampleEnglish: english,
  })),
  grammar: [
    "我叫 + name",
    "我姓 + surname",
    "我係 + place + 人",
    "我住喺 + place",
  ],
  culturalNotes: [],
  module: {
    unit: 1,
    introduction:
      "Review the greetings and getting-to-know-you phrases from Workshop 1.",
    situation: "Meet a workshop partner and take turns introducing yourselves.",
    romanisation: "yale",
    sections: moduleSections,
    references: [
      {
        title: "Workshop presentation slides · text edition",
        url: "/workshop-materials/workshop-1/slides.html",
      },
      {
        title: "Student notes and exercises · text edition",
        url: "/workshop-materials/workshop-1/student-notes.html",
      },
    ],
  },
  exercises,
  roleplay: {
    scenario: "Meet a workshop partner and practise a short introduction.",
    studentRole: "Workshop learner using a name of their choice",
    aiRole: "Workshop practice partner",
    allowedVocabulary: words.map(([traditional]) => traditional),
    goal: "Practise a greeting and ask about a name, origin or home.",
  },
  status: "published",
  version: 1,
  origin: "human",
  createdBy: "system",
  createdAt: "2026-11-13T00:00:00Z",
  updatedAt: "2026-11-13T00:00:00Z",
});
