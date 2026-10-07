# Little Hong Kong · 一齊講廣東話

A functional FYP prototype for **workshop → practice → reviewed digital content**. Volunteers teach in person; learners use short Cantonese journeys afterward. The centrepiece is **upload → source review → generate → edit → approve → publish**.

## Run immediately

Requires Node.js 22.3 or newer (built and tested with Node.js 24). On Windows, double-click **Start-Workshop.cmd** to install dependencies, start the local website, and open Developer setup. You can also use the commands below.

```sh
npm ci
npm run dev
```

Startup checks installed packages against the lockfile and automatically installs missing or updated dependencies. This also handles new packages after `git pull`; you do not need to edit code or install individual packages.

The development server defaults to **demo mode** without any accounts or API keys. Entering volunteer demo mode seeds an original café source document in your Studio. For a production build of an isolated presentation demo:

```sh
npm run build
npm start
```

Open **http://localhost:3000** in your local browser. Visit **http://localhost:3000/developer** for browser-based API keys and Supabase setup. No `.env` editing is needed. Routes: `/` student dashboard, `/journey/[id]` practice, `/review` wordbook and personalized review, `/studio` Volunteer Content Studio.

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

Use **Developer setup** at `/developer` to enter keys, endpoints, and model names. New setups default to **OpenRouter** for lesson AI and **Azure Speech** for Cantonese TTS and STT. Existing saved provider choices are preserved; use **Use OpenRouter + Azure defaults** on that page to switch. The button clears credentials for changed providers when saved, while preserving Supabase settings. No file editing is needed. The environment variables below remain an optional fallback for advanced hosting; never commit credentials.


