import type { Exercise } from "../schema";

export type Phrase = [traditional: string, jyutping: string, english: string];
export type Line = [speaker: string, ...phrase: Phrase];
export type CourseSection = {
  title: string;
  zh: string;
  recap: string;
  points: string[];
  terms: string[];
  examples: Phrase[];
  dialogue: Line[];
  activities: Partial<Exercise>[];
};
export type CourseLesson = {
  id: string;
  title: string;
  zh: string;
  icon: string;
  topic: string;
  introduction: string;
  objectives: string[];
  vocabulary: Phrase[];
  sections: CourseSection[];
  situation: string;
  goal: string;
  culture: string;
};

export function vocabulary(text: string): Phrase[] {
  return text
    .trim()
    .split("\n")
    .map((row) => row.split("|").map((s) => s.trim()) as Phrase);
}
export const cards = (): Partial<Exercise> => ({
  type: "flashcard",
  instruction: "Review this part of the lecture",
  prompt: "Connect each word to its example sentence",
});
export function quiz(
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  type:
    "multiple_choice" | "scenario" | "conversation_choice" = "multiple_choice",
): Partial<Exercise> {
  return {
    type,
    instruction:
      type === "scenario"
        ? "Use it after class"
        : type === "conversation_choice"
          ? "Continue the conversation"
          : "Check your understanding",
    prompt,
    options,
    answer,
    explanation,
  };
}
export function listen(
  [prompt, jyutping, english]: Phrase,
  alternatives: string[],
): Partial<Exercise> {
  return {
    type: "listen_choose",
    instruction: "Listen to the complete phrase",
    prompt,
    jyutping,
    options: [english, ...alternatives],
    answer: english,
    explanation: `${prompt} · ${jyutping} · ${english}`,
  };
}
export function speak([answer, jyutping, english]: Phrase): Partial<Exercise> {
  return {
    type: "speak",
    instruction: "Say the phrase and check pronunciation",
    prompt: answer,
    answer,
    jyutping,
    english,
    explanation:
      "Listen first, record the target phrase, and choose Check pronunciation for Azure feedback.",
  };
}
export function build(
  [answer, jyutping, english]: Phrase,
  tokens: string[],
): Partial<Exercise> {
  return {
    type: "sentence_order",
    instruction: "Rebuild the sentence pattern",
    prompt: english,
    answer,
    tokens,
    jyutping,
    english,
    explanation: `${answer} · ${jyutping} · ${english}`,
  };
}
export function match(pairs: [string, string][]): Partial<Exercise> {
  return {
    type: "match",
    instruction: "Connect vocabulary to its use",
    prompt: "Match each expression with its meaning",
    pairs: pairs.map(([left, right]) => ({ left, right })),
  };
}
export function gap(
  prompt: string,
  answer: string,
  options: string[],
  explanation: string,
): Partial<Exercise> {
  return {
    type: "fill_blank",
    instruction: "Recall the missing expression",
    prompt,
    answer,
    options,
    explanation,
  };
}
export const roleplay = (): Partial<Exercise> => ({
  type: "ai_roleplay",
  instruction: "Practise a short after-class conversation",
  prompt: "Use the phrases from this lesson in three short replies.",
});
