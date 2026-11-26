import { lessonSchema, type Lesson } from "../schema";
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
import { workshopSections, type WorkshopSection } from "./workshop-sections";

const id = "workshop-2026-11-20";
const words = vocabulary(`
零 | lìhng | zero
一 | yāt | one
二 | yih | two
三 | sāam | three
四 | sei | four
五 | ńgh | five
六 | luhk | six
七 | chāt | seven
八 | baat | eight
九 | gáu | nine
十 | sahp | ten
個 | go | general classifier
百 | baak | hundred
千 | chīn | thousand
萬 | maahn | ten thousand
億 | yīk | one hundred million
鋪頭 | poutáu | shop
電腦 | dihn nóuh | computer
手機 | sáu gēi | mobile phone
杯 | būi | cup
筆 | bāt | pen
買 | máaih | buy
貴 | gwai | expensive
平 | pìhng | cheap
最新 | jeui sān | newest
蚊 | mān | dollar
兩個半 | léuhng go bun | two dollars and fifty cents
幾多錢 | géi dō chín | how much money
號碼 | houh máh | number
手機號碼 | sáu gēi houh máh | mobile phone number
餐廳 | chāan tēng | restaurant
嘢食 | yéh sihk | food
嘢飲 | yéh yám | drinks
位 | wái | seat (classifier for diners)
餐牌 | chāan páai | menu
埋單 | màaih dāan | ask for the bill
碟 | dihp | plate (classifier)
碗 | wún | bowl
份 | fahn | portion
籠 | lùhng | steamer basket
罐 | gun | can
蝦餃 | hā gáau | shrimp dumplings
燒賣 | sīu máai | siu mai
菠蘿包 | bō lòh bāau | pineapple bun
蛋撻 | daahn tāat | egg tart
奶茶 | náaih chàh | milk tea
雲吞麵 | wàhn tān mihn | wonton noodles
少冰 | síu bīng | less ice
走冰 | jáu bīng | no ice
少甜 | síu tìhm | less sweet
`);
const meanings = new Map(words.map(([text, , english]) => [text, english]));
const matchWords = (...terms: string[]) =>
  match(terms.map((term) => [term, meanings.get(term)!]));

const twelve: Phrase = ["十二", "Sahp yih", "12"];
const nineteen: Phrase = ["十九", "Sahp gáu", "19"];
const oneHundredThree: Phrase = ["一百零三", "Yāt baak lìhng sāam", "103"];
const twelveThousand: Phrase = [
  "一萬二千三百零九",
  "Yāt maahn yih chīn sāam baak lìhng gáu",
  "12,309",
];
const largeNumber: Phrase = [
  "一億零一百零三萬四千五百零二",
  "Yāt yīk lìhng yāt baak lìhng sāam maahn sei chīn ńgh baak lìhng yih",
  "101,034,502",
];
const twoFifty: Phrase = ["兩個半", "Léuhng go bun", "HK$2.50"];
const askPrice: Phrase = [
  "呢個手機幾多錢呀？",
  "Nī go sáu gēi géi dō chín a?",
  "How much is this mobile phone?",
];
const price3200: Phrase = ["三千二百蚊", "Sāam chīn yih baak mān", "HK$3,200"];
const askNumber: Phrase = [
  "你個手機號碼係幾多呀？",
  "Néih go sáu gēi houh máh haih géi dō a?",
  "What is your mobile phone number?",
];
const practiceCode: Phrase = ["一二三四", "Yāt yih sāam sei", "1–2–3–4"];
const secondCode: Phrase = ["九二八六", "Gáu yih baat luhk", "9–2–8–6"];
const askSeats: Phrase = [
  "你好，請問幾多位？",
  "Néih hóu, chíng mahn géi dō wái?",
  "Hello, how many seats do you need?",
];
const twoSeats: Phrase = [
  "兩位，唔該。",
  "Léuhng wái, m̀h gōi.",
  "Two seats, please.",
];
const menu: Phrase = [
  "唔該，可唔可以畀張餐牌我？",
  "M̀h gōi, hó m̀h hó yíh béi jēung chāan páai ngóh?",
  "Excuse me, could you give me a menu?",
];
const bill: Phrase = [
  "埋單，唔該。",
  "Màaih dāan, m̀h gōi.",
  "The bill, please.",
];
const noodles: Phrase = [
  "我想要一碗雲吞麵。",
  "Ngóh séung yiu yāt wún wàhn tān mihn.",
  "I’d like a bowl of wonton noodles.",
];
const coldTea: Phrase = [
  "一杯凍奶茶，少甜少冰。",
  "Yāt būi dung náaih chàh, síu tìhm síu bīng.",
  "One iced milk tea, less sweet and with less ice.",
];
const thatsAll: Phrase = [
  "係咁多，唔該！",
  "Haih gám dō, m̀h gōi!",
  "That’s all, thanks!",
];
const dineInOrTakeout: Phrase = [
  "喺度食定拎走？",
  "Hái douh sihk dihng līng jáu?",
  "Dine in or take away?",
];
const takeout: Phrase = [
  "拎走，唔該。",
  "Līng jáu, m̀h gōi.",
  "Take away, please.",
];

