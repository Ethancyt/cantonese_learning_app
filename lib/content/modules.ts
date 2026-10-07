import {
  Exercise,
  Lesson,
  Vocabulary,
  lessonSchema,
  ModuleSection,
} from "../schema";
// Original workshop scenarios. Only the four topic headings were supplied from
// the curriculum reference; no EduHK educational assets or dialogue are copied.
const reference = {
  title: "EduHK Survival Cantonese · topic reference",
  url: "https://www.eduhk.hk/cle/resources/cep/cantonese-survival-package/index.html",
  adaptation: "original" as const,
};
type Phrase = [string, string, string, string, string, string];
type Part = {
  title: string;
  zh: string;
  description: string;
  points: string[];
  words: number[];
  dialogue: [string, string, string, string][];
  activities: Partial<Exercise>[];
};
type Definition = {
  id: string;
  zh: string;
  title: string;
  icon: string;
  topic: string;
  intro: string;
  situation: string;
  objectives: string[];
  phrases: Phrase[];
  parts: Part[];
  culture: string;
  goal: string;
};
const definitions: Definition[] = [
  {
    id: "start",
    zh: "開始學廣東話",
    title: "Getting started with Cantonese",
    icon: "🧭",
    topic: "Introduction and useful tools",
    intro:
      "Refresh the tools your volunteer showed you. Learn how a Cantonese phrase, its sound guide, and its meaning work together before your first conversation.",
    situation:
      "You have arrived at a community workshop. Your buddy shows you how to listen, speak, and keep useful phrases.",
    objectives: [
      "Read Traditional Chinese, Jyutping, and English together.",
      "Recognize that the final Jyutping number identifies a tone.",
      "Use listening, recording, and your wordbook to practise after a workshop.",
    ],
    phrases: [
      [
        "你好",
        "nei5 hou2",
        "Hello",
        "你好，朋友！",
        "nei5 hou2, pang4 jau5!",
        "Hello, friend!",
      ],
      [
        "早晨",
        "zou2 san4",
        "Good morning",
        "早晨，大家！",
        "zou2 san4, daai6 gaa1!",
        "Good morning, everyone!",
      ],
      [
        "再見",
        "zoi3 gin3",
        "Goodbye",
        "再見，聽日見！",
        "zoi3 gin3, ting1 jat6 gin3!",
        "Goodbye, see you tomorrow!",
      ],
      [
        "廣東話",
        "gwong2 dung1 waa2",
        "Cantonese",
        "我學廣東話。",
        "ngo5 hok6 gwong2 dung1 waa2.",
        "I learn Cantonese.",
      ],
      [
        "聽",
        "teng1",
        "Listen",
        "我聽廣東話。",
        "ngo5 teng1 gwong2 dung1 waa2.",
        "I listen to Cantonese.",
      ],
      [
        "講",
        "gong2",
        "Speak",
        "我講廣東話。",
        "ngo5 gong2 gwong2 dung1 waa2.",
        "I speak Cantonese.",
      ],
    ],
    culture:
      "Hong Kong Cantonese is used in everyday conversations. Traditional Chinese shows the written phrase; Jyutping helps you connect it to its sound. A device needs a Cantonese voice to play our listening examples.",
    goal: "Practise saying hello and goodbye with a workshop buddy.",
    parts: [
      {
        title: "Three ways to meet a phrase",
        zh: "睇字、睇音、睇意思",
        description:
          "Use one complete greeting to connect writing, sound, and meaning.",
        points: [
          "你好 is the written phrase.",
          "nei5 hou2 is its Jyutping sound guide.",
          "“Hello” explains what the whole phrase means.",
        ],
        words: [0, 1, 2],
        dialogue: [
          ["Buddy", "你好！", "nei5 hou2!", "Hello!"],
          ["You", "你好！", "nei5 hou2!", "Hello!"],
        ],
        activities: [
          {
            type: "flashcard",
            instruction: "Explore the workshop greetings",
            prompt: "Meet three useful phrases",
          },
          {
            type: "multiple_choice",
            instruction: "Find the sound guide",
            prompt: "Which line is Jyutping for 你好?",
            options: ["nei5 hou2", "Hello", "Goodbye"],
            answer: "nei5 hou2",
            tags: ["你好"],
            explanation: "Letters describe sounds; the numbers mark tones.",
          },
        ],
      },
      {
        title: "Listen for the tone",
        zh: "聽一聽聲調",
        description:
          "Start by listening. You do not have to master six tones today.",
        points: [
          "In Jyutping, the number after each syllable marks its tone.",
          "Tone 1 is high, 2 rises, 3 is mid, 4 is low and falling, 5 rises from low, and 6 is low level.",
          "For 你好, listen to nei5 and hou2, then copy gently. A word check is not a tone score.",
        ],
        words: [0, 1],
        dialogue: [],
        activities: [
          {
            type: "listen_choose",
            instruction: "Listen to the complete greeting",
            prompt: "你好",
            jyutping: "nei5 hou2",
            options: ["Hello", "Goodbye", "Cantonese"],
            answer: "Hello",
            tags: ["你好"],
            explanation: "The recording says 你好 · nei5 hou2 · Hello.",
          },
          {
            type: "match",
            instruction: "Connect a greeting to its meaning",
            prompt: "Match two whole phrases",
            pairs: [
              { left: "你好", right: "Hello" },
              { left: "早晨", right: "Good morning" },
            ],
            tags: ["你好", "早晨"],
          },
        ],
      },
      {
        title: "Make a little practice routine",
        zh: "學完再練習",
        description: "Listen once, say it, and keep a useful phrase.",
        points: [
          "Tap the speaker to hear a model if a Cantonese device voice is available.",
          "Tap the microphone to record and replay your own attempt.",
          "Save a phrase with the bookmark. Find it again in My wordbook.",
        ],
        words: [3, 4, 5],
        dialogue: [
          [
            "Buddy",
            "我學廣東話。",
            "ngo5 hok6 gwong2 dung1 waa2.",
            "I learn Cantonese.",
          ],
          [
            "You",
            "我講廣東話。",
            "ngo5 gong2 gwong2 dung1 waa2.",
            "I speak Cantonese.",
          ],
        ],
        activities: [
          {
            type: "sentence_order",
            instruction: "Say what you are learning",
            prompt: "I learn Cantonese.",
            tokens: ["我", "學", "廣東話"],
            answer: "我學廣東話",
            jyutping: "ngo5 hok6 gwong2 dung1 waa2",
            tags: ["廣東話"],
            explanation:
              "我 (I) comes before 學 (learn), followed by 廣東話 (Cantonese).",
          },
          {
            type: "fill_blank",
            instruction: "Complete your practice phrase",
            prompt: "我學 ___ 。",
            options: ["廣東話", "再見", "早晨"],
            answer: "廣東話",
            tags: ["廣東話"],
            explanation: "我學廣東話 means I learn Cantonese.",
          },
          {
            type: "speak",
            instruction: "Listen, then say your first greeting",
            prompt: "你好",
            jyutping: "nei5 hou2",
            english: "Hello",
            answer: "你好",
            tags: ["你好"],
          },
        ],
      },
      {
        title: "Try your first exchange",
        zh: "試吓講一句",
        description: "Bring a greeting into a tiny workshop conversation.",
        points: [
          "Greet a buddy with 你好.",
          "Use 早晨 when the workshop begins in the morning.",
          "Use 再見 when you leave.",
        ],
        words: [0, 1, 2],
        dialogue: [
          ["Buddy", "早晨！", "zou2 san4!", "Good morning!"],
          ["You", "早晨！", "zou2 san4!", "Good morning!"],
          ["Buddy", "再見！", "zoi3 gin3!", "Goodbye!"],
          ["You", "再見！", "zoi3 gin3!", "Goodbye!"],
        ],
        activities: [
          {
            type: "conversation_choice",
            instruction: "Reply to your buddy",
            prompt: "Buddy: 你好！",
            options: ["你好！", "再見！", "廣東話"],
            answer: "你好！",
            tags: ["你好"],
            explanation: "A friendly 你好 is a natural reply.",
          },
          {
            type: "scenario",
            instruction: "Use the right workshop greeting",
            prompt: "Your workshop is starting in the morning. Greet everyone.",
            options: ["早晨！", "再見！", "聽"],
            answer: "早晨！",
            tags: ["早晨"],
            explanation: "早晨 is a morning greeting.",
          },
          {
            type: "ai_roleplay",
            instruction: "Practise the workshop exchange",
            prompt:
              "Use only the suggested workshop phrases. No personal details.",
          },
          {
            type: "multiple_choice",
            instruction: "Finish your first module",
            prompt: "Which phrase fits the end of the workshop?",
            options: ["再見", "早晨", "你好"],
            answer: "再見",
            tags: ["再見"],
            explanation: "Say 再見 when saying goodbye.",
          },
        ],
      },
    ],
  },
  {
    id: "greetings",
    zh: "打招呼",
    title: "Greetings through a workshop day",
    icon: "👋",
    topic: "Greetings",
    intro:
      "Follow one workshop day from arriving to leaving. Learn what to say, listen to a complete exchange, and respond to a new friend in context.",
    situation:
      "At the Saturday workshop, you greet a volunteer, meet a new buddy, and say goodbye when practice ends.",
    objectives: [
      "Choose a greeting for the time and situation.",
      "Understand and respond to a short greeting exchange.",
      "Close a conversation naturally with goodbye.",
    ],
    phrases: [
      [
        "早晨",
        "zou2 san4",
        "Good morning",
        "早晨，大家！",
        "zou2 san4, daai6 gaa1!",
        "Good morning, everyone!",
      ],
      [
        "你好",
        "nei5 hou2",
        "Hello",
        "你好，朋友！",
        "nei5 hou2, pang4 jau5!",
        "Hello, friend!",
      ],
      [
        "大家好",
        "daai6 gaa1 hou2",
        "Hello, everyone",
        "大家好！",
        "daai6 gaa1 hou2!",
        "Hello, everyone!",
      ],
      [
        "好耐冇見",
        "hou2 noi6 mou5 gin3",
        "Long time no see",
        "好耐冇見！",
        "hou2 noi6 mou5 gin3!",
        "Long time no see!",
      ],
      [
        "你最近點呀？",
        "nei5 zeoi3 gan6 dim2 aa3",
        "How have you been recently?",
        "你最近點呀？",
        "nei5 zeoi3 gan6 dim2 aa3",
        "How have you been recently?",
      ],
      [
        "幾好",
        "gei2 hou2",
        "Pretty good",
        "幾好，唔該。",
        "gei2 hou2, m4 goi1.",
        "Pretty good, thanks.",
      ],
      [
        "再見",
        "zoi3 gin3",
        "Goodbye",
        "再見，朋友！",
        "zoi3 gin3, pang4 jau5!",
        "Goodbye, friend!",
      ],
      [
        "聽日見",
        "ting1 jat6 gin3",
        "See you tomorrow",
        "再見，聽日見！",
        "zoi3 gin3, ting1 jat6 gin3!",
        "Goodbye, see you tomorrow!",
      ],
    ],
    culture:
      "你好 is a useful general greeting. 早晨 fits the morning. Casual friends may ask 你最近點呀？; you can keep your reply short.",
    goal: "Greet a workshop buddy, respond briefly, and say goodbye.",
    parts: [
      {
        title: "Arrive at the workshop",
        zh: "返到工作坊",
        description: "Choose a greeting before you sit down.",
        points: [
          "早晨 is for the morning.",
          "你好 can greet one person at other times too.",
          "大家好 addresses the group.",
        ],
        words: [0, 1, 2],
        dialogue: [
          [
            "Volunteer",
            "早晨，大家！",
            "zou2 san4, daai6 gaa1!",
            "Good morning, everyone!",
          ],
          ["You", "早晨！", "zou2 san4!", "Good morning!"],
          ["Buddy", "你好！", "nei5 hou2!", "Hello!"],
          ["You", "你好！", "nei5 hou2!", "Hello!"],
        ],
        activities: [
          {
            type: "flashcard",
            instruction: "Explore greetings used on arrival",
            prompt: "Greetings in a workshop",
          },
          {
            type: "listen_choose",
            instruction: "Listen to the volunteer",
            prompt: "大家好",
            jyutping: "daai6 gaa1 hou2",
            options: ["Hello, everyone", "Goodbye", "Pretty good"],
            answer: "Hello, everyone",
            tags: ["大家好"],
            explanation: "大家 means everyone; 好 completes the greeting.",
          },
          {
            type: "scenario",
            instruction: "Greet the whole group",
            prompt:
              "You stand up to greet everyone at the workshop. What fits?",
            options: ["大家好！", "再見！", "聽日見！"],
            answer: "大家好！",
            tags: ["大家好"],
            explanation: "大家好 greets a group.",
          },
        ],
      },
      {
        title: "A familiar face",
        zh: "見到老朋友",
        description: "Listen to a short exchange between buddies.",
        points: [
          "好耐冇見 is for someone you have not seen for a while.",
          "你最近點呀？ asks how they have been.",
          "幾好 is a short, friendly reply.",
        ],
        words: [3, 4, 5],
        dialogue: [
          ["Buddy", "好耐冇見！", "hou2 noi6 mou5 gin3!", "Long time no see!"],
          ["You", "你好！", "nei5 hou2!", "Hello!"],
          [
            "Buddy",
            "你最近點呀？",
            "nei5 zeoi3 gan6 dim2 aa3",
            "How have you been recently?",
          ],
          [
            "You",
            "幾好，唔該。",
            "gei2 hou2, m4 goi1.",
            "Pretty good, thanks.",
          ],
        ],
        activities: [
          {
            type: "match",
            instruction: "Match the phrases from the exchange",
            prompt: "Keep each whole phrase together",
            pairs: [
              { left: "好耐冇見", right: "Long time no see" },
              { left: "你最近點呀？", right: "How have you been recently?" },
              { left: "幾好", right: "Pretty good" },
            ],
            tags: ["好耐冇見", "幾好"],
          },
          {
            type: "conversation_choice",
            instruction: "Keep the conversation going",
            prompt: "Buddy: 你最近點呀？",
            options: ["幾好。", "再見。", "大家好。"],
            answer: "幾好。",
            tags: ["幾好"],
            explanation: "幾好 answers how you have been.",
          },
          {
            type: "speak",
            instruction: "Practise the short reply",
            prompt: "幾好",
            jyutping: "gei2 hou2",
            english: "Pretty good",
            answer: "幾好",
            tags: ["幾好"],
          },
        ],
      },
      {
        title: "End the workshop",
        zh: "學完講再見",
        description: "Finish the same conversation naturally.",
        points: [
          "再見 means goodbye.",
          "聽日見 means see you tomorrow. Only use it when you expect to meet tomorrow.",
          "再見，聽日見！ combines both ideas.",
        ],
        words: [6, 7],
        dialogue: [
          ["Buddy", "再見！", "zoi3 gin3!", "Goodbye!"],
          [
            "You",
            "再見，聽日見！",
            "zoi3 gin3, ting1 jat6 gin3!",
            "Goodbye, see you tomorrow!",
          ],
        ],
        activities: [
          {
            type: "sentence_order",
            instruction: "Build your goodbye",
            prompt: "Goodbye, see you tomorrow!",
            tokens: ["再見", "，", "聽日見"],
            answer: "再見，聽日見",
            jyutping: "zoi3 gin3, ting1 jat6 gin3",
            tags: ["再見", "聽日見"],
            explanation:
              "The goodbye comes first, then the plan to meet tomorrow.",
          },
          {
            type: "fill_blank",
            instruction: "Finish the goodbye",
            prompt: "再見，___！",
            options: ["聽日見", "早晨", "大家好"],
            answer: "聽日見",
            tags: ["聽日見"],
            explanation: "聽日見 means see you tomorrow.",
          },
          {
            type: "scenario",
            instruction: "Say goodbye at the right moment",
            prompt:
              "The workshop ends and your buddy is leaving. What do you say?",
            options: ["再見！", "早晨！", "幾好！"],
            answer: "再見！",
            tags: ["再見"],
            explanation: "再見 closes the interaction.",
          },
        ],
      },
      {
        title: "Put the exchange together",
        zh: "由打招呼到講再見",
        description: "Practise the complete arc of a short conversation.",
        points: [
          "Begin with a greeting.",
          "Listen before choosing a reply.",
          "Close with a goodbye.",
        ],
        words: [0, 1, 4, 5, 6, 7],
        dialogue: [
          ["Buddy", "你好！", "nei5 hou2!", "Hello!"],
          ["You", "你好！", "nei5 hou2!", "Hello!"],
          [
            "Buddy",
            "你最近點呀？",
            "nei5 zeoi3 gan6 dim2 aa3",
            "How have you been recently?",
          ],
          ["You", "幾好。", "gei2 hou2.", "Pretty good."],
          ["Buddy", "再見！", "zoi3 gin3!", "Goodbye!"],
        ],
        activities: [
          {
            type: "ai_roleplay",
            instruction: "Meet your workshop buddy",
            prompt: "Greet your buddy, try a short reply, and say goodbye.",
          },
          {
            type: "multiple_choice",
            instruction: "Choose a natural reply",
            prompt: "Your buddy asks how you have been. Which answer fits?",
            options: ["幾好", "大家好", "再見"],
            answer: "幾好",
            tags: ["幾好"],
            explanation: "幾好 is a reply about how you are doing.",
          },
        ],
      },
    ],
  },
  {
    id: "introductions",
    zh: "自我介紹",
    title: "Introduce a pretend workshop character",
    icon: "💬",
    topic: "Introducing yourself",
    intro:
      "Create a pretend workshop character and introduce them through a short conversation. Connect a name, a pretend place, and an interest instead of memorizing isolated words.",
    situation:
      "You play Siu Ching, an imaginary learner from Hong Kong who likes drawing. You meet a new workshop buddy.",
    objectives: [
      "Introduce a pretend name and ask a buddy’s pretend name.",
      "Use 我嚟自… with a pretend place.",
      "Share an interest and understand a simple A-not-A question.",
    ],
    phrases: [
      [
        "我叫小晴",
        "ngo5 giu3 siu2 cing4",
        "My name is Siu Ching",
        "你好，我叫小晴。",
        "nei5 hou2, ngo5 giu3 siu2 cing4.",
        "Hello, my name is Siu Ching.",
      ],
      [
        "你叫咩名？",
        "nei5 giu3 me1 meng2",
        "What is your name?",
        "你叫咩名？",
        "nei5 giu3 me1 meng2",
        "What is your name?",
      ],
      [
        "我嚟自香港",
        "ngo5 lai4 zi6 hoeng1 gong2",
        "I come from Hong Kong",
        "我嚟自香港。",
        "ngo5 lai4 zi6 hoeng1 gong2.",
        "I come from Hong Kong.",
      ],
      [
        "你嚟自邊度？",
        "nei5 lai4 zi6 bin1 dou6",
        "Where do you come from?",
        "你嚟自邊度？",
        "nei5 lai4 zi6 bin1 dou6",
        "Where do you come from?",
      ],
      [
        "我鍾意畫畫",
        "ngo5 zung1 ji3 waak6 waa2",
        "I like drawing",
        "我鍾意畫畫。",
        "ngo5 zung1 ji3 waak6 waa2.",
        "I like drawing.",
      ],
      [
        "你鍾唔鍾意畫畫？",
        "nei5 zung1 m4 zung1 ji3 waak6 waa2",
        "Do you like drawing?",
        "你鍾唔鍾意畫畫？",
        "nei5 zung1 m4 zung1 ji3 waak6 waa2",
        "Do you like drawing?",
      ],
      [
        "鍾意",
        "zung1 ji3",
        "Like / yes, I like it",
        "鍾意，我鍾意畫畫。",
        "zung1 ji3, ngo5 zung1 ji3 waak6 waa2.",
        "Yes, I like drawing.",
      ],
      [
        "唔鍾意",
        "m4 zung1 ji3",
        "Do not like",
        "唔鍾意。",
        "m4 zung1 ji3.",
        "I do not like it.",
      ],
    ],
    culture:
      "Roleplay uses an imaginary character. Do not share your real name, home address, school, or contact details. The pretend place here is part of the character, not a request for your personal location.",
    goal: "Introduce the pretend character Siu Ching, mention Hong Kong, and talk about drawing.",
    parts: [
      {
        title: "Start with a pretend name",
        zh: "介紹角色個名",
        description: "Introduce Siu Ching and ask a buddy’s pretend name.",
        points: [
          "我叫 + name means my name is…",
          "你叫咩名？ asks what someone is called.",
          "For this activity, always use a pretend name.",
        ],
        words: [0, 1],
        dialogue: [
          [
            "You",
            "你好，我叫小晴。",
            "nei5 hou2, ngo5 giu3 siu2 cing4.",
            "Hello, my name is Siu Ching.",
          ],
          ["Buddy", "你好！", "nei5 hou2!", "Hello!"],
          ["You", "你叫咩名？", "nei5 giu3 me1 meng2", "What is your name?"],
        ],
        activities: [
          {
            type: "flashcard",
            instruction: "Explore the name exchange",
            prompt: "Introduce a pretend character",
          },
          {
            type: "listen_choose",
            instruction: "Listen to the character introduction",
            prompt: "我叫小晴",
            jyutping: "ngo5 giu3 siu2 cing4",
            options: ["My name is Siu Ching", "I like drawing", "Goodbye"],
            answer: "My name is Siu Ching",
            tags: ["我叫小晴"],
            explanation: "我叫 introduces a name.",
          },
          {
            type: "sentence_order",
            instruction: "Introduce Siu Ching",
            prompt: "My name is Siu Ching.",
            tokens: ["我", "叫", "小晴"],
            answer: "我叫小晴",
            jyutping: "ngo5 giu3 siu2 cing4",
            tags: ["我叫小晴"],
            explanation: "我 (I), 叫 (am called), 小晴 (the pretend name).",
          },
        ],
      },
      {
        title: "Give the character a place",
        zh: "角色嚟自邊度",
        description: "Use the imaginary character’s background.",
        points: [
          "我嚟自 + place means I come from…",
          "你嚟自邊度？ asks where someone comes from.",
          "Siu Ching’s pretend place is Hong Kong. You do not need to give your own location.",
        ],
        words: [2, 3],
        dialogue: [
          [
            "Buddy",
            "你嚟自邊度？",
            "nei5 lai4 zi6 bin1 dou6",
            "Where do you come from?",
          ],
          [
            "You",
            "我嚟自香港。",
            "ngo5 lai4 zi6 hoeng1 gong2.",
            "I come from Hong Kong.",
          ],
        ],
        activities: [
          {
            type: "conversation_choice",
            instruction: "Answer for the imaginary character",
            prompt: "Buddy: 你嚟自邊度？",
            options: ["我嚟自香港。", "我鍾意畫畫。", "再見。"],
            answer: "我嚟自香港。",
            tags: ["我嚟自香港"],
            explanation: "This answer supplies Siu Ching’s pretend place.",
          },
          {
            type: "fill_blank",
            instruction: "Finish the character’s introduction",
            prompt: "我嚟自 ___ 。",
            options: ["香港", "畫畫", "小晴"],
            answer: "香港",
            tags: ["我嚟自香港"],
            explanation:
              "香港 is the place in our imaginary character’s background.",
          },
          {
            type: "scenario",
            instruction: "Ask about the character’s place",
            prompt:
              "Your pretend buddy has said their name. Now ask where their character comes from.",
            options: ["你嚟自邊度？", "你叫咩名？", "早晨！"],
            answer: "你嚟自邊度？",
            tags: ["你嚟自邊度？"],
            explanation: "邊度 means where.",
          },
        ],
      },
      {
        title: "Share an interest",
        zh: "講吓角色嘅興趣",
        description: "Use one interest and a simple yes/no pattern.",
        points: [
          "我鍾意 + activity means I like…",
          "你鍾唔鍾意…？ puts a verb and its negative together to ask a yes/no question.",
          "鍾意 is a positive reply; 唔鍾意 is a negative reply.",
        ],
        words: [4, 5, 6, 7],
        dialogue: [
          [
            "You",
            "我鍾意畫畫。",
            "ngo5 zung1 ji3 waak6 waa2.",
            "I like drawing.",
          ],
          [
            "Buddy",
            "你鍾唔鍾意畫畫？",
            "nei5 zung1 m4 zung1 ji3 waak6 waa2",
            "Do you like drawing?",
          ],
          ["You", "鍾意。", "zung1 ji3.", "Yes, I like it."],
        ],
        activities: [
          {
            type: "match",
            instruction: "Connect the interest phrases",
            prompt: "Match the whole meaning",
            pairs: [
              { left: "我鍾意畫畫", right: "I like drawing" },
              { left: "鍾意", right: "Like / yes" },
              { left: "唔鍾意", right: "Do not like" },
            ],
            tags: ["我鍾意畫畫", "鍾意", "唔鍾意"],
          },
          {
            type: "conversation_choice",
            instruction: "Answer about Siu Ching’s interest",
            prompt: "Siu Ching likes drawing. Buddy: 你鍾唔鍾意畫畫？",
            options: ["鍾意。", "唔鍾意。", "我嚟自香港。"],
            answer: "鍾意。",
            tags: ["鍾意"],
            explanation: "Use 鍾意 for this character’s positive reply.",
          },
          {
            type: "speak",
            instruction: "Say the character’s interest",
            prompt: "我鍾意畫畫",
            jyutping: "ngo5 zung1 ji3 waak6 waa2",
            english: "I like drawing",
            answer: "我鍾意畫畫",
            tags: ["我鍾意畫畫"],
          },
        ],
      },
      {
        title: "Introduce the whole character",
        zh: "完整介紹角色",
        description: "Bring the name, pretend place, and interest together.",
        points: [
          "Start with the character’s name.",
          "Answer one question at a time.",
          "Add one interest to make the exchange feel natural.",
        ],
        words: [0, 1, 2, 4, 5, 6],
        dialogue: [
          [
            "You",
            "我叫小晴。",
            "ngo5 giu3 siu2 cing4.",
            "My name is Siu Ching.",
          ],
          [
            "You",
            "我嚟自香港。",
            "ngo5 lai4 zi6 hoeng1 gong2.",
            "I come from Hong Kong.",
          ],
          [
            "You",
            "我鍾意畫畫。",
            "ngo5 zung1 ji3 waak6 waa2.",
            "I like drawing.",
          ],
        ],
        activities: [
          {
            type: "ai_roleplay",
            instruction: "Meet a new workshop character",
            prompt:
              "Use the pretend name Siu Ching and the background in this module.",
          },
          {
            type: "multiple_choice",
            instruction: "Check the introduction pattern",
            prompt: "Which phrase introduces a name?",
            options: ["我叫小晴", "我鍾意畫畫", "我嚟自香港"],
            answer: "我叫小晴",
            tags: ["我叫小晴"],
            explanation:
              "我叫 introduces a name; the other phrases share an interest and a place.",
          },
        ],
      },
    ],
  },
  {
    id: "manners",
    zh: "有禮貌",
    title: "Kindness in everyday workshop situations",
    icon: "🌼",
    topic: "Manners",
    intro:
      "Follow everyday situations at a community centre. Learn how to ask for help, thank someone, respond to a gift, and apologize after a small accident.",
    situation:
      "At your workshop you need a hand with an activity, receive a small gift, and accidentally bump into another learner.",
    objectives: [
      "Use 唔該 for help or service and 多謝 for a gift.",
      "Apologize with 對唔住 in the right situation.",
      "Choose and speak a polite response within a short exchange.",
    ],
    phrases: [
      [
        "唔該",
        "m4 goi1",
        "Please / thank you for help or service",
        "唔該，幫我。",
        "m4 goi1, bong1 ngo5.",
        "Please help me.",
      ],
      [
        "唔該幫我",
        "m4 goi1 bong1 ngo5",
        "Please help me",
        "唔該幫我。",
        "m4 goi1 bong1 ngo5.",
        "Please help me.",
      ],
      [
        "唔使客氣",
        "m4 sai2 haak3 hei3",
        "You are welcome",
        "唔使客氣。",
        "m4 sai2 haak3 hei3.",
        "You are welcome.",
      ],
      [
        "多謝",
        "do1 ze6",
        "Thank you for a gift or compliment",
        "多謝你！",
        "do1 ze6 nei5!",
        "Thank you!",
      ],
      [
        "多謝你",
        "do1 ze6 nei5",
        "Thank you",
        "多謝你！",
        "do1 ze6 nei5!",
        "Thank you!",
      ],
      [
        "對唔住",
        "deoi3 m4 zyu6",
        "Sorry",
        "對唔住！",
        "deoi3 m4 zyu6!",
        "Sorry!",
      ],
      [
        "唔緊要",
        "m4 gan2 jiu3",
        "It is okay",
        "唔緊要。",
        "m4 gan2 jiu3.",
        "It is okay.",
      ],
    ],
    culture:
      "唔該 commonly thanks a person for help or a service and can politely get their attention. 多謝 commonly thanks someone for a gift or compliment. Context matters more than translating both as “thank you”.",
    goal: "Choose polite phrases for help, a gift, and a small accident.",
    parts: [
      {
        title: "Ask for a hand",
        zh: "有需要就有禮貌咁問",
        description: "Use a short request when an activity is difficult.",
        points: [
          "唔該 can politely get someone’s attention.",
          "幫我 means help me.",
          "唔該幫我 is a polite, complete request.",
        ],
        words: [0, 1, 2],
        dialogue: [
          ["You", "唔該幫我。", "m4 goi1 bong1 ngo5.", "Please help me."],
          ["Buddy", "唔使客氣。", "m4 sai2 haak3 hei3.", "You are welcome."],
          ["You", "唔該。", "m4 goi1.", "Thank you for helping."],
        ],
        activities: [
          {
            type: "flashcard",
            instruction: "Explore phrases from a help exchange",
            prompt: "Use kindness in a complete exchange",
          },
          {
            type: "listen_choose",
            instruction: "Listen to the request",
            prompt: "唔該幫我",
            jyutping: "m4 goi1 bong1 ngo5",
            options: ["Please help me", "Sorry", "Goodbye"],
            answer: "Please help me",
            tags: ["唔該幫我"],
            explanation: "唔該 makes the request polite; 幫我 asks for help.",
          },
          {
            type: "sentence_order",
            instruction: "Build a polite request",
            prompt: "Please help me.",
            tokens: ["唔該", "幫", "我"],
            answer: "唔該幫我",
            jyutping: "m4 goi1 bong1 ngo5",
            tags: ["唔該幫我"],
            explanation: "The polite opener comes before the request.",
          },
        ],
      },
      {
        title: "Thank someone in context",
        zh: "分清唔該同多謝",
        description: "Choose your thanks based on what the person did.",
        points: [
          "Use 唔該 when someone helps you or provides a service.",
          "Use 多謝 for a gift or compliment.",
          "多謝你 makes the thanks directly address the person.",
        ],
        words: [0, 3, 4],
        dialogue: [
          ["Buddy", "你好！", "nei5 hou2!", "Hello!"],
          ["You", "多謝你！", "do1 ze6 nei5!", "Thank you for the gift!"],
          ["Buddy", "唔使客氣。", "m4 sai2 haak3 hei3.", "You are welcome."],
        ],
        activities: [
          {
            type: "scenario",
            instruction: "A volunteer helps you",
            prompt:
              "A volunteer opens a box for your activity. How do you thank them for that help?",
            options: ["唔該。", "對唔住。", "再見。"],
            answer: "唔該。",
            tags: ["唔該"],
            explanation: "Use 唔該 for help or a service.",
          },
          {
            type: "scenario",
            instruction: "A buddy gives you a small gift",
            prompt: "Your buddy gives you a handmade bookmark. What fits?",
            options: ["多謝！", "對唔住！", "早晨！"],
            answer: "多謝！",
            tags: ["多謝"],
            explanation: "Use 多謝 for a gift.",
          },
          {
            type: "fill_blank",
            instruction: "Finish your thanks for the gift",
            prompt: "___ 你！",
            options: ["多謝", "再見", "早晨"],
            answer: "多謝",
            tags: ["多謝你"],
            explanation: "多謝你 means thank you.",
          },
        ],
      },
      {
        title: "Apologize and respond",
        zh: "講對唔住同唔緊要",
        description: "Practise a small accident and a kind response.",
        points: [
          "對唔住 apologizes after a mistake or bump.",
          "唔緊要 can reassure someone: it is okay.",
          "唔使客氣 responds to thanks, rather than replacing an apology.",
        ],
        words: [2, 5, 6],
        dialogue: [
          ["You", "對唔住！", "deoi3 m4 zyu6!", "Sorry!"],
          ["Buddy", "唔緊要。", "m4 gan2 jiu3.", "It is okay."],
        ],
        activities: [
          {
            type: "match",
            instruction: "Match polite phrases with their purpose",
            prompt: "Understand their real-life jobs",
            pairs: [
              { left: "對唔住", right: "Apologize" },
              { left: "唔緊要", right: "Reassure after a small accident" },
              { left: "唔使客氣", right: "Respond to thanks" },
            ],
            tags: ["對唔住", "唔緊要", "唔使客氣"],
          },
          {
            type: "conversation_choice",
            instruction: "Respond kindly to an apology",
            prompt: "Buddy: 對唔住！ It was only a small accidental bump.",
            options: ["唔緊要。", "多謝你。", "早晨。"],
            answer: "唔緊要。",
            tags: ["唔緊要"],
            explanation:
              "唔緊要 reassures the person that the small accident is okay.",
          },
          {
            type: "speak",
            instruction: "Practise saying sorry clearly",
            prompt: "對唔住",
            jyutping: "deoi3 m4 zyu6",
            english: "Sorry",
            answer: "對唔住",
            tags: ["對唔住"],
          },
        ],
      },
      {
        title: "A kind workshop day",
        zh: "喺工作坊用得出",
        description: "Choose a phrase for each changing situation.",
        points: [
          "Ask for help politely.",
          "Use the type of thanks that fits the situation.",
          "Apologize if you bump into someone.",
        ],
        words: [0, 1, 2, 3, 5, 6],
        dialogue: [
          ["You", "唔該幫我。", "m4 goi1 bong1 ngo5.", "Please help me."],
          ["Buddy", "唔使客氣。", "m4 sai2 haak3 hei3.", "You are welcome."],
          ["You", "對唔住！", "deoi3 m4 zyu6!", "Sorry!"],
          ["Buddy", "唔緊要。", "m4 gan2 jiu3.", "It is okay."],
        ],
        activities: [
          {
            type: "ai_roleplay",
            instruction: "Try kindness with your workshop buddy",
            prompt: "Practise the module’s polite phrases in a short exchange.",
          },
          {
            type: "multiple_choice",
            instruction: "Choose the right response to help",
            prompt: "A buddy helps you finish an activity. What do you say?",
            options: ["唔該", "對唔住", "早晨"],
            answer: "唔該",
            tags: ["唔該"],
            explanation: "唔該 thanks someone for help.",
          },
        ],
      },
    ],
  },
];
export const curriculumModules: Lesson[] = definitions.map((d, unit) => {
  const vocabulary: Vocabulary[] = d.phrases.map(
    (
      [
        traditional,
        jyutping,
        english,
        example,
        exampleJyutping,
        exampleEnglish,
      ],
      i,
    ) => ({
      id: `${d.id}-module-v${i}`,
      traditional,
      jyutping,
      english,
      example,
      exampleJyutping,
      exampleEnglish,
    }),
  );
  const exercises: Exercise[] = [];
  const sections: ModuleSection[] = d.parts.map((part, i) => {
    const sectionExercises = part.activities.map((a, n) => ({
      id: `${d.id}-part${i + 1}-activity${n + 1}`,
      type: a.type!,
      instruction: a.instruction!,
      prompt: a.prompt!,
      jyutping: "",
      english: "",
      options: [],
      answer: "",
      explanation: "Use the phrase from this module’s conversation.",
      difficulty: 1,
      tags: [vocabulary[part.words[0]].traditional],
      ...a,
    }));
    exercises.push(...sectionExercises);
    return {
      id: `${d.id}-part${i + 1}`,
      title: part.title,
      title_zh: part.zh,
      description: part.description,
      teachingPoints: part.points,
      dialogue: part.dialogue.map(
        ([speaker, traditional, jyutping, english]) => ({
          speaker,
          traditional,
          jyutping,
          english,
        }),
      ),
      examples: part.words.map((j) => ({
        traditional: vocabulary[j].example,
        jyutping: vocabulary[j].exampleJyutping,
        english: vocabulary[j].exampleEnglish,
      })),
      vocabularyIds: part.words.map((j) => vocabulary[j].id),
      exerciseIds: sectionExercises.map((e) => e.id),
    };
  });
  return lessonSchema.parse({
    id: d.id,
    title: d.title,
    title_zh: d.zh,
    description: d.intro,
    level: "beginner",
    estimated_minutes: unit === 0 ? 8 : 15,
    icon: d.icon,
    topic: d.topic,
    workshop: "Cantonese survival workshop · original adaptation",
    learningObjectives: d.objectives,
    vocabulary,
    grammar: d.parts
      .flatMap((p) => p.points)
      .filter((p) => p.includes("means") || p.includes("pattern")),
    culturalNotes: [{ title: "Language in context", body: d.culture }],
    module: {
      unit: unit + 1,
      introduction: d.intro,
      situation: d.situation,
      sections,
      reference,
    },
    exercises,
    roleplay: {
      scenario: d.situation,
      studentRole:
        unit === 2
          ? "Imaginary character Siu Ching from Hong Kong"
          : "Workshop learner using a pretend character",
      aiRole: "Friendly workshop buddy",
      allowedVocabulary: vocabulary.map((v) => v.traditional),
      goal: d.goal,
    },
    status: "published",
    version: 2,
    origin: "human",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-10-06T00:00:00Z",
  });
});
