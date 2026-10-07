import {
  type CourseLesson,
  vocabulary,
  cards,
  quiz,
  listen,
  speak,
  build,
  match,
  gap,
  roleplay,
} from "./course-types";

// Original after-class activities aligned with the topics and vocabulary of
// EduHK Survival Cantonese Units 1–4. Source prose, tables, and media are not bundled.
// All readings below use modern Jyutping, rather than the source course notation.
export const survivalCourse: CourseLesson[] = [
  {
    id: "start",
    title: "Cantonese foundations and study tools",
    zh: "廣東話入門與學習工具",
    icon: "🧭",
    topic: "Pronunciation · romanization · independent study",
    introduction:
      "After Lecture 1, connect Cantonese sounds to writing, practise the six tone categories, use 我係 to introduce a fictional character, and build your own vocabulary-review routine.",
    objectives: [
      "Distinguish Cantonese from Mandarin and identify the purpose of romanization.",
      "Recognize initials, finals, aspiration, and six modern Cantonese tone categories.",
      "Use 我係 + identity in a short introduction.",
      "Use dictionaries, listening, recording, and a vocabulary log after class.",
    ],
    vocabulary: vocabulary(`
我 | ngo5 | I / me
係 | hai6 | To be
你 | nei5 | You
學生 | hok6 saang1 | Student
老師 | lou5 si1 | Teacher
廣東話 | gwong2 dung1 waa2 | Cantonese
中文 | zung1 man4 | Chinese language
你好 | nei5 hou2 | Hello
早晨 | zou2 san4 | Good morning
午安 | ng5 on1 | Good afternoon
晚安 | maan5 on1 | Good evening
再見 | zoi3 gin3 | Goodbye
聽 | teng1 | To listen
講 | gong2 | To speak
學 | hok6 | To learn
唔 | m4 | Not
字典 | zi6 din2 | Dictionary
聲調 | seng1 diu6 | Tone
生字 | saang1 zi6 | New vocabulary
留心 | lau4 sam1 | To pay attention
巴士 | baa1 si2 | Bus
怕 | paa3 | To be afraid
多 | do1 | Many / much
拖 | to1 | To pull
詩 | si1 | Poem
史 | si2 | History
試 | si3 | To try
時 | si4 | Time
市 | si5 | Market
事 | si6 | Matter / event
我係學生 | ngo5 hai6 hok6 saang1 | I am a student
我學廣東話 | ngo5 hok6 gwong2 dung1 waa2 | I study Cantonese
`),
    situation:
      "Two fictional learners review their first Cantonese class and practise with a study buddy.",
    goal: "Greet your buddy, say you are a student, and describe how you practise after class.",
    culture:
      "Cantonese is widely spoken in Hong Kong, Macau, Guangdong, and overseas communities. A sound guide supports learning but does not replace listening. Keep a short vocabulary log and return to words in new sentences.",
    sections: [
      {
        title: "1.1 Cantonese, writing, and sound guides",
        zh: "廣東話、文字與拼音",
        recap:
          "Recall what romanization does before reviewing your class notes.",
        points: [
          "Traditional Chinese records the words; romanization represents their sounds; English explains their meaning.",
          "Cantonese and Mandarin have different pronunciation systems. Mandarin Pinyin is not a Cantonese reading guide.",
          "The EduHK material discusses Meyer–Wempe, Yale, and Sidney Lau and uses a numbered course notation. This app consistently uses modern Jyutping.",
          "Some source spellings differ: course y often corresponds to Jyutping j, j to z, ch to c, and eui to eoi. Always check the whole syllable and its audio rather than swapping letters blindly.",
        ],
        terms: ["廣東話", "中文", "學", "我學廣東話", "你好"],
        examples: [
          [
            "我學廣東話。",
            "ngo5 hok6 gwong2 dung1 waa2.",
            "I study Cantonese.",
          ],
          ["你好！", "nei5 hou2!", "Hello!"],
        ],
        dialogue: [
          ["Study buddy", "你好！", "nei5 hou2!", "Hello!"],
          [
            "Learner",
            "我學廣東話。",
            "ngo5 hok6 gwong2 dung1 waa2.",
            "I study Cantonese.",
          ],
        ],
        activities: [
          cards(),
          quiz(
            "Which line gives a Cantonese sound guide for 你好?",
            ["nei5 hou2", "Hello", "Mandarin Pinyin only"],
            "nei5 hou2",
            "Jyutping connects Cantonese syllables and tone numbers to the written phrase.",
          ),
          listen(
            ["我學廣東話", "ngo5 hok6 gwong2 dung1 waa2", "I study Cantonese"],
            ["I am a teacher", "Good evening"],
          ),
          build(
            ["我學廣東話", "ngo5 hok6 gwong2 dung1 waa2", "I study Cantonese"],
            ["我", "學", "廣東話"],
          ),
        ],
      },
      {
        title: "1.2 Initials and aspiration",
        zh: "聲母與送氣",
        recap:
          "Practise the beginning of a syllable rather than spelling it as an English word.",
        points: [
          "An initial is the consonant at the beginning of a syllable; some syllables have no initial.",
          "Common Jyutping initials are b, p, m, f, d, t, n, l, g, k, ng, h, gw, kw, w, z, c, s, and j.",
          "The b/p, d/t, and g/k pairs differ mainly in aspiration: p, t, and k have a stronger puff of air.",
          "ng can begin a word such as 我 ngo5. It is not an instruction to say separate English letters.",
          "A hand near your mouth can help you notice aspiration; use class audio as the pronunciation model.",
        ],
        terms: ["巴士", "怕", "多", "拖", "我"],
        examples: [
          ["我怕。", "ngo5 paa3.", "I am afraid."],
          ["巴士好多。", "baa1 si2 hou2 do1.", "There are many buses."],
        ],
        dialogue: [],
        activities: [
          cards(),
          match([
            ["巴士", "Bus"],
            ["怕", "To be afraid"],
            ["拖", "To pull"],
          ]),
          quiz(
            "Which initial is normally more strongly aspirated in Jyutping?",
            ["p", "b", "m"],
            "p",
            "The p initial has a stronger puff of air than b.",
          ),
          speak(["我怕", "ngo5 paa3", "I am afraid"]),
        ],
      },
      {
        title: "1.3 Finals and syllable endings",
        zh: "韻母與字音結尾",
        recap: "Listen to the vowel and final consonant as one unit.",
        points: [
          "A final contains a vowel and, where present, a glide or final consonant.",
          "Useful vowel spellings include aa, a, e, i, o, u, oe, and yu. Do not read aa as the name of the English letter A.",
          "Length and vowel quality can distinguish syllables. Check the dictionary reading rather than dropping letters.",
          "Final -m, -n, and -ng are nasal endings. Final -p, -t, and -k end with a short unreleased stop.",
          "In 學 hok6, stop at the k ending without adding an extra vowel. 唔 m4 is a syllabic nasal: it can form a syllable by itself.",
        ],
        terms: ["學", "學生", "老師", "唔", "聽", "講"],
        examples: [
          ["我聽。", "ngo5 teng1.", "I listen."],
          ["我講。", "ngo5 gong2.", "I speak."],
        ],
        dialogue: [
          ["Buddy", "我聽。", "ngo5 teng1.", "I listen."],
          ["Learner", "我講。", "ngo5 gong2.", "I speak."],
        ],
        activities: [
          cards(),
          quiz(
            "What happens at the end of hok6 in 學?",
            [
              "A short k stop without an extra vowel",
              "An extra full vowel",
              "A long English letter K",
            ],
            "A short k stop without an extra vowel",
            "The final k is unreleased; avoid adding another syllable.",
          ),
          listen(["學生", "hok6 saang1", "Student"], ["Teacher", "Dictionary"]),
          speak([
            "我聽廣東話",
            "ngo5 teng1 gwong2 dung1 waa2",
            "I listen to Cantonese",
          ]),
        ],
      },
      {
        title: "1.4 Six tones in modern Cantonese",
        zh: "六個聲調",
        recap: "Use the same syllable to hear how pitch can change a word.",
        points: [
          "Jyutping uses six tone numbers: 1 high level, 2 rising, 3 mid level, 4 low falling, 5 low rising, and 6 low level.",
          "Compare 詩 si1, 史 si2, 試 si3, 時 si4, 市 si5, and 事 si6. They share the syllable spelling but have different tones and meanings.",
          "Traditional nine-tone descriptions count the short stop-ending tones separately; this app uses the six-category Jyutping notation.",
          "Copy pitch as well as consonants and vowels. A recognized transcript alone cannot prove a tone was correct.",
          "Azure can estimate Cantonese pronunciation during speaking practice; it does not supply a separate six-tone score.",
        ],
        terms: ["聲調", "詩", "史", "試", "時", "市", "事"],
        examples: [
          ["我試。", "ngo5 si3.", "I try."],
          [
            "我講廣東話。",
            "ngo5 gong2 gwong2 dung1 waa2.",
            "I speak Cantonese.",
          ],
        ],
        dialogue: [],
        activities: [
          cards(),
          match([
            ["si1 · 詩", "Poem"],
            ["si3 · 試", "To try"],
            ["si4 · 時", "Time"],
          ]),
          quiz(
            "In modern Jyutping, what does the number 5 identify?",
            [
              "A low rising tone",
              "Five syllables",
              "The fifth word in a sentence",
            ],
            "A low rising tone",
            "The number marks the tone of the preceding syllable.",
          ),
          listen(["試", "si3", "To try"], ["Poem", "Time"]),
          speak(["我試", "ngo5 si3", "I try"]),
        ],
      },
      {
        title: "1.5 The first identity sentence",
        zh: "用我係介紹身份",
        recap: "Use a fictional character when practising a name or role.",
        points: [
          "我係 + identity means I am + identity. Keep the person before 係 and the identity after it.",
          "學生 is a student and 老師 is a teacher. 你係學生 asks about the other person when used with a question particle or question intonation.",
          "A name can follow 我係 in a self-introduction. You can use 小欣 as an imaginary name.",
          "Learn greetings in complete situations: 早晨 in the morning, 午安 in the afternoon, 晚安 for an evening greeting, and 再見 when leaving.",
        ],
        terms: [
          "我",
          "你",
          "係",
          "學生",
          "老師",
          "我係學生",
          "早晨",
          "午安",
          "晚安",
          "再見",
        ],
        examples: [
          ["我係小欣。", "ngo5 hai6 siu2 jan1.", "I am Siu Yan."],
          ["我係學生。", "ngo5 hai6 hok6 saang1.", "I am a student."],
        ],
        dialogue: [
          [
            "Siu Yan",
            "早晨！我係小欣。",
            "zou2 san4! ngo5 hai6 siu2 jan1.",
            "Good morning! I am Siu Yan.",
          ],
          [
            "Buddy",
            "你好！我係學生。",
            "nei5 hou2! ngo5 hai6 hok6 saang1.",
            "Hello! I am a student.",
          ],
          ["Siu Yan", "再見！", "zoi3 gin3!", "Goodbye!"],
        ],
        activities: [
          cards(),
          build(
            ["我係學生", "ngo5 hai6 hok6 saang1", "I am a student"],
            ["我", "係", "學生"],
          ),
          gap(
            "我 ___ 老師。",
            "係",
            ["係", "聽", "再見"],
            "Put 係 between the subject and the identity.",
          ),
          speak(["我係學生", "ngo5 hai6 hok6 saang1", "I am a student"]),
          quiz(
            "The afternoon class begins. Choose an appropriate greeting.",
            ["午安", "再見", "字典"],
            "午安",
            "午安 is an afternoon greeting.",
            "scenario",
          ),
        ],
      },
      {
        title: "1.6 Dictionary, vocabulary log, and class recap",
        zh: "字典、生字簿與課後溫習",
        recap:
          "Turn a word from class into something you can remember and use.",
        points: [
          "Choose a Cantonese dictionary that gives a pronunciation system you understand; check its tone notation.",
          "The course points learners to an English–Cantonese dictionary and CUHK’s Cantonese character database. Use the original unit link to find these resources.",
          "For each new expression, record the characters, Jyutping, meaning, a short example, and when you will use it.",
          "Save words in the app’s wordbook, listen, record, and revisit your mistakes instead of only rereading a list.",
          "Self-review: identify six tones, one aspirated initial, one final stop, and a complete 我係 sentence.",
        ],
        terms: ["字典", "生字", "留心", "聽", "講", "廣東話"],
        examples: [
          ["我留心聽。", "ngo5 lau4 sam1 teng1.", "I listen carefully."],
          [
            "我學廣東話。",
            "ngo5 hok6 gwong2 dung1 waa2.",
            "I study Cantonese.",
          ],
        ],
        dialogue: [],
        activities: [
          quiz(
            "What makes a useful vocabulary-log entry?",
            [
              "Characters, sound guide, meaning, and an example",
              "Only a page number",
              "Only a guessed English spelling",
            ],
            "Characters, sound guide, meaning, and an example",
            "Connect a word to its sound, meaning, and a situation in which you can use it.",
          ),
          quiz(
            "Your buddy says 你好. Choose a friendly reply.",
            ["你好！", "字典。", "唔。"],
            "你好！",
            "A greeting can be returned with the same greeting.",
            "conversation_choice",
          ),
          roleplay(),
          speak(["我留心聽", "ngo5 lau4 sam1 teng1", "I listen carefully"]),
        ],
      },
    ],
  },
  {
    id: "greetings",
    title: "Greetings and everyday exchanges",
    zh: "打招呼與日常交流",
    icon: "👋",
    topic: "Greetings · names · places · subject–verb–object",
    introduction:
      "After Lecture 2, greet classmates at different times, address someone politely, ask a name or how someone is, and use basic word order to say who you are and where you are going.",
    objectives: [
      "Use morning, afternoon, evening, and departure greetings.",
      "Review the unit’s initial and final sound groups using Jyutping readings.",
      "Use subject–verb–object order with identity and movement verbs.",
      "Exchange a fictional name, place of origin, wellbeing, and destination.",
    ],
    vocabulary: vocabulary(`
你好 | nei5 hou2 | Hello
早晨 | zou2 san4 | Good morning
午安 | ng5 on1 | Good afternoon
晚安 | maan5 on1 | Good evening
再見 | zoi3 gin3 | Goodbye
老師 | lou5 si1 | Teacher
先生 | sin1 saang1 | Sir / Mr.
小姐 | siu2 ze2 | Miss
女士 | neoi5 si6 | Madam / Ms.
呢個 | ni1 go3 | This one / this person
我 | ngo5 | I / me
你 | nei5 | You
係 | hai6 | To be
名 | meng2 | Name
叫 | giu3 | To be called
人 | jan4 | Person / people
嗎 | maa3 | Question particle
幾 | gei2 | Quite / fairly
好 | hou2 | Good / well
我哋 | ngo5 dei6 | We / us
香港 | hoeng1 gong2 | Hong Kong
英國 | jing1 gwok3 | United Kingdom
美國 | mei5 gwok3 | United States
邊度 | bin1 dou6 | Where
點樣 | dim2 joeng6 | How
近排 | gan6 paai4 | Recently
而家 | ji4 gaa1 | Now
屋企 | uk1 kei2 | Home
圖書館 | tou4 syu1 gun2 | Library
去 | heoi3 | To go
返 | faan1 | To return
唔該 | m4 goi1 | Please / thanks for help
多謝 | do1 ze6 | Thank you for a gift or compliment
你好嗎 | nei5 hou2 maa3 | How are you?
我幾好 | ngo5 gei2 hou2 | I am quite well
你呢 | nei5 ne1 | And you?
忙 | mong4 | Busy
班 | baan1 | Class / group
你叫咩名 | nei5 giu3 me1 meng2 | What is your name?
我去圖書館 | ngo5 heoi3 tou4 syu1 gun2 | I am going to the library
我返屋企 | ngo5 faan1 uk1 kei2 | I am going home
`),
    situation:
      "Imaginary classmates greet each other before class and meet again near the library.",
    goal: "Greet a classmate, ask a name and how they are, and explain where you are going.",
    culture:
      "Use a greeting that suits the time and setting. Names and origins in this lesson belong to fictional characters. Everyday speech may use 點呀 or 點樣 rather than the more textbook-style 你好嗎.",
    sections: [
      {
        title: "2.1 Greetings for the time of day",
        zh: "唔同時間嘅問候",
        recap: "Return to the greetings you heard in class.",
        points: [
          "Use 早晨 for a morning greeting, 午安 for the afternoon, and 晚安 for an evening greeting.",
          "你好 works as a general greeting. 再見 closes an exchange when someone leaves.",
          "Add a role or name to direct your greeting: 老師，早晨！",
          "Listen for the unit’s course-spelling initials j, h, s, ng, g and finals a, ai, an, aan, ang. The app shows the corresponding whole-word Jyutping readings, not automatic letter substitutions.",
        ],
        terms: ["你好", "早晨", "午安", "晚安", "再見", "老師"],
        examples: [
          ["老師，早晨！", "lou5 si1, zou2 san4!", "Good morning, teacher!"],
          ["午安，大家！", "ng5 on1, daai6 gaa1!", "Good afternoon, everyone!"],
        ],
        dialogue: [
          [
            "Learner",
            "老師，早晨！",
            "lou5 si1, zou2 san4!",
            "Good morning, teacher!",
          ],
          ["Teacher", "早晨！", "zou2 san4!", "Good morning!"],
          [
            "Learner",
            "再見，老師！",
            "zoi3 gin3, lou5 si1!",
            "Goodbye, teacher!",
          ],
        ],
        activities: [
          cards(),
          match([
            ["早晨", "Morning greeting"],
            ["午安", "Afternoon greeting"],
            ["晚安", "Evening greeting"],
          ]),
          listen(
            ["老師，早晨", "lou5 si1, zou2 san4", "Good morning, teacher"],
            ["Goodbye, teacher", "I am going home"],
          ),
          quiz(
            "Your class meets in the evening. Choose a greeting.",
            ["晚安", "再見", "圖書館"],
            "晚安",
            "晚安 can greet someone in the evening.",
            "scenario",
          ),
          speak(["老師，早晨", "lou5 si1, zou2 san4", "Good morning, teacher"]),
        ],
      },
      {
        title: "2.2 Addressing and introducing someone",
        zh: "稱呼與介紹朋友",
        recap: "Choose a respectful title and introduce a fictional classmate.",
        points: [
          "先生, 小姐, and 女士 are forms of address; 老師 addresses a teacher.",
          "呢個 points to this person or thing. 呢個係我老師 means this is my teacher.",
          "Use 叫 to say what someone is called. Keep the person before the verb.",
          "唔該 can politely get attention; 多謝 is useful when thanking someone for a gift or compliment.",
        ],
        terms: [
          "先生",
          "小姐",
          "女士",
          "呢個",
          "老師",
          "叫",
          "名",
          "唔該",
          "多謝",
        ],
        examples: [
          [
            "呢個係我老師。",
            "ni1 go3 hai6 ngo5 lou5 si1.",
            "This is my teacher.",
          ],
          ["我叫小欣。", "ngo5 giu3 siu2 jan1.", "My name is Siu Yan."],
        ],
        dialogue: [
          [
            "Siu Yan",
            "午安，陳女士。",
            "ng5 on1, can4 neoi5 si6.",
            "Good afternoon, Ms Chan.",
          ],
          [
            "Ms Chan",
            "你好，小欣。",
            "nei5 hou2, siu2 jan1.",
            "Hello, Siu Yan.",
          ],
          [
            "Siu Yan",
            "呢個係我老師。",
            "ni1 go3 hai6 ngo5 lou5 si1.",
            "This is my teacher.",
          ],
        ],
        activities: [
          cards(),
          build(
            [
              "呢個係我老師",
              "ni1 go3 hai6 ngo5 lou5 si1",
              "This is my teacher",
            ],
            ["呢個", "係", "我", "老師"],
          ),
          quiz(
            "You want to address a teacher. Which title fits?",
            ["老師", "屋企", "而家"],
            "老師",
            "老師 is the Cantonese word for teacher.",
          ),
          gap(
            "我 ___ 小欣。",
            "叫",
            ["叫", "而家", "再見"],
            "叫 introduces the name a person is called.",
          ),
        ],
      },
      {
        title: "2.3 Subject–verb–object patterns",
        zh: "主語、動詞與賓語",
        recap: "Put the person first and the action or identity next.",
        points: [
          "我係學生 follows person + 係 + identity.",
          "我去圖書館 follows person + 去 + destination.",
          "我返屋企 follows person + 返 + destination; 返 includes the idea of returning.",
          "而家 gives a present-time context: 我而家去圖書館.",
          "Do not translate English word order one word at a time without checking the Cantonese pattern.",
        ],
        terms: [
          "我",
          "你",
          "係",
          "去",
          "返",
          "圖書館",
          "屋企",
          "而家",
          "我去圖書館",
          "我返屋企",
        ],
        examples: [
          [
            "我而家去圖書館。",
            "ngo5 ji4 gaa1 heoi3 tou4 syu1 gun2.",
            "I am going to the library now.",
          ],
          ["我返屋企。", "ngo5 faan1 uk1 kei2.", "I am going home."],
        ],
        dialogue: [],
        activities: [
          cards(),
          build(
            [
              "我而家去圖書館",
              "ngo5 ji4 gaa1 heoi3 tou4 syu1 gun2",
              "I am going to the library now",
            ],
            ["我", "而家", "去", "圖書館"],
          ),
          listen(
            ["我返屋企", "ngo5 faan1 uk1 kei2", "I am going home"],
            ["I am a teacher", "I am quite well"],
          ),
          gap(
            "我去 ___ 。",
            "圖書館",
            ["圖書館", "早晨", "再見"],
            "A destination follows 去 in this sentence.",
          ),
          speak([
            "我去圖書館",
            "ngo5 heoi3 tou4 syu1 gun2",
            "I am going to the library",
          ]),
        ],
      },
      {
        title: "2.4 Names and places of origin",
        zh: "姓名與來自邊度",
        recap: "Practise a complete first meeting using imaginary details.",
        points: [
          "你叫咩名？ asks a name; 我叫 + name gives an answer.",
          "你係邊度人？ asks about place of origin. Add 人 after a place to identify a person from there.",
          "香港, 英國, and 美國 name places. 香港人 means a Hong Kong person.",
          "我哋 means we or us. 我哋同一班 means we are in the same class.",
          "Use the lesson’s fictional characters; you do not need to share a real address or nationality.",
        ],
        terms: [
          "你叫咩名",
          "叫",
          "名",
          "邊度",
          "人",
          "香港",
          "英國",
          "美國",
          "我哋",
          "班",
        ],
        examples: [
          [
            "我係香港人。",
            "ngo5 hai6 hoeng1 gong2 jan4.",
            "I am from Hong Kong.",
          ],
          [
            "我哋同一班。",
            "ngo5 dei6 tung4 jat1 baan1.",
            "We are in the same class.",
          ],
        ],
        dialogue: [
          ["Buddy", "你叫咩名？", "nei5 giu3 me1 meng2?", "What is your name?"],
          [
            "Siu Yan",
            "我叫小欣。你呢？",
            "ngo5 giu3 siu2 jan1. nei5 ne1?",
            "My name is Siu Yan. And you?",
          ],
          [
            "Buddy",
            "我叫阿文。我係香港人。",
            "ngo5 giu3 aa3 man4. ngo5 hai6 hoeng1 gong2 jan4.",
            "My name is Ah Man. I am from Hong Kong.",
          ],
          [
            "Siu Yan",
            "我哋同一班！",
            "ngo5 dei6 tung4 jat1 baan1!",
            "We are in the same class!",
          ],
        ],
        activities: [
          cards(),
          quiz(
            "A classmate asks 你叫咩名？ Choose a name response.",
            ["我叫小欣。", "我返屋企。", "晚安。"],
            "我叫小欣。",
            "The question asks what you are called.",
            "conversation_choice",
          ),
          match([
            ["香港", "Hong Kong"],
            ["英國", "United Kingdom"],
            ["美國", "United States"],
          ]),
          speak([
            "我係香港人",
            "ngo5 hai6 hoeng1 gong2 jan4",
            "I am from Hong Kong",
          ]),
        ],
      },
      {
        title: "2.5 Wellbeing, recent days, and destinations",
        zh: "近況與去邊度",
        recap: "Ask a follow-up question instead of ending after hello.",
        points: [
          "你好嗎？ is a textbook-style way to ask how someone is. 點樣 and casual 點呀 also occur in conversation.",
          "我幾好 means I am quite well; 幾 modifies 好 here rather than asking a number.",
          "你呢？ returns the question to the other person.",
          "近排 means recently and 忙 means busy. 我近排好忙 says I have been very busy recently.",
          "你而家去邊度？ asks where someone is going now.",
        ],
        terms: [
          "你好嗎",
          "嗎",
          "幾",
          "好",
          "我幾好",
          "你呢",
          "點樣",
          "近排",
          "忙",
          "而家",
          "邊度",
        ],
        examples: [
          [
            "我近排好忙。",
            "ngo5 gan6 paai4 hou2 mong4.",
            "I have been very busy recently.",
          ],
          ["我幾好。", "ngo5 gei2 hou2.", "I am quite well."],
        ],
        dialogue: [
          [
            "Ah Man",
            "近排點樣？",
            "gan6 paai4 dim2 joeng6?",
            "How have things been recently?",
          ],
          [
            "Siu Yan",
            "我幾好。你呢？",
            "ngo5 gei2 hou2. nei5 ne1?",
            "I am quite well. And you?",
          ],
          [
            "Ah Man",
            "我近排好忙。",
            "ngo5 gan6 paai4 hou2 mong4.",
            "I have been very busy recently.",
          ],
          [
            "Siu Yan",
            "你而家去邊度？",
            "nei5 ji4 gaa1 heoi3 bin1 dou6?",
            "Where are you going now?",
          ],
        ],
        activities: [
          cards(),
          listen(
            ["我幾好", "ngo5 gei2 hou2", "I am quite well"],
            ["I am going home", "My name is Siu Yan"],
          ),
          quiz(
            "Someone says 我幾好。你呢？ What is 你呢 doing?",
            [
              "Asking how you are in return",
              "Asking your name",
              "Saying goodbye",
            ],
            "Asking how you are in return",
            "你呢 returns a question to the other person.",
          ),
          speak([
            "我近排好忙",
            "ngo5 gan6 paai4 hou2 mong4",
            "I have been very busy recently",
          ]),
        ],
      },
      {
        title: "2.6 After-class conversation and quick review",
        zh: "課後對話與小測",
        recap: "Combine greeting, a question, a destination, and goodbye.",
        points: [
          "Start with a suitable greeting, ask one follow-up question, and answer with a complete sentence.",
          "Keep the subject before the verb in 我去圖書館 and 我返屋企.",
          "Close politely with 再見. Review words you missed in your wordbook.",
          "Pronunciation recap: listen to whole words such as 人 jan4, 香港 hoeng1 gong2, 先生 sin1 saang1, and 午安 ng5 on1. Do not read the source notation as English.",
        ],
        terms: [
          "晚安",
          "而家",
          "邊度",
          "我去圖書館",
          "我返屋企",
          "再見",
          "先生",
        ],
        examples: [
          [
            "再見，聽日見。",
            "zoi3 gin3, ting1 jat6 gin3.",
            "Goodbye, see you tomorrow.",
          ],
          [
            "我去圖書館。",
            "ngo5 heoi3 tou4 syu1 gun2.",
            "I am going to the library.",
          ],
        ],
        dialogue: [
          [
            "Siu Yan",
            "晚安！你而家去邊度？",
            "maan5 on1! nei5 ji4 gaa1 heoi3 bin1 dou6?",
            "Good evening! Where are you going now?",
          ],
          [
            "Ah Man",
            "我去圖書館。你呢？",
            "ngo5 heoi3 tou4 syu1 gun2. nei5 ne1?",
            "I am going to the library. And you?",
          ],
          [
            "Siu Yan",
            "我返屋企。聽日見！",
            "ngo5 faan1 uk1 kei2. ting1 jat6 gin3!",
            "I am going home. See you tomorrow!",
          ],
        ],
        activities: [
          quiz(
            "A classmate asks where you are going. You are heading home.",
            ["我返屋企。", "我叫小欣。", "早晨。"],
            "我返屋企。",
            "返屋企 describes returning home.",
            "scenario",
          ),
          build(
            [
              "再見，聽日見。",
              "zoi3 gin3, ting1 jat6 gin3.",
              "Goodbye, see you tomorrow.",
            ],
            ["再見", "，", "聽日", "見", "。"],
          ),
          roleplay(),
          speak([
            "你而家去邊度",
            "nei5 ji4 gaa1 heoi3 bin1 dou6",
            "Where are you going now?",
          ]),
        ],
      },
    ],
  },
  {
    id: "introductions",
    title: "Introducing yourself: hobbies and family",
    zh: "自我介紹、興趣與家庭",
    icon: "💬",
    topic: "Identity · hobbies · family · A-not-A questions",
    introduction:
      "After Lecture 3, use a fictional profile to talk about age, work, interests, and family. Practise asking and answering A-not-A questions, then connect your answers into a short self-introduction.",
    objectives: [
      "Describe an imaginary person’s age, occupation, interests, and household.",
      "Use the unit’s hobby, family, and personal-profile vocabulary in context.",
      "Ask A-not-A questions with verbs, 係, and adjectives.",
      "Review b, d, m, t, and course y initials and the unit’s final groups.",
    ],
    vocabulary: vocabulary(`
歲 | seoi3 | Years of age
做 | zou6 | To do
學 | hok6 | To learn
住 | zyu6 | To live
玩 | waan2 | To play
職業 | zik1 jip6 | Occupation
教書 | gaau3 syu1 | To teach
鍾意 | zung1 ji3 | To like
睇戲 | tai2 hei3 | To watch a film
聽音樂 | teng1 jam1 ngok6 | To listen to music
上網 | soeng5 mong5 | To use the internet
行街 | haang4 gaai1 | To go shopping / stroll
游水 | jau4 seoi2 | To swim
旅行 | leoi5 hang4 | To travel
睇電視 | tai2 din6 si6 | To watch television
踢波 | tek3 bo1 | To play football
卡拉OK | kaa1 laa1 ou1 kei1 | Karaoke
唱歌 | coeng3 go1 | To sing
單身 | daan1 san1 | Single
結咗婚 | git3 zo2 fan1 | Married
咩 | me1 | What
認識 | jing6 sik1 | To know / meet someone
電郵地址 | din6 jau4 dei6 zi2 | Email address
得閒 | dak1 haan4 | To have free time
朋友 | pang4 jau5 | Friend
爸爸 | baa4 baa1 | Dad
媽媽 | maa4 maa1 | Mum
哥哥 | go4 go1 | Older brother
家姐 | gaa1 ze1 | Older sister
細佬 | sai3 lou2 | Younger brother
細妹 | sai3 mui2 | Younger sister
屋企 | uk1 kei2 | Home / household
自己 | zi6 gei2 | Oneself
一齊 | jat1 cai4 | Together
同埋 | tung4 maai4 | And / as well as
唔係 | m4 hai6 | Is not / am not
係唔係 | hai6 m4 hai6 | Is it / are you? (A-not-A)
靚 | leng3 | Pretty
去唔去 | heoi3 m4 heoi3 | Go or not? (A-not-A)
鍾唔鍾意 | zung1 m4 zung1 ji3 | Like or not? (A-not-A)
我鍾意游水 | ngo5 zung1 ji3 jau4 seoi2 | I like swimming
我同媽媽一齊住 | ngo5 tung4 maa4 maa1 jat1 cai4 zyu6 | I live with Mum
`),
    situation:
      "Fictional classmates share their hobbies and household details while planning an after-class activity.",
    goal: "Introduce an imaginary character, describe one hobby and their family, and ask a follow-up question.",
    culture:
      "Personal details here are practice material, not information the app asks learners to submit. You may invent a character’s age, job, family, and relationship status. In a real conversation, follow your partner’s comfort with personal questions.",
    sections: [
      {
        title: "3.1 A fictional profile and pronunciation recap",
        zh: "人物介紹與讀音溫習",
        recap:
          "Use a made-up profile to add detail to the introduction from Lesson 2.",
        points: [
          "Warm-up: greet your study buddy and ask how they are, using the expressions from Lesson 2.",
          "歲 follows an age: 我二十歲. Do not add 係 before an ordinary age statement.",
          "職業 means occupation. 教書 describes teaching: 我教書.",
          "學 describes learning and 做 describes doing. Their sounds and meanings differ.",
          "The source reviews b, d, m, t, y and finals e, ei, eui, o, ok. In Jyutping, the course y and eui commonly appear as j and eoi: 你 nei5, 歲 seoi3, 做 zou6, 學 hok6.",
          "Use the fictional profile rather than entering your real age or workplace.",
        ],
        terms: ["歲", "做", "學", "職業", "教書", "認識", "朋友"],
        examples: [
          ["我二十歲。", "ngo5 ji6 sap6 seoi3.", "I am twenty years old."],
          ["我教書。", "ngo5 gaau3 syu1.", "I teach."],
        ],
        dialogue: [
          [
            "Imaginary learner",
            "我叫阿文。我二十歲。",
            "ngo5 giu3 aa3 man4. ngo5 ji6 sap6 seoi3.",
            "My name is Ah Man. I am twenty.",
          ],
          [
            "Imaginary friend",
            "我叫小欣。我學廣東話。",
            "ngo5 giu3 siu2 jan1. ngo5 hok6 gwong2 dung1 waa2.",
            "My name is Siu Yan. I study Cantonese.",
          ],
        ],
        activities: [
          cards(),
          listen(
            ["我教書", "ngo5 gaau3 syu1", "I teach"],
            ["I swim", "I am married"],
          ),
          quiz(
            "Which sentence correctly gives an age?",
            ["我二十歲。", "我係二十歲。", "我歲二十。"],
            "我二十歲。",
            "The number comes before 歲; a simple age statement does not use 係.",
          ),
          speak(["我教書", "ngo5 gaau3 syu1", "I teach"]),
        ],
      },
      {
        title: "3.2 Leisure, media, and sport",
        zh: "休閒、娛樂與運動",
        recap:
          "Recall the activities from class and choose what your fictional character likes.",
        points: [
          "我鍾意 + activity expresses an interest: 我鍾意睇戲.",
          "聽音樂, 上網, 睇電視, and 睇戲 describe different media activities.",
          "游水 and 踢波 describe sport; 行街 and 旅行 describe leisure outside home.",
          "玩 means play. 唱歌 means sing, and 卡拉OK names karaoke.",
          "得閒 introduces a free-time context: 我得閒鍾意聽音樂.",
        ],
        terms: [
          "鍾意",
          "睇戲",
          "聽音樂",
          "上網",
          "睇電視",
          "游水",
          "踢波",
          "行街",
          "旅行",
          "玩",
          "唱歌",
          "卡拉OK",
          "得閒",
          "我鍾意游水",
        ],
        examples: [
          [
            "我鍾意聽音樂。",
            "ngo5 zung1 ji3 teng1 jam1 ngok6.",
            "I like listening to music.",
          ],
          ["我鍾意游水。", "ngo5 zung1 ji3 jau4 seoi2.", "I like swimming."],
          [
            "我得閒鍾意睇戲。",
            "ngo5 dak1 haan4 zung1 ji3 tai2 hei3.",
            "I like watching films in my free time.",
          ],
        ],
        dialogue: [
          [
            "Ah Man",
            "我鍾意踢波。你呢？",
            "ngo5 zung1 ji3 tek3 bo1. nei5 ne1?",
            "I like playing football. And you?",
          ],
          [
            "Siu Yan",
            "我鍾意聽音樂。",
            "ngo5 zung1 ji3 teng1 jam1 ngok6.",
            "I like listening to music.",
          ],
        ],
        activities: [
          cards(),
          match([
            ["游水", "Swimming"],
            ["踢波", "Football"],
            ["睇戲", "Watching films"],
            ["聽音樂", "Listening to music"],
          ]),
          listen(
            [
              "我鍾意聽音樂",
              "ngo5 zung1 ji3 teng1 jam1 ngok6",
              "I like listening to music",
            ],
            ["I like swimming", "I live with Mum"],
          ),
          build(
            ["我鍾意游水", "ngo5 zung1 ji3 jau4 seoi2", "I like swimming"],
            ["我", "鍾意", "游水"],
          ),
          speak(["我鍾意游水", "ngo5 zung1 ji3 jau4 seoi2", "I like swimming"]),
        ],
      },
      {
        title: "3.3 A-not-A questions",
        zh: "正反問句",
        recap:
          "Turn a statement into a yes-or-no question by repeating the main expression around 唔.",
        points: [
          "Verb + 唔 + verb asks whether someone does an action: 去唔去 means go or not go.",
          "With 鍾意, repeat the first part: 鍾唔鍾意. 你鍾唔鍾意唱歌？ asks whether you like singing.",
          "係唔係 asks whether an identity or statement is true. 靚唔靚 applies the pattern to an adjective.",
          "Answer with the relevant verb or its negative: 去 / 唔去, 係 / 唔係, 鍾意 / 唔鍾意.",
          "End particles can add conversational tone, but the A-not-A structure already forms a question.",
        ],
        terms: ["去唔去", "鍾唔鍾意", "係唔係", "唔係", "靚", "唱歌", "鍾意"],
        examples: [
          [
            "你鍾唔鍾意唱歌？",
            "nei5 zung1 m4 zung1 ji3 coeng3 go1?",
            "Do you like singing?",
          ],
          [
            "你係唔係學生？",
            "nei5 hai6 m4 hai6 hok6 saang1?",
            "Are you a student?",
          ],
          [
            "件衫靚唔靚？",
            "gin6 saam1 leng3 m4 leng3?",
            "Is the shirt pretty?",
          ],
        ],
        dialogue: [
          [
            "Buddy",
            "你鍾唔鍾意踢波？",
            "nei5 zung1 m4 zung1 ji3 tek3 bo1?",
            "Do you like playing football?",
          ],
          ["Learner", "鍾意！", "zung1 ji3!", "Yes, I do!"],
        ],
        activities: [
          quiz(
            "Choose the A-not-A question meaning 'Do you like swimming?'",
            ["你鍾唔鍾意游水？", "我鍾意游水。", "你游水。"],
            "你鍾唔鍾意游水？",
            "Put 唔 between the repeated 鍾 parts, then finish 鍾意.",
          ),
          build(
            [
              "你係唔係學生？",
              "nei5 hai6 m4 hai6 hok6 saang1?",
              "Are you a student?",
            ],
            ["你", "係", "唔", "係", "學生", "？"],
          ),
          gap(
            "你去 ___ 去圖書館？",
            "唔",
            ["唔", "呢", "我"],
            "The repeated 去 surrounds the negative 唔.",
          ),
          speak([
            "你鍾唔鍾意唱歌",
            "nei5 zung1 m4 zung1 ji3 coeng3 go1",
            "Do you like singing?",
          ]),
        ],
      },
      {
        title: "3.4 Family members",
        zh: "家庭成員",
        recap:
          "Describe the people in an imaginary family, including older and younger siblings.",
        points: [
          "爸爸 and 媽媽 refer to dad and mum in everyday family speech.",
          "哥哥 and 家姐 refer to an older brother and an older sister; 細佬 and 細妹 refer to younger siblings.",
          "The older/younger distinction is part of the word, so brother and sister each have more than one useful expression.",
          "Use 屋企 for home or a household. A fictional family can have any size.",
        ],
        terms: ["爸爸", "媽媽", "哥哥", "家姐", "細佬", "細妹", "屋企"],
        examples: [
          ["我有家姐。", "ngo5 jau5 gaa1 ze1.", "I have an older sister."],
          ["我有細佬。", "ngo5 jau5 sai3 lou2.", "I have a younger brother."],
        ],
        dialogue: [
          [
            "Ah Man",
            "我有家姐。你呢？",
            "ngo5 jau5 gaa1 ze1. nei5 ne1?",
            "I have an older sister. And you?",
          ],
          [
            "Siu Yan",
            "我有哥哥同細妹。",
            "ngo5 jau5 go4 go1 tung4 sai3 mui2.",
            "I have an older brother and a younger sister.",
          ],
        ],
        activities: [
          cards(),
          match([
            ["哥哥", "Older brother"],
            ["家姐", "Older sister"],
            ["細佬", "Younger brother"],
            ["細妹", "Younger sister"],
          ]),
          listen(
            ["我有家姐", "ngo5 jau5 gaa1 ze1", "I have an older sister"],
            ["I have a younger sister", "I am a teacher"],
          ),
          speak([
            "我有細佬",
            "ngo5 jau5 sai3 lou2",
            "I have a younger brother",
          ]),
        ],
      },
      {
        title: "3.5 Living together and linking details",
        zh: "一齊住與連接資料",
        recap:
          "Connect people and activities instead of giving isolated words.",
        points: [
          "我同 + person + 一齊住 says I live together with someone.",
          "自己住 means living on one’s own. 你係唔係自己住？ asks about that situation.",
          "同埋 links additional nouns or activities, similar to and/as well as.",
          "Describe a fictional household in one sentence, then add one hobby as a follow-up.",
        ],
        terms: [
          "住",
          "自己",
          "一齊",
          "同埋",
          "媽媽",
          "爸爸",
          "我同媽媽一齊住",
          "聽音樂",
          "睇戲",
        ],
        examples: [
          [
            "我同媽媽一齊住。",
            "ngo5 tung4 maa4 maa1 jat1 cai4 zyu6.",
            "I live with Mum.",
          ],
          [
            "我鍾意聽音樂同埋睇戲。",
            "ngo5 zung1 ji3 teng1 jam1 ngok6 tung4 maai4 tai2 hei3.",
            "I like listening to music and watching films.",
          ],
        ],
        dialogue: [
          [
            "Buddy",
            "你係唔係自己住？",
            "nei5 hai6 m4 hai6 zi6 gei2 zyu6?",
            "Do you live on your own?",
          ],
          [
            "Learner",
            "唔係，我同爸爸一齊住。",
            "m4 hai6, ngo5 tung4 baa4 baa1 jat1 cai4 zyu6.",
            "No, I live with Dad.",
          ],
        ],
        activities: [
          cards(),
          build(
            [
              "我同媽媽一齊住",
              "ngo5 tung4 maa4 maa1 jat1 cai4 zyu6",
              "I live with Mum",
            ],
            ["我", "同", "媽媽", "一齊", "住"],
          ),
          gap(
            "我鍾意游水 ___ 睇戲。",
            "同埋",
            ["同埋", "自己", "歲"],
            "同埋 connects two activities.",
          ),
          quiz(
            "Your imaginary character lives with Dad. Answer 你係唔係自己住？",
            ["唔係，我同爸爸一齊住。", "我叫小欣。", "再見。"],
            "唔係，我同爸爸一齊住。",
            "Answer the yes-or-no question, then add the living arrangement.",
            "conversation_choice",
          ),
        ],
      },
      {
        title: "3.6 Relationship and contact vocabulary",
        zh: "人物資料與聯絡詞彙",
        recap:
          "Understand the remaining profile words without having to share personal information.",
        points: [
          "單身 means single and 結咗婚 describes being married; these are optional fictional-profile details.",
          "電郵地址 means email address. Learn the expression; no email input is requested in this activity.",
          "朋友 means friend and 認識 describes knowing or meeting someone.",
          "咩 asks what: 你得閒鍾意做咩？ asks what someone likes doing in their free time.",
          "A useful introduction can describe interests rather than contact information.",
        ],
        terms: [
          "單身",
          "結咗婚",
          "電郵地址",
          "朋友",
          "認識",
          "咩",
          "得閒",
          "做",
        ],
        examples: [
          [
            "我鍾意同朋友行街。",
            "ngo5 zung1 ji3 tung4 pang4 jau5 haang4 gaai1.",
            "I like shopping with friends.",
          ],
          [
            "你得閒鍾意做咩？",
            "nei5 dak1 haan4 zung1 ji3 zou6 me1?",
            "What do you like doing in your free time?",
          ],
        ],
        dialogue: [],
        activities: [
          cards(),
          match([
            ["單身", "Single"],
            ["結咗婚", "Married"],
            ["電郵地址", "Email address"],
          ]),
          quiz(
            "Someone asks 你得閒鍾意做咩？ Choose an interest.",
            ["我鍾意睇戲。", "我二十歲。", "我同媽媽一齊住。"],
            "我鍾意睇戲。",
            "The question asks about a free-time activity.",
            "conversation_choice",
          ),
          speak([
            "你得閒鍾意做咩",
            "nei5 dak1 haan4 zung1 ji3 zou6 me1",
            "What do you like doing in your free time?",
          ]),
        ],
      },
      {
        title: "3.7 A complete introduction and follow-up",
        zh: "完整自我介紹與追問",
        recap:
          "Combine a name, a hobby, and a family sentence, then ask your buddy a question.",
        points: [
          "Build a short introduction from the patterns you reviewed, rather than memorizing a list of unconnected words.",
          "Answer a partner’s question before asking your own follow-up.",
          "Use an A-not-A question to ask about a hobby; choose the matching affirmative or negative response.",
          "Review vowels and finals in 你 nei5, 歲 seoi3, 做 zou6, 學 hok6, and 家姐 gaa1 ze1.",
        ],
        terms: [
          "我鍾意游水",
          "我同媽媽一齊住",
          "鍾唔鍾意",
          "朋友",
          "踢波",
          "唱歌",
        ],
        examples: [
          ["我鍾意唱歌。", "ngo5 zung1 ji3 coeng3 go1.", "I like singing."],
          [
            "你鍾唔鍾意游水？",
            "nei5 zung1 m4 zung1 ji3 jau4 seoi2?",
            "Do you like swimming?",
          ],
        ],
        dialogue: [
          [
            "Siu Yan",
            "我叫小欣。我鍾意唱歌。",
            "ngo5 giu3 siu2 jan1. ngo5 zung1 ji3 coeng3 go1.",
            "My name is Siu Yan. I like singing.",
          ],
          [
            "Ah Man",
            "我鍾意游水。你鍾唔鍾意游水？",
            "ngo5 zung1 ji3 jau4 seoi2. nei5 zung1 m4 zung1 ji3 jau4 seoi2?",
            "I like swimming. Do you like swimming?",
          ],
          [
            "Siu Yan",
            "鍾意！我同家姐一齊去。",
            "zung1 ji3! ngo5 tung4 gaa1 ze1 jat1 cai4 heoi3.",
            "Yes! I go together with my older sister.",
          ],
        ],
        activities: [
          quiz(
            "A buddy asks 你鍾唔鍾意唱歌？ Your fictional character does not like singing.",
            ["唔鍾意。", "唔係老師。", "我二十歲。"],
            "唔鍾意。",
            "Negate the relevant verb 鍾意, rather than answering a different identity question.",
            "scenario",
          ),
          roleplay(),
          build(
            ["我鍾意唱歌", "ngo5 zung1 ji3 coeng3 go1", "I like singing"],
            ["我", "鍾意", "唱歌"],
          ),
          speak([
            "我同媽媽一齊住",
            "ngo5 tung4 maa4 maa1 jat1 cai4 zyu6",
            "I live with Mum",
          ]),
        ],
      },
    ],
  },
  {
    id: "manners",
    title: "Manners, polite requests, and repair",
    zh: "禮貌、請求與溝通補救",
    icon: "🌼",
    topic: "Politeness · descriptive sentences · asking for help",
    introduction:
      "After Lecture 4, ask for help politely, choose the right thanks, apologize, repair misunderstandings, and encourage a partner. Review descriptive sentences and apply the unit’s expressions in complete exchanges.",
    objectives: [
      "Choose polite expressions for help, gifts, apologies, and moving past someone.",
      "Make a short borrowing request and respond to thanks or an apology.",
      "Use subject–adjective sentences without inserting 係 before an ordinary adjective.",
      "Ask someone to repeat, wish them a good trip, and give encouragement.",
      "Review the unit’s sound groups and stronger colloquial expressions in context.",
    ],
    vocabulary: vocabulary(`
唔該 | m4 goi1 | Please / thanks for a service
多謝 | do1 ze6 | Thank you for a gift or compliment
請問 | cing2 man6 | May I ask / excuse me to ask
對唔住 | deoi3 m4 zyu6 | Sorry
唔該借借 | m4 goi1 ze3 ze3 | Excuse me, let me pass
再見 | zoi3 gin3 | Goodbye
你好 | nei5 hou2 | Hello
唔使客氣 | m4 sai2 haak3 hei3 | You are welcome
等陣 | dang2 zan6 | Wait a moment
明白 | ming4 baak6 | To understand
唔明白 | m4 ming4 baak6 | Do not understand
救命 | gau3 meng6 | Help! (emergency)
麻煩晒 | maa4 faan4 saai3 | Thank you for taking the trouble
早晨 | zou2 san4 | Good morning
午安 | ng5 on1 | Good afternoon
晚安 | maan5 on1 | Good evening
早唞 | zou2 tau2 | Good night / rest well
一路平安 | jat1 lou6 ping4 on1 | Have a safe journey
幸會 | hang6 wui6 | Pleased to meet you
冇問題 | mou5 man6 tai4 | No problem
冇得傾 | mou5 dak1 king1 | Not open to discussion (strong expression)
好主意 | hou2 zyu2 ji3 | Good idea
唔好意思 | m4 hou2 ji3 si1 | Excuse me / sorry to bother you
唔係有心嘅 | m4 hai6 jau5 sam1 ge3 | Did not mean to do it
叻 | lek1 | Clever / capable
渣 | zaa2 | Poor / weak (informal, potentially unkind)
搞掂 | gaau2 dim6 | To finish / sort it out
得罪 | dak1 zeoi6 | To offend
搞錯 | gaau2 co3 | To make a mistake / mix up
加油 | gaa1 jau2 | Keep going / you can do it
借 | ze3 | To borrow / lend
俾 | bei2 | To give
幫 | bong1 | To help
可唔可以 | ho2 m4 ho2 ji5 | Can you / may I? (A-not-A)
講多次 | gong2 do1 ci3 | Say it again
好靚 | hou2 leng3 | Very pretty
肚餓 | tou5 ngo6 | Hungry
唔緊要 | m4 gan2 jiu3 | It is all right
`),
    situation:
      "Classmates borrow a pen, clear up a misunderstanding, and encourage one another after class.",
    goal: "Make a polite request, respond to help, repair a misunderstanding, and finish the exchange kindly.",
    culture:
      "唔該 commonly fits help and services; 多謝 commonly fits gifts and compliments. Tone and context matter. Strong expressions such as 冇得傾 and 渣 are included for understanding, not as recommended ways to speak to classmates.",
    sections: [
      {
        title: "4.1 Polite openers and different kinds of thanks",
        zh: "禮貌開場與道謝",
        recap:
          "Choose an expression that fits what happened, not just an English translation.",
        points: [
          "Warm-up: introduce an imaginary classmate by name and one hobby before practising a polite request.",
          "唔該 can request a service, get attention, or thank someone for helping.",
          "多謝 is commonly used for a gift or compliment. Both can translate as thank you, but their contexts differ.",
          "請問 introduces a question politely; 唔好意思 softens an interruption or inconvenience.",
          "幸會 is a more formal pleased-to-meet-you expression; 你好 is a general greeting.",
          "Return thanks with 唔使客氣.",
        ],
        terms: ["唔該", "多謝", "請問", "唔好意思", "幸會", "你好", "唔使客氣"],
        examples: [
          ["唔該幫我。", "m4 goi1 bong1 ngo5.", "Please help me."],
          [
            "多謝你嘅禮物。",
            "do1 ze6 nei5 ge3 lai5 mat6.",
            "Thank you for your gift.",
          ],
        ],
        dialogue: [
          [
            "Classmate",
            "唔好意思，請問老師喺邊？",
            "m4 hou2 ji3 si1, cing2 man6 lou5 si1 hai2 bin1?",
            "Excuse me, may I ask where the teacher is?",
          ],
          [
            "Buddy",
            "老師喺課室。",
            "lou5 si1 hai2 fo3 sat1.",
            "The teacher is in the classroom.",
          ],
          [
            "Classmate",
            "唔該晒！",
            "m4 goi1 saai3!",
            "Thank you very much for helping!",
          ],
        ],
        activities: [
          cards(),
          match([
            ["請問", "Start a polite question"],
            ["多謝", "Thank someone for a gift"],
            ["唔使客氣", "Respond to thanks"],
          ]),
          quiz(
            "A classmate gives you a birthday card. What fits?",
            ["多謝！", "對唔住！", "救命！"],
            "多謝！",
            "多謝 is suitable for a gift.",
            "scenario",
          ),
          listen(
            ["唔該幫我", "m4 goi1 bong1 ngo5", "Please help me"],
            ["Have a safe journey", "Good night"],
          ),
        ],
      },
      {
        title: "4.2 Descriptive sentences",
        zh: "用形容詞描述",
        recap: "Recall how Cantonese describes a state or quality directly.",
        points: [
          "An ordinary descriptive sentence uses subject + adjective or state phrase, without inserting 係.",
          "好 before an adjective can describe a quality: 呢件衫好靚 means this shirt is very pretty.",
          "我肚餓 says I am hungry. 肚餓 is the whole state expression.",
          "你好 is familiar as a greeting, but do not assume every adjective needs 係 because English uses am/is/are.",
          "Use descriptive sentences to explain why you need help.",
        ],
        terms: ["好靚", "肚餓", "叻", "好主意", "你好"],
        examples: [
          [
            "呢件衫好靚。",
            "ni1 gin6 saam1 hou2 leng3.",
            "This shirt is very pretty.",
          ],
          ["我肚餓。", "ngo5 tou5 ngo6.", "I am hungry."],
        ],
        dialogue: [
          ["Learner", "我肚餓。", "ngo5 tou5 ngo6.", "I am hungry."],
          [
            "Buddy",
            "一齊食嘢，好主意！",
            "jat1 cai4 sik6 je5, hou2 zyu2 ji3!",
            "Eating together is a good idea!",
          ],
        ],
        activities: [
          cards(),
          build(
            [
              "呢件衫好靚",
              "ni1 gin6 saam1 hou2 leng3",
              "This shirt is very pretty",
            ],
            ["呢件衫", "好", "靚"],
          ),
          quiz(
            "Choose the natural simple statement 'I am hungry.'",
            ["我肚餓。", "我係肚餓。", "肚餓我係。"],
            "我肚餓。",
            "Do not insert 係 before this state expression.",
          ),
          speak(["我肚餓", "ngo5 tou5 ngo6", "I am hungry"]),
        ],
      },
      {
        title: "4.3 Borrowing and asking for help",
        zh: "借物與請人幫忙",
        recap: "Make a complete request, then acknowledge the help.",
        points: [
          "可唔可以 forms a can/may question. It follows the A-not-A pattern from Lesson 3.",
          "借 can mean borrow or lend depending on the sentence; 俾 identifies giving something to someone.",
          "請問你可唔可以借支筆俾我？ politely asks a classmate to lend you a pen.",
          "冇問題 agrees to help. 麻煩晒 acknowledges the trouble someone took.",
          "救命 is an urgent call for help in an emergency, not an ordinary request to borrow classroom equipment.",
        ],
        terms: [
          "請問",
          "可唔可以",
          "借",
          "俾",
          "幫",
          "冇問題",
          "麻煩晒",
          "救命",
        ],
        examples: [
          ["可唔可以幫我？", "ho2 m4 ho2 ji5 bong1 ngo5?", "Can you help me?"],
          [
            "請問可唔可以借支筆俾我？",
            "cing2 man6 ho2 m4 ho2 ji5 ze3 zi1 bat1 bei2 ngo5?",
            "May I borrow a pen, please?",
          ],
        ],
        dialogue: [
          [
            "Siu Yan",
            "請問可唔可以借支筆俾我？",
            "cing2 man6 ho2 m4 ho2 ji5 ze3 zi1 bat1 bei2 ngo5?",
            "May I borrow a pen, please?",
          ],
          [
            "Ah Man",
            "冇問題。俾你。",
            "mou5 man6 tai4. bei2 nei5.",
            "No problem. Here you are.",
          ],
          [
            "Siu Yan",
            "麻煩晒，唔該！",
            "maa4 faan4 saai3, m4 goi1!",
            "Thank you for taking the trouble!",
          ],
          ["Ah Man", "唔使客氣。", "m4 sai2 haak3 hei3.", "You are welcome."],
        ],
        activities: [
          cards(),
          build(
            ["可唔可以幫我", "ho2 m4 ho2 ji5 bong1 ngo5", "Can you help me?"],
            ["可", "唔", "可以", "幫", "我"],
          ),
          quiz(
            "A classmate politely asks to borrow your pen. You agree.",
            ["冇問題。", "再見。", "救命！"],
            "冇問題。",
            "冇問題 accepts the request.",
            "conversation_choice",
          ),
          speak([
            "可唔可以幫我",
            "ho2 m4 ho2 ji5 bong1 ngo5",
            "Can you help me?",
          ]),
          gap(
            "Someone thanks you: 多謝！ Reply: ___ 。",
            "唔使客氣",
            ["唔使客氣", "對唔住", "救命"],
            "唔使客氣 is a response to thanks.",
          ),
        ],
      },
      {
        title: "4.4 Apologies, mistakes, and moving past someone",
        zh: "道歉、錯誤與借過",
        recap:
          "Distinguish a polite interruption from an apology after a mistake.",
        points: [
          "Use 對唔住 after causing a mistake or inconvenience, and 唔好意思 to soften a minor interruption.",
          "唔該借借 asks someone to let you pass; it is different from borrowing an object.",
          "搞錯 describes mixing something up. 唔係有心嘅 explains that you did not intend the action.",
          "得罪 means offend. A kind response to a small accident is 唔緊要.",
          "Avoid using 冇得傾 as a polite refusal: it sounds firm and shuts down discussion.",
        ],
        terms: [
          "對唔住",
          "唔好意思",
          "唔該借借",
          "搞錯",
          "唔係有心嘅",
          "得罪",
          "唔緊要",
          "冇得傾",
        ],
        examples: [
          [
            "對唔住，我搞錯咗。",
            "deoi3 m4 zyu6, ngo5 gaau2 co3 zo2.",
            "Sorry, I mixed it up.",
          ],
          ["唔該借借。", "m4 goi1 ze3 ze3.", "Excuse me, let me pass."],
        ],
        dialogue: [
          [
            "Learner",
            "對唔住，我搞錯咗。",
            "deoi3 m4 zyu6, ngo5 gaau2 co3 zo2.",
            "Sorry, I mixed it up.",
          ],
          ["Buddy", "唔緊要。", "m4 gan2 jiu3.", "It is all right."],
          [
            "Learner",
            "我唔係有心嘅。",
            "ngo5 m4 hai6 jau5 sam1 ge3.",
            "I did not mean to do it.",
          ],
        ],
        activities: [
          cards(),
          match([
            ["唔該借借", "Ask to move past someone"],
            ["對唔住", "Apologize after a mistake"],
            ["唔緊要", "Reassure after a small accident"],
          ]),
          quiz(
            "A classmate is standing in a narrow doorway. What would you say to pass?",
            ["唔該借借。", "冇得傾。", "好主意。"],
            "唔該借借。",
            "This phrase asks politely for space to pass.",
            "scenario",
          ),
          speak([
            "對唔住，我搞錯咗",
            "deoi3 m4 zyu6, ngo5 gaau2 co3 zo2",
            "Sorry, I mixed it up",
          ]),
        ],
      },
      {
        title: "4.5 Understanding, repeating, and waiting",
        zh: "明白、重講與等待",
        recap: "Use a repair phrase when a conversation is too fast.",
        points: [
          "明白 means understand; put 唔 before it to say 唔明白.",
          "請問可唔可以講多次？ asks someone to say it again politely.",
          "等陣 requests a short wait. Add 唔該 if you need to get the listener’s attention politely.",
          "Admitting that you did not understand is useful practice, rather than pretending you followed the whole exchange.",
          "Try the shorter phrase first, then use the full polite request.",
        ],
        terms: ["明白", "唔明白", "講多次", "等陣", "請問", "可唔可以"],
        examples: [
          ["我唔明白。", "ngo5 m4 ming4 baak6.", "I do not understand."],
          ["唔該講多次。", "m4 goi1 gong2 do1 ci3.", "Please say it again."],
        ],
        dialogue: [
          [
            "Learner",
            "唔好意思，我唔明白。",
            "m4 hou2 ji3 si1, ngo5 m4 ming4 baak6.",
            "Sorry, I do not understand.",
          ],
          [
            "Buddy",
            "等陣，我講多次。",
            "dang2 zan6, ngo5 gong2 do1 ci3.",
            "Wait a moment; I will say it again.",
          ],
          [
            "Learner",
            "而家明白喇，唔該！",
            "ji4 gaa1 ming4 baak6 laa3, m4 goi1!",
            "Now I understand, thank you!",
          ],
        ],
        activities: [
          cards(),
          listen(
            ["我唔明白", "ngo5 m4 ming4 baak6", "I do not understand"],
            ["I am hungry", "I am going home"],
          ),
          gap(
            "我 ___ 明白，可唔可以講多次？",
            "唔",
            ["唔", "係", "好"],
            "唔 negates 明白.",
          ),
          quiz(
            "You missed what someone said. Choose a useful request.",
            ["唔該講多次。", "一路平安。", "冇得傾。"],
            "唔該講多次。",
            "Ask for repetition instead of guessing.",
            "scenario",
          ),
          speak(["唔該講多次", "m4 goi1 gong2 do1 ci3", "Please say it again"]),
        ],
      },
      {
        title: "4.6 Good wishes, encouragement, and register",
        zh: "祝福、鼓勵與語氣",
        recap:
          "Choose words that support the other person and suit the situation.",
        points: [
          "一路平安 wishes someone a safe journey. 早唞 is used when saying good night or wishing someone rest; 晚安 can be an evening greeting.",
          "加油 encourages effort. 叻 praises ability; 好主意 approves an idea.",
          "搞掂 describes finishing or sorting out a task.",
          "渣 is a strong informal judgment of poor quality or ability; understand it without using it to label a classmate.",
          "The unit reviews course-spelling initials m, g, j, h, ch and finals i, au, aau, ing, ou. Compare the app’s Jyutping: 唔該 m4 goi1, 加油 gaa1 jau2, 請問 cing2 man6, 搞掂 gaau2 dim6.",
        ],
        terms: [
          "一路平安",
          "早唞",
          "晚安",
          "早晨",
          "午安",
          "加油",
          "叻",
          "好主意",
          "搞掂",
          "渣",
          "再見",
        ],
        examples: [
          [
            "加油，你做到！",
            "gaa1 jau2, nei5 zou6 dou2!",
            "Keep going, you can do it!",
          ],
          ["我搞掂喇。", "ngo5 gaau2 dim6 laa3.", "I have finished it."],
          ["一路平安！", "jat1 lou6 ping4 on1!", "Have a safe journey!"],
        ],
        dialogue: [
          ["Buddy", "加油！", "gaa1 jau2!", "Keep going!"],
          [
            "Learner",
            "我搞掂喇。",
            "ngo5 gaau2 dim6 laa3.",
            "I have finished it.",
          ],
          ["Buddy", "你好叻！", "nei5 hou2 lek1!", "You did very well!"],
        ],
        activities: [
          cards(),
          quiz(
            "Your friend leaves for a trip. What fits?",
            ["一路平安！", "我肚餓。", "唔明白。"],
            "一路平安！",
            "Wish the traveller a safe journey.",
            "scenario",
          ),
          match([
            ["早唞", "Good night / rest well"],
            ["加油", "Encourage effort"],
            ["搞掂", "Finish or sort out a task"],
          ]),
          listen(
            ["加油", "gaa1 jau2", "Keep going / you can do it"],
            ["Good evening", "I do not understand"],
          ),
        ],
      },
      {
        title: "4.7 Polite exchanges and final review",
        zh: "禮貌對話與課後總結",
        recap:
          "Put a request, thanks, an apology, and a repair phrase into one practice exchange.",
        points: [
          "A polite exchange can contain an opener, request, response, and thanks.",
          "Choose 多謝 for a gift or compliment and 唔該 for the kind of help practised here.",
          "Check three class questions: how to wish someone a good trip, how to ask for repetition, and how to respond to thanks.",
          "Review descriptive word order: 我肚餓 and 呢件衫好靚 use no extra 係.",
          "Save difficult phrases, listen again, and record one full sentence for pronunciation feedback.",
        ],
        terms: [
          "請問",
          "唔該",
          "唔使客氣",
          "對唔住",
          "講多次",
          "一路平安",
          "可唔可以",
        ],
        examples: [
          [
            "請問可唔可以幫我？",
            "cing2 man6 ho2 m4 ho2 ji5 bong1 ngo5?",
            "May I ask you to help me?",
          ],
          ["唔使客氣。", "m4 sai2 haak3 hei3.", "You are welcome."],
        ],
        dialogue: [
          [
            "Learner",
            "請問可唔可以幫我？",
            "cing2 man6 ho2 m4 ho2 ji5 bong1 ngo5?",
            "May I ask you to help me?",
          ],
          ["Buddy", "冇問題。", "mou5 man6 tai4.", "No problem."],
          ["Learner", "唔該晒！", "m4 goi1 saai3!", "Thank you very much!"],
          ["Buddy", "唔使客氣。", "m4 sai2 haak3 hei3.", "You are welcome."],
        ],
        activities: [
          quiz(
            "Someone says 唔該晒！ Choose the appropriate response.",
            ["唔使客氣。", "唔明白。", "我肚餓。"],
            "唔使客氣。",
            "Respond to thanks with you are welcome.",
            "conversation_choice",
          ),
          roleplay(),
          build(
            [
              "請問可唔可以幫我",
              "cing2 man6 ho2 m4 ho2 ji5 bong1 ngo5",
              "May I ask you to help me?",
            ],
            ["請問", "可", "唔", "可以", "幫", "我"],
          ),
          speak([
            "請問可唔可以幫我",
            "cing2 man6 ho2 m4 ho2 ji5 bong1 ngo5",
            "May I ask you to help me?",
          ]),
        ],
      },
    ],
  },
];
