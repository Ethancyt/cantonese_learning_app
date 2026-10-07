import { normalize } from "../schema";
export function speakingFeedback(expected: string, recognized: string) {
  return {
    expected,
    recognized,
    matches: normalize(expected) === normalize(recognized),
    message:
      normalize(expected) === normalize(recognized)
        ? "The recognized words match. Great effort!"
        : "The recognized words differ. Listen to the model and try again. Transcription can also make mistakes.",
    note: "This checks recognized words, not tone accuracy or a pronunciation score.",
  };
}