const sections: WorkshopSection[] = [
  {
    key: "digits",
    title: "Digits and teens",
    chinese: "數字同十幾",
    description: "Read the digits and build numbers from 11 to 19.",
    points: [
      "Use 十 (sahp) first for 11–19, then add the ones digit. For example, 十二 is 12.",
      "零 (lìhng) means zero. 二 (yih) is the digit two.",
    ],
    terms: ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"],
    examples: [twelve, nineteen],
    activities: [
      ["cards", cards()],
      [
        "match-digits",
        match([
          ["零", "0"],
          ["二", "2"],
          ["五", "5"],
          ["九", "9"],
        ]),
      ],
      [
        "eleven",
        quiz(
          "Which is 11?",
          ["十一", "十二", "十九"],
          "十一",
          "十 + 一 = 十一 (sahp yāt).",
        ),
      ],
      ["listen-twelve", listen(twelve, ["2", "20"])],
      ["build-nineteen", build(nineteen, ["十", "九"])],
    ],
  },
  {
    key: "place-value",
    title: "Place value and large numbers",
    chinese: "數位同大數字",
    description: "Read across place values, including 萬 and 億.",
    points: [
      "Read from the largest place to the smallest. A gap between nonzero digits is read as 零 once, as in 一百零三.",
      "Group digits in fours from the right. 萬 is 10,000 and 億 is 100,000,000.",
    ],
    terms: ["個", "十", "百", "千", "萬", "億", "零"],
    examples: [
      ["二十三", "Yih sahp sāam", "23"],
      oneHundredThree,
      twelveThousand,
      ["三萬四千五百零二", "Sāam maahn sei chīn ńgh baak lìhng yih", "34,502"],
      largeNumber,
    ],
    activities: [
      ["cards", cards()],
      [
        "match-places",
        match([
          ["百", "100"],
          ["千", "1,000"],
          ["萬", "10,000"],
          ["億", "100,000,000"],
        ]),
      ],
      [
        "missing-place",
        gap(
          "103 · 一百＿＿三",
          "零",
          ["零", "十", "千"],
          "Use 零 for the missing tens in 103.",
        ),
      ],
      [
        "build-12309",
        build(twelveThousand, ["一萬", "二千", "三百", "零", "九"]),
      ],
      ["listen-groups", listen(largeNumber, ["1,034,502", "101,304,502"])],
      ["say-103", speak(oneHundredThree)],
    ],
  },
  {
    key: "shopping",
    title: "Shopping and prices",
    chinese: "買嘢同價錢",
    description:
      "Ask how much something costs and practise saying prices in Hong Kong dollars.",
    points: [
      "Use 幾多錢 (géi dō chín) to ask the price. 買 + item names what you are buying.",
      "蚊 (mān) means dollars. For everyday prices, 三個一 is HK$3.10 and 兩個九 is HK$2.90. 半 (bun) gives fifty cents after 個.",
    ],
    terms: [
      "鋪頭",
      "電腦",
      "手機",
      "杯",
      "筆",
      "買",
      "貴",
      "平",
      "最新",
      "蚊",
      "兩個半",
      "幾多錢",
    ],
    examples: [
      ["買手機", "Máaih sáu gēi", "Buy a mobile phone"],
      ["三個一", "Sāam go yāt", "HK$3.10"],
      ["兩個九", "Léuhng go gáu", "HK$2.90"],
      twoFifty,
      ["八個半", "Baat go bun", "HK$8.50"],
    ],
    dialogue: [
      ["Customer", askPrice],
      ["Shop assistant", price3200],
    ],
    activities: [
      ["cards", cards()],
      ["shop-words", matchWords("電腦", "手機", "貴", "平")],
      [
        "two-fifty",
        quiz(
          "How do you say HK$2.50?",
          ["三個一", "八個半", "兩個半"],
          "兩個半",
          "兩個半 (léuhng go bun) is HK$2.50.",
        ),
      ],
      [
        "listen-bun-price",
        listen(["十四蚊", "Sahp sei mān", "HK$14"], ["HK$40"]),
      ],
      ["listen-phone-price", listen(price3200, ["HK$3,900", "HK$300"])],
      ["ask-price", speak(askPrice)],
    ],
  },
  {
    key: "phone",
    title: "Phone numbers and practice codes",
    chinese: "電話號碼",
    description: "Read a string of digits aloud and listen for its order.",
    points: [
      "Say each digit individually for a phone number. Read 2 as 二 (yih) in a string of digits.",
      "Practise with short fictional codes. Keep your own phone number private.",
    ],
    terms: ["號碼", "手機號碼", "零", "二", "九"],
    examples: [
      practiceCode,
      secondCode,
      ["五八零零", "Ńgh baat lìhng lìhng", "5–8–0–0"],
    ],
    dialogue: [
      ["Partner A", askNumber],
      [
        "Partner B",
        [
          "我個手機號碼係一二三四。",
          "Ngóh go sáu gēi houh máh haih yāt yih sāam sei.",
          "My practice number is 1–2–3–4.",
        ],
      ],
    ],
    activities: [
      ["cards", cards()],
      ["listen-code", listen(practiceCode, ["1–1–3–4", "1–2–4–3"])],
      ["listen-code-two", listen(secondCode, ["2–9–8–6", "9–2–6–8"])],
      ["say-code", speak(secondCode)],
    ],
  },
  {
    key: "restaurant",
    title: "At the restaurant",
    chinese: "去餐廳",
    description: "Get seated, ask for a menu and ask for the bill.",
    points: [
      "Use 位 (wái) to count diners. 唔該 is useful for getting the server’s attention or asking for a menu.",
      "埋單，唔該 is a polite way to ask for the bill.",
    ],
    terms: ["餐廳", "嘢食", "嘢飲", "位", "餐牌", "埋單"],
    examples: [
      menu,
      bill,
      [
        "你有乜嘢推介？",
        "Néih yáuh māt yéh tēui gaai?",
        "What do you recommend?",
      ],
    ],
    dialogue: [
      ["Server", askSeats],
      ["Customer", twoSeats],
    ],
    activities: [
      ["cards", cards()],
      [
        "listen-seats",
        listen(askSeats, ["How much does it cost?", "Are you dining in?"]),
      ],
      ["two-seats", build(twoSeats, ["兩位", "，", "唔該", "。"])],
      [
        "ask-menu",
        quiz(
          "You’ve been seated. Ask for a menu.",
          [menu[0], bill[0], askSeats[0]],
          menu[0],
          `${menu[0]} · ${menu[1]}`,
        ),
      ],
    ],
  },
  {
    key: "order",
    title: "Ordering food and drinks",
    chinese: "叫嘢食同飲品",
    description:
      "Choose the classifier, add a customisation and finish the order.",
    points: [
      "Put the number and classifier before the item. For example, 一碗雲吞麵 is one bowl of wonton noodles; 一籠蝦餃 is one steamer of shrimp dumplings.",
      "Put the temperature before the drink, as in 凍奶茶. Say adjustments such as 少冰 or 走冰 immediately after the item.",
      "Finish with 係咁多，唔該. Use 喺度食 for dine-in or 拎走 for takeaway.",
    ],
    terms: [
      "個",
      "碟",
      "碗",
      "份",
      "籠",
      "罐",
      "杯",
      "蝦餃",
      "燒賣",
      "菠蘿包",
      "蛋撻",
      "奶茶",
      "雲吞麵",
      "少冰",
      "走冰",
      "少甜",
    ],
    examples: [noodles, coldTea, thatsAll, dineInOrTakeout],
    dialogue: [
      [
        "Server",
        [
          "你好，請問想叫啲咩？",
          "Néih hóu, chíng mahn séung giu dī mē?",
          "Hello, what would you like to order?",
        ],
      ],
      ["Customer", noodles],
      ["Customer", coldTea],
      ["Customer", thatsAll],
      ["Server", dineInOrTakeout],
      ["Customer", takeout],
    ],
    activities: [
      ["cards", cards()],
      [
        "classifiers",
        match([
          ["一碗雲吞麵", "One bowl of wonton noodles"],
          ["一籠蝦餃", "One steamer of shrimp dumplings"],
          ["一杯奶茶", "One cup of milk tea"],
          ["一個菠蘿包", "One pineapple bun"],
        ]),
      ],
      [
        "no-ice",
        quiz(
          "Ask for no ice.",
          ["少冰", "走冰", "少甜"],
          "走冰",
          "走冰 means no ice. 少冰 means less ice.",
        ),
      ],
      ["build-order", build(noodles, ["我想要", "一碗", "雲吞麵", "。"])],
      [
        "listen-drink",
        listen(coldTea, ["One hot milk tea", "One iced milk tea with no ice"]),
      ],
      ["say-drink", speak(coldTea)],
    ],
  },
  {
    key: "review",
    title: "Workshop review",
    chinese: "工作坊溫習",
    description:
      "Use the workshop menu to practise ordering, prices and short replies.",
    points: [
      "On the workshop menu, a pineapple bun is HK$13 and wonton noodles are HK$40.",
      "If you cannot read a menu item yet, point to it and say 我要呢個 (ngóh yiu nī go).",
    ],
    terms: ["菠蘿包", "雲吞麵", "奶茶", "少冰", "幾多錢", "蚊", "餐牌", "埋單"],
    examples: [
      ["我要呢個。", "Ngóh yiu nī go.", "I’d like this one."],
      ["十三蚊", "Sahp sāam mān", "HK$13"],
      ["四十蚊", "Sei sahp mān", "HK$40"],
    ],
    activities: [
      [
        "menu-price",
        quiz(
          "How do you say the price of the HK$13 pineapple bun?",
          ["十三蚊", "三十蚊", "四十蚊"],
          "十三蚊",
          "十三 (sahp sāam) is 13.",
        ),
      ],
      [
        "listen-takeout",
        listen(dineInOrTakeout, [
          "What is your mobile phone number?",
          "How many seats do you need?",
        ]),
      ],
      [
        "choose-takeout",
        quiz(
          "The server asks 喺度食定拎走？ Choose takeaway.",
          ["喺度食，唔該。", takeout[0], bill[0]],
          takeout[0],
          "拎走 (līng jáu) means take away.",
          "conversation_choice",
        ),
      ],
      ["close-order", build(thatsAll, ["係咁多", "，", "唔該", "！"])],
      ["say-bill", speak(bill)],
    ],
  },
];

