import { getCloudflareContext } from "@opennextjs/cloudflare";
import { workshopOne } from "../content/workshop-one";
import { lessonAudioTexts } from "../lesson-audio";
import { listeningAudio, type SharedAudioCache } from "./listening-audio";
import type { Settings } from "./settings";

declare global {
  interface CloudflareEnv {
    WORKSHOP_AUDIO?: SharedAudioCache;
  }
}

export const publicWorkshopAudioTexts = new Set(lessonAudioTexts(workshopOne));

export function isPublicWorkshopAudio(
  lessonId: string,
  version: number,
  text: string,
) {
  return (
    lessonId === workshopOne.id &&
    version === workshopOne.version &&
    publicWorkshopAudioTexts.has(text)
  );
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