**Knowlez subscriptions:** click **Use OpenRouter + Knowlez** in Developer setup. The [TTS contract](https://api-tts.knowlez.com/openapi.json) uses `X-API-Key` and JSON `{text, voice, format: "mp3", speed: 0.85, return: "audio"}`; MP3 bytes enter the same private, reusable lesson storage as other providers. The [STT contract](https://api-stt.knowlez.com/openapi.json) uses `X-API-Key` and JSON `{audio_base64, filename}` for local recordings; language is automatically detected and the transcript is used for word matching. There is no OpenAI model field or Microsoft region for these APIs. Contracts were checked on 7 October 2026.

Knowlez's documented TTS default is `af_bella`; its public API contract does **not** confirm a Cantonese voice or Cantonese recognition quality. Enter a voice confirmed by Knowlez and listen before publishing Cantonese materials. A successful connection test confirms an audio response, not language quality. For guaranteed provider-level `zh-HK` voice selection, use a direct Microsoft Azure Speech resource and its resource key. Your Knowlez activation key cannot authenticate directly with Microsoft, even if purchased through a marketplace.

- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`: enable source analysis, lesson generation and constrained roleplay through an OpenAI-compatible endpoint. A configured provider failure is shown as an error; it does not silently produce a fake AI result.
- `SPEECH_API_KEY`, `SPEECH_PROVIDER`, `SPEECH_REGION`: configure Azure Cantonese (`zh-HK`) recognition; choose `compatible` with `SPEECH_API_URL` and `SPEECH_MODEL` for multipart transcription. Audio is sent only when the learner explicitly chooses **Check recognized words**; it is not stored by this app.
- Listening first plays reviewed, saved lesson audio when available. Otherwise browser listening uses an installed `zh-HK`/`yue` voice. If none exists, the UI tells the learner; it never silently substitutes Mandarin. Device voice availability varies.
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

## Generate and reuse lesson audio

In **Developer setup**, choose **Azure Speech · Hong Kong Cantonese**, enter your Speech resource key and its region, and choose a Hong Kong voice (HiuMaan, HiuGaai, or WanLung). Alternatively configure an OpenAI-compatible `/audio/speech` endpoint, model, voice and key. Cantonese quality depends on that model: listen for unwanted Mandarin readings. OpenRouter chat generation remains separate from voice generation and learner transcription. **Save & test lesson voice** makes one short provider request; it does not assess linguistic quality.

For connected accounts, run **Initialize learning database** once more to add the private `lesson-audio` Storage bucket and permissions. The button preserves existing content and history. Existing projects can also apply migration `003_lesson_audio.sql` through their deployment tooling.

The workflow for every new material is:

1. Upload or paste material, generate a draft, and review Cantonese/Jyutping and lesson structure.
2. In the draft editor, choose **Generate lesson audio**. The app saves the draft, generates unique Cantonese words, example sentences, dialogue lines and listening/speaking prompts in resumable batches, and shows progress. Provider quotas/charges apply.
3. Listen to the saved clips in Studio; correct the wording and regenerate if needed. Matching unchanged clips are reused. Changing the voice/model and generating again creates new clips.
4. Approve and publish. Learners' Listen buttons reuse stored MP3s without calling the voice provider. Newly uploaded material follows the same workflow.

Local MP3s live in `.data/audio/`; Supabase mode stores MP3s in a private Storage bucket and clip text, voice/model, creation time and IDs inside versioned lesson JSON. Published snapshots retain their original clips. Saving edited text removes mismatched draft references; browser-submitted audio references cannot replace server-generated metadata. Students can access only clips referenced by available published lessons; owned drafts are limited to staff. Files are never overwritten. Keep `.data` backed up in local mode and retain referenced Storage objects in connected mode.

This generates the **example voice learners hear**. Microphone transcription uses **Speech-to-text (STT)**, with Azure Cantonese recognition selected by default. Browser recordings are converted locally into mono 16 kHz PCM WAV before an explicit word-check request; the original recording stays on the device. Transcript matching does not grade Cantonese tones or phonetic pronunciation. Generation requires your provider credentials; no live voice provider or Supabase project is configured by this repository alone.

If a speech provider rejects a request, the website displays its HTTP status without exposing its response body or your key. For Azure, **401** indicates authentication failure: copy a Speech resource key and use that resource’s exact region. **403** indicates access restrictions; check resource permissions, subscription status and networking. **400** indicates a request/voice format issue; update the app and choose a listed Hong Kong voice. **429** can mean quota, rate limits or temporary voice capacity; retry later and check usage limits. **5xx** indicates a provider service error. These messages identify the failure category; they do not verify your Azure account configuration.

## Browser-based developer setup

1. Start with `npm run dev` (or `npm run build` then `npm start`) and open `/developer`.
2. Create a developer password of at least 12 characters. This account is separate from student/volunteer roles.
3. Under **AI lesson generation**, paste your OpenRouter key (default URL `https://openrouter.ai/api/v1`, model `openai/gpt-4.1-mini`). Under **Text-to-speech (TTS)**, paste your Azure Speech key into **Lesson voice API key**, select a Cantonese voice, and enter the resource region. Under **Speech-to-text (STT)**, paste that Azure key into **Speech API key** and enter its region again. Both Azure sections can use one Speech resource; OpenRouter is separate. The Azure selections call Microsoft’s regional Speech endpoints directly; no speech URL entry is needed. For a Knowlez activation email, click **Use OpenRouter + Knowlez** instead. Paste the api-tts subscription key into **Lesson voice API key** and the api-stt subscription key into **Speech API key**; subscriptions may have different keys. This preset fills both endpoints automatically and clears old speech-provider keys when saved. No Azure region is required for Knowlez. Compatible providers remain available. **Save & test** checks a real provider request, which may incur a small provider charge.
4. For Supabase, open its dashboard from the page and create or select a project. Paste the project URL, public/publishable key, session-pooler PostgreSQL URI with database password, and secret/service-role key into the corresponding fields. Secret keys stay server-side; only the public key reaches the learner sign-in client.
5. Click **Initialize learning database** to install tables, RLS policies, and the four module seeds. The app detects an existing installation and preserves published history and learner records. No SQL copying is required.
6. Create test student, volunteer, and administrator accounts using the page. Accounts are immediately enabled for workshop use and role assignment is performed on the server.
7. Select **Connected accounts · Supabase**, save, and open the learning page to sign in. Changes take effect immediately without rebuilding or restarting.

Blank secret fields preserve saved credentials; **Remove saved credential** clears one on save. Sign out of developer settings with **Lock settings**. The first developer account can only be created through the local launcher, which binds to `127.0.0.1`; demo role switching does not authorize developer access. Hosted use requires HTTPS and an already initialized developer account. `npm run start:hosted` listens on all interfaces and disables first-time bootstrap. Supabase database connections use certificate-verified TLS and are restricted to the selected project’s direct or session-pooler endpoint.

Settings persist encrypted with AES-256-GCM in `.data/developer.enc`; the separate `.data/developer.key` has restricted filesystem permissions and is required to decrypt them. The developer password is salted and hashed; settings use an expiring HTTP-only session. Both files are ignored by Git. Back up the complete `.data` folder privately, and use one persistent server instance. Ephemeral/serverless hosting needs a persistent secret store before it can support saved settings. Encryption protects stored file contents; the running server must still be trusted to use the keys. Existing environment variables remain an optional deployment fallback, with browser-saved settings taking precedence.

The SQL preparation scripts remain available for advanced deployments, but the normal setup workflow uses the website. A new Supabase project and provider keys must still be obtained from their respective providers; the app does not create provider subscriptions or invent credentials.


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

To update your Windows Git checkout, stop its dev server and run `git pull origin main`. Double-click `Start-Workshop.cmd` to install dependencies and open setup, or run `npm ci` and `npm run dev`. Preserve `.data` and any existing `.env.local`. Existing demo version 1 progress is preserved and the new curriculum appears as version 2. Your local Windows filesystem cannot be modified from this cloud workspace.