const { exercises, moduleSections } = workshopSections(id, sections);

export const workshopTwo: Lesson = lessonSchema.parse({
  id,
  title: "Workshop 2 · Numbers, prices and ordering food",
  title_zh: "工作坊二 · 數字、價錢同叫嘢食",
  description:
    "Practise numbers, shopping and restaurant Cantonese from the 20 November 2026 workshop.",
  level: "beginner",
  estimated_minutes: 30,
  icon: "🍜",
  topic: "Everyday interactions",
  workshop: "Cantonese Workshop 2 · 20 November 2026",
  learningObjectives: [
    "Read digits, teens and large numbers using 萬 and 億.",
    "Ask for prices and hear the difference between similar prices and number strings.",
    "Ask to be seated, order a meal and ask for the bill.",
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
    "十 + ones digit",
    "Number + 個 + tenths or 半",
    "我想要 + number + classifier + item",
  ],
  culturalNotes: [
    {
      title: "Hong Kong food traditions",
      body: "Workshop 2 introduced Cantonese dim sum, Western-influenced cha chaan teng dishes such as milk tea and pineapple buns, and street food served at stalls.",
    },
  ],
  module: {
    unit: 2,
    introduction:
      "Start with numbers and prices, then use them in everyday shopping and dining conversations.",
    situation: "Shop for a phone and order a meal from the workshop menu.",
    romanisation: "yale",
    sections: moduleSections,
    references: [
      {
        title: "Workshop 2 slides · study reference",
        url: "/workshop-materials/workshop-2/study-reference.html",
      },
    ],
  },
  exercises,
  roleplay: {
    scenario: "Order food and a drink at a Hong Kong café.",
    studentRole: "Customer",
    aiRole: "Restaurant server",
    allowedVocabulary: words.map(([traditional]) => traditional),
    goal: "Order an item, make a customisation and finish the order politely.",
  },
  status: "published",
  version: 1,
  origin: "human",
  createdBy: "system",
  createdAt: "2026-11-20T00:00:00Z",
  updatedAt: "2026-11-20T00:00:00Z",
});
