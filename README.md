# Little Hong Kong · 一齊講廣東話

A functional FYP prototype for **workshop → practice → reviewed digital content**. Volunteers teach in person; learners use short Cantonese journeys afterward. The centrepiece is **upload → source review → generate → edit → approve → publish**.

## Run immediately

Requires Node.js 22.3 or newer (built and tested with Node.js 24).

```sh
npm ci
npm run dev
```

The development server defaults to **demo mode** without any accounts or API keys. Entering volunteer demo mode seeds an original café source document in your Studio. For a production build of an isolated presentation demo:

```sh
npm run build
APP_MODE=demo npm start
```

Open the server in your usual local browser. Routes: `/` student dashboard, `/journey/[id]` practice, `/review` wordbook and personalized review, `/studio` Volunteer Content Studio.

Demo content, drafts, immutable published versions, attempts, completions, reports, source text, and generation records persist in `.data/demo.json`. This file is ignored by Git. Demo learners have an anonymous HTTP-only cookie identity. Saved vocabulary bookmarks are kept on the current browser/device. Back up `.data` to retain a presentation; delete it only when intentionally resetting a disposable demo. The local atomic file store is for **one running server process** with persistent disk, not multi-instance or serverless production.

## Presentation walkthrough

1. Browse the four original journeys: 開始學廣東話, 打招呼, 自我介紹, 有禮貌.
2. Open a journey, reveal vocabulary cards, save a word, and complete an activity. Wrong answers are saved for review.
3. Try speaking: record and replay your own audio, or practise aloud. Without a speech provider, no transcription or pronunciation score is invented.
4. Try the workshop buddy. Unconfigured AI uses visibly labelled, constrained scripted replies.
5. Switch to volunteer mode. Choose **Try sample workshop**, then **Find the learning content**.
6. Review the café vocabulary, Jyutping, objectives, and source sections. Select practice types and generate a draft.
7. Edit an instruction or question. Preview uses the same renderer as student practice. Save the draft.
8. Continue to publication, check the human review acknowledgement, click **Approve this draft**, and then **Publish to students**.
9. The new journey appears immediately on the student dashboard. Complete its activities and show XP, mistakes, and the personalized wordbook.
10. In Studio, choose **Create revision** on a published journey. Version 1 stays available until reviewed Version 2 is published. Previous published snapshots remain immutable.

Analytics display **actual workspace activity**, not fabricated figures. An empty workspace correctly starts at zero.

## Architecture

