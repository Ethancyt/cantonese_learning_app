import { getCloudflareContext } from "@opennextjs/cloudflare";
import { publicWorkshops } from "../content/public-workshops";
import { lessonAudioTexts } from "../lesson-audio";
import { listeningAudio, type SharedAudioCache } from "./listening-audio";
import type { Settings } from "./settings";

declare global {
  interface CloudflareEnv {
    WORKSHOP_AUDIO?: SharedAudioCache;
  }
}

const audioByWorkshop = new Map(
  publicWorkshops.map((lesson) => [
    lesson.id,
    { version: lesson.version, texts: new Set(lessonAudioTexts(lesson)) },
  ]),
);
export const publicWorkshopAudioTexts = new Set(
  Array.from(audioByWorkshop.values()).flatMap(({ texts }) => [...texts]),
);

export function isPublicWorkshopAudio(
  lessonId: string,
  version: number,
  text: string,
) {
  const workshop = audioByWorkshop.get(lessonId);
  return workshop?.version === version && workshop.texts.has(text);
}

export function workshopListeningAudio(
  text: string,
  settings: Settings,
  origin: string,
) {
  let shared: SharedAudioCache | undefined;
  try {
    shared = getCloudflareContext().env.WORKSHOP_AUDIO;
  } catch {
    // Local Next.js runs without Cloudflare bindings.
  }
  return listeningAudio(text, settings, origin, shared);
}