- **Next.js App Router + TypeScript** with reusable semantic, keyboard-accessible components and responsive CSS. Original SVG harbour and journey illustrations; no proprietary assets.
- `lib/schema.ts`: strict Zod lesson, vocabulary, exercise and provenance contracts. All ten exercise types share `components/exercise-renderer.tsx`. No new React page is needed for a generated journey.
- `lib/seeds.ts`: original workshop content for Units 0–3 and an original café workshop. EduHK [Survival Cantonese](https://www.eduhk.hk/cle/resources/cep/cantonese-survival-package/index.html) supplies topic/progression inspiration only. No source text, dialogue, audio, images or quizzes are reproduced.
- `lib/server/extraction.ts`: TXT/Markdown, text PDFs, DOCX and PPTX extraction. File types, magic bytes, archive expansion, text size and uploaded size are checked. PDF keeps page numbers and PPTX keeps slide numbers; other formats retain the nearest source chunk. Scanned PDFs/OCR are outside the MVP.
- `lib/ai/provider.ts`: replaceable `AIProvider` interface plus an OpenAI-compatible JSON text adapter. No vendor calls in UI code.
- `lib/ai/lesson-generator.ts`: source extraction, reviewed learning content, relevant style retrieval, generation, strict validation and provenance checks. Published references guide structure only.
- `lib/ai/roleplay.ts`: short scenario-bound replies, lesson vocabulary, hints, Jyutping, translation and three-turn practice. No general-purpose chat.
- `lib/ai/feedback.ts`: compare recognized words with the expected phrase. It does **not** measure Cantonese tones or phonetic pronunciation quality.
- `lib/server/repository.ts`: local demo/Supabase persistence adapter. `lib/server/security.ts`: role checks, authenticated Supabase users, same-origin mutations, input limits and per-user endpoint throttles.
- `lib/progress.ts`: mistake, mastery and elapsed-time review priority. +10 XP once per correctly answered exercise/version and +20 once per completed journey/version. Flashcards, self-reported speaking and roleplay earn completion credit, but no “correct answer” XP. Streak dates use Hong Kong time.

## Real AI and speech (optional)

Copy `.env.example` to `.env.local`, then enter credentials locally or securely in your deployment settings. Never commit keys.

- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`: enable source analysis, lesson generation and constrained roleplay through an OpenAI-compatible endpoint. A configured provider failure is shown as an error; it does not silently produce a fake AI result.
- `SPEECH_API_KEY`, `SPEECH_API_URL`, `SPEECH_MODEL`: enable multipart audio transcription. Audio is sent only when the learner explicitly chooses **Check recognized words**; it is not stored by this app.
- Browser listening uses an installed `zh-HK`/`yue` voice. If none exists, the UI tells the learner; it never silently substitutes Mandarin. Device voice availability varies.
- Optional roleplay voice input uses the browser's speech recognition API and its own browser/provider behavior. Typed and suggested replies always work. Microphone recording needs a secure browser context and permission.

Demo extraction understands lines like:

```text
Goal: greet a new workshop friend.
你好 | nei5 hou2 | Hello
早晨 | zou2 san4 | Good morning
再見 | zoi3 gin3 | Goodbye
Culture: Wave goodbye when the workshop ends.
```

Unstructured materials require the connected AI provider. Demo generation uses source-based **beginner templates**, and is explicitly labelled. Intermediate/advanced demo generation is disabled. Volunteers must verify Cantonese, Jyutping, pedagogical quality, source permissions and age suitability even when connected AI is used.

## Supabase deployment

1. Run `npm run supabase:prepare`. For a **new empty project**, run `supabase/setup-new-project.sql` in the Supabase SQL editor. For a project already using our original `schema.sql`, run **only** `supabase/upgrade-existing-project.sql`. Never run the new-project file on an existing installation.
2. Both prepared files include the four module seeds. Updates add version 2 and preserve all earlier published snapshots, accounts, attempts, and workshop content. Rerunning the upgrade is safe.
3. Set `APP_MODE=supabase`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Set the public variables before building Next.js. A publishable/anon key is intended for the client; never use a service-role key here.
4. Create/invite accounts in Supabase Auth. New accounts get `student` profiles. Assign approved staff roles using trusted SQL, e.g. `update public.profiles set role='volunteer' where id='<approved-user-uuid>';`. Users cannot promote their own profiles.
5. Run `npm run supabase:check` to verify Auth and schema reachability without exposing keys. Sign in through the app with an existing email/password account. Student/volunteer switching is available only in demo mode. The admin role can access all drafts, workshop analytics and unpublish journeys in Studio.
6. Supabase RLS scopes drafts and sources to staff owners, published snapshots to signed-in learners, attempts/mastery to their student, and aggregate analytics to the staff member's workshops. The publishing RPC requires approval and atomically creates an immutable snapshot. Database triggers also recompute answer correctness and prevent completion before every activity is attempted.

The schema includes normalized profiles, workshops, journeys, source materials/chunks, vocabulary, exercises, lesson order, student attempts/mastery, generation records, published versions, completions and content reports. Vocabulary/exercise/source indexes are maintained by triggers. Lesson JSON is the canonical presentation contract. A private Storage bucket and owner policies are prepared; **the MVP currently retains extracted text, not the original binary upload**, so Storage file retention is an extension point. The initial UI stores workshop/topic labels with lessons; full workshop/user-management screens are outside this MVP. Reports are persisted; a dedicated moderation queue is a next step.

## Validation

```sh
npm run typecheck
npm run build
npm test
# Against a running isolated demo server:
TEST_BASE_URL=http://localhost:3000 npm test
TEST_BASE_URL=http://localhost:3000 npx tsx scripts/browser-check.ts
```

Browser checks need Chromium (`CHROMIUM_PATH` can override `/usr/bin/chromium`) and write screenshots to `/workspace/artifacts`. The HTTP test is explicitly skipped without `TEST_BASE_URL`. The PostgreSQL permission test uses PGlite to apply the actual migration with minimal Auth/Storage shims; it checks publishing gates, role escalation, privacy, server-derived correctness and mastery. This is not a substitute for testing a configured live Supabase project.

## Deployment boundaries

The complete local demonstration is operational. Live Supabase, paid AI and transcription endpoints require your credentials and separate live validation. Demo role switching is intentionally permissive: **do not expose `APP_MODE=demo` as a real multi-user children's platform**. Real deployments require Supabase mode, TLS, staff provisioning, consent/retention policies and provider review appropriate to your actual users. Current in-memory rate limiting assumes one process; use a shared limiter before scaling across instances. Retrieved source documents and generated educational content always need human review; output validation does not certify linguistic correctness.


## Structured learning modules

The four original topics now use coherent modules with four sections each: context, teaching points, bilingual/Jyutping dialogues, sentence examples, and linked practice. The player introduces each section before practice and lets learners revisit the conversation. Flashcards use only that section’s phrases. Studio can review teaching points and maintains section activity links during edits. Uploaded workshops receive a source-based module scaffold for staff review; a source without a translated dialogue is not given an invented dialogue.

`lib/content/modules.ts` contains original workshop content. The EduHK page is linked as a reference, but its full outline and assets could not be retrieved in the cloud network used for this task. These four modules follow the topics specified in the project brief; they do not claim to reproduce the entire official Survival Cantonese package. Supply the remaining topic outline to extend the course accurately. Database lesson JSON remains canonical, with normalized module/section indexes and RLS added by migration 002.

To update your Windows copy, stop its dev server, extract the updated source files into the existing folder, preserve `.env.local` and `.data`, then run `npm ci` and `npm run dev`. Existing demo version 1 progress is preserved and the new curriculum appears as version 2. Your local Windows filesystem cannot be modified from this cloud workspace.
