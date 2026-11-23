# Cantonese Learning

A functional FYP prototype for **workshop → practice → reviewed digital content**. Volunteers teach in person; learners use short Cantonese journeys afterward. The centrepiece is **upload → source review → generate → edit → approve → publish**.

## Run immediately

Requires Node.js 22.3 or newer (built and tested with Node.js 24). On Windows, double-click **Start-Workshop.cmd** to install dependencies, start the local website, and open Developer setup. You can also use the commands below.

```sh
npm ci
npm run dev
```

Startup checks installed packages against the lockfile and automatically installs missing or updated dependencies. This also handles new packages after `git pull`; you do not need to edit code or install individual packages.

The development server defaults to **demo mode** without any accounts or API keys. Workshop 1 is available to learners immediately. For a production build of an isolated presentation demo:

```sh
npm run build
npm start
```

Open **http://localhost:3000** in your local browser. Visit **http://localhost:3000/developer** for browser-based API keys and Supabase setup. No `.env` editing is needed. Routes: `/` student dashboard, `/journey/[id]` practice, `/review` wordbook and personalized review, `/studio` Volunteer Content Studio.

Demo content, drafts, immutable published versions, attempts, completions, reports, source text, and generation records persist in `.data/demo.json`. This file is ignored by Git. Demo learners have an anonymous HTTP-only cookie identity. Saved vocabulary bookmarks are kept on the current browser/device. Back up `.data` to retain a presentation; delete it only when intentionally resetting a disposable demo. The local atomic file store is for **one running server process** with persistent disk, not multi-instance or serverless production.

## Workshop walkthrough

1. Open **Workshop 1 · Greetings and introductions**. Choose any section or resume your next activity.
2. Try a listening question, an MTR name match, and a sentence-building activity. Open the workshop reference links to consult the slides or notes.
3. In **Introduce yourself**, rehearse with a name and places of your choice. Personal practice entries stay in the browser. The app saves a practice marker and offers pronunciation checks for the fixed course phrases.
4. To add another workshop, switch to Volunteer Studio and choose **Create practice journey**. Upload the material or paste the instructor’s notes. Review the source and generated draft, then edit, approve, and publish it.
5. In the draft editor, open **Review module teaching and context** to add reference links that learners can access. Published versions stay available until an approved revision replaces them or a volunteer administrator archives them.

## Architecture

- **Next.js App Router + TypeScript** with reusable semantic, keyboard-accessible components and responsive CSS. Original SVG harbour and journey illustrations; no proprietary assets.
- `lib/schema.ts`: strict Zod lesson, vocabulary, exercise and provenance contracts. All ten exercise types share `components/exercise-renderer.tsx`. No new React page is needed for a generated journey.
- `lib/content/workshop-one.ts` holds the taught Workshop 1 lesson. Lessons and Studio drafts share the same JSON contracts and activity renderer. Existing EduHK records remain available for resolving older saved words and historical versions.
- `lib/server/extraction.ts`: TXT/Markdown, text PDFs, DOCX and PPTX extraction. File types, magic bytes, archive expansion, text size and uploaded size are checked. PDF keeps page numbers and PPTX keeps slide numbers; other formats retain the nearest source chunk. Scanned PDFs/OCR are outside the MVP.
- `lib/ai/provider.ts`: replaceable `AIProvider` interface plus an OpenAI-compatible JSON text adapter. No vendor calls in UI code.
- `lib/ai/lesson-generator.ts`: source extraction, reviewed learning content, relevant style retrieval, generation, strict validation and provenance checks. Published references guide structure only.
- `lib/ai/roleplay.ts`: short scenario-bound replies, lesson vocabulary, hints, Jyutping, translation and three-turn practice. No general-purpose chat.
- `lib/ai/feedback.ts`: compare recognized words with the expected phrase. `lib/server/speech.ts`: request Azure scripted Cantonese pronunciation assessment and validate its provider scores.
- `lib/server/repository.ts`: local demo/Supabase persistence adapter. `lib/server/security.ts`: role checks, authenticated Supabase users, same-origin mutations, input limits and per-user endpoint throttles.
- `lib/progress.ts`: mistake, mastery and elapsed-time review priority. +10 XP once per correctly answered exercise/version and +20 once per completed journey/version. Flashcards, self-reported speaking and roleplay earn completion credit, but no “correct answer” XP. Streak dates use Hong Kong time.

## Real AI and speech (optional)

For upload-ready classroom materials in TXT, Word, and PDF formats, see [sample-materials](sample-materials/README.md). Start with the short speech-test file, then try the full lesson on greetings and introductions.

Use **Developer setup** at `/developer` to enter keys, endpoints, and model names. New setups default to **OpenRouter** for lesson AI and **Azure Speech** for Cantonese TTS and STT. Existing saved provider choices are preserved; use **Use OpenRouter + Azure defaults** on that page to switch. The button clears credentials for changed providers when saved, while preserving Supabase settings. No file editing is needed. The environment variables below remain an optional fallback for advanced hosting; never commit credentials.

Azure Speech is the default for both speech services. Retired subscription settings migrate to Azure with their old speech keys cleared; existing Azure credentials, AI settings, Supabase settings, and previously saved audio are preserved. Enter your Azure Speech resource key and matching region in both speech sections. Choose `zh-HK-HiuMaanNeural`, `zh-HK-HiuGaaiNeural`, or `zh-HK-WanLungNeural` and play the lesson voice preview before generating clips.

When changing providers or voices, save the settings and regenerate the draft’s audio to replace old clip references. For a published lesson, create a revision, regenerate, review, and publish the revision. Published snapshots retain their previous clips. Speaking reference audio uses the exercise’s expected answer; **Check pronunciation** displays that expected phrase and the returned transcript for comparison. With Azure selected, the same request also returns pronunciation accuracy, fluency, completeness, overall score, and word-level feedback. Compatible providers return transcript matching only.

- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`: enable source analysis, lesson generation and constrained roleplay through an OpenAI-compatible endpoint. A configured provider failure is shown as an error; it does not silently produce a fake AI result.
- `SPEECH_API_KEY`, `SPEECH_PROVIDER`, `SPEECH_REGION`: configure Azure Cantonese (`zh-HK`) recognition; choose `compatible` with `SPEECH_API_URL` and `SPEECH_MODEL` for multipart transcription. Audio is sent only when the learner explicitly chooses **Check pronunciation**; it is not stored by this app.
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

AI generation requests a compact response: the server reuses reviewed vocabulary and learning objectives, assigns authorship/version metadata, and verifies short source quotes on activities. It does not ask the model to repeat whole source chunks or the reviewed vocabulary. Structured OpenRouter requests disable optional reasoning to reserve the output budget for JSON. Repeated matching pairs are deduplicated; ambiguous matches are rebuilt from reviewed vocabulary, and sentence-order tokens retain the intended answer exactly. Schema errors or truncated output share at most one recovery request within the same time limit; this can add one provider request. A truncation retry asks for a concise analysis (up to 12 key words) or one activity per selected type. Complete JSON still passes strict schema and source checks; incomplete output is never saved. All generated lessons remain unapproved drafts until human review.

## Generate and reuse lesson audio

In **Developer setup**, choose **Azure Speech · Hong Kong Cantonese**, enter your Speech resource key and its region, and choose a Hong Kong voice (HiuMaan, HiuGaai, or WanLung). Alternatively configure an OpenAI-compatible `/audio/speech` endpoint, model, voice and key. Cantonese quality depends on that model: listen for unwanted Mandarin readings. OpenRouter chat generation remains separate from voice generation and learner transcription. **Save & test lesson voice** makes one short provider request; it does not assess linguistic quality.

For connected accounts, run **Initialize learning database** once more to add the private `lesson-audio` Storage bucket and permissions. The button preserves existing content and history. Existing projects can also apply migration `003_lesson_audio.sql` through their deployment tooling.

The workflow for every new material is:

1. Upload or paste material, generate a draft, and review Cantonese/Jyutping and lesson structure.
2. In the draft editor, choose **Generate lesson audio**. The app saves the draft, generates unique Cantonese words, example sentences, dialogue lines and listening/speaking prompts in resumable batches, and shows progress. Provider quotas/charges apply.
3. Listen to the saved clips in Studio; correct the wording and regenerate if needed. Matching unchanged clips are reused. Changing the voice/model and generating again creates new clips.
4. Approve and publish. Learners' Listen buttons reuse stored MP3s without calling the voice provider. Newly uploaded material follows the same workflow.

Local MP3s live in `.data/audio/`; Supabase mode stores MP3s in a private Storage bucket and clip text, voice/model, creation time and IDs inside versioned lesson JSON. Published snapshots retain their original clips. Saving edited text removes mismatched draft references; browser-submitted audio references cannot replace server-generated metadata. Students can access only clips referenced by available published lessons; owned drafts are limited to staff. Files are never overwritten. Keep `.data` backed up in local mode and retain referenced Storage objects in connected mode.

Word cards also support **Record → Check pronunciation** for the current word, using the same Azure STT settings as speaking activities. Chinese answer choices, matching words, gap-fill options, and sentence tokens have separate Listen buttons. These controls apply to existing courses immediately, without regenerating or republishing them. If a phrase has no saved lesson MP3, Listen uses the configured lesson voice and caches the example in `.data/listening-audio/` on the running server, including in Supabase mode. The first playback of a new phrase can make a billable TTS request; later requests reuse the cache for that voice. This cache needs persistent server disk. With lesson voice unconfigured, Listen uses an installed device Cantonese voice. Learner recordings remain on the device until **Check pronunciation** is chosen and are never saved in the example-audio cache.

This generates the **example voice learners hear**. Microphone transcription uses **Speech-to-text (STT)**, with Azure Cantonese recognition selected by default. Browser recordings are converted locally into mono 16 kHz PCM WAV before an explicit assessment request; the original recording stays on the device. Recording stops after 25 seconds, within Azure’s 30-second single-assessment limit. For Azure, `/api/transcribe` sends one request with `language=zh-HK`, `format=detailed`, and a Base64 `Pronunciation-Assessment` header containing the authorized published exercise’s answer as `ReferenceText`, `HundredMark`, `Word`, `Comprehensive`, and miscue detection. Scores come only from Azure’s response; missing, malformed, or silent results never produce invented scores. Feedback includes overall, accuracy, fluency, completeness, and per-word errors (mispronunciation, omission, insertion). There is no separate Cantonese tone score; en-US-only prosody and other add-ons are not requested. Generation requires your provider credentials; no live voice provider or Supabase project is configured by this repository alone.

Pronunciation assessment uses the same **STT key and region** already entered in Developer setup; it needs no extra API key or OpenRouter model. The app makes one provider call when the learner clicks **Check pronunciation**, and stores neither learner audio nor assessment results. Speaking completion remains based on practice, so an estimated score does not lock learners out of a lesson. Free (F0) resources remain subject to Azure’s allowances and fixed request limits; the app does not select or change your billing tier. A quota failure is shown without retrying or charging a second recognition request. **Save & test speech** checks STT authentication with silence, while an actual speaking exercise tests assessment with real speech.

Microsoft documents [Cantonese pronunciation assessment support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment), the [REST assessment contract](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short#pronunciation-assessment-parameters), and [pricing](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool#pricing). Basic scripted accuracy, fluency, completeness, and miscue results are included in baseline speech-to-text pricing; check your Azure resource’s current free allowance and usage.

If a speech provider rejects a request, the website displays its HTTP status without exposing its response body or your key. For Azure, **401** indicates authentication failure: copy a Speech resource key and use that resource’s exact region. **403** indicates access restrictions; check resource permissions, subscription status and networking. **400** indicates a request/voice format issue; update the app and choose a listed Hong Kong voice. **429** can mean quota, rate limits or temporary voice capacity; retry later and check usage limits. **5xx** indicates a provider service error. These messages identify the failure category; they do not verify your Azure account configuration.

## Browser-based developer setup

1. Start with `npm run dev` (or `npm run build` then `npm start`) and open `/developer`.
2. Create a developer password of at least 12 characters. This account is separate from student/volunteer roles.
3. Under **AI lesson generation**, paste your OpenRouter key (default URL `https://openrouter.ai/api/v1`, model `openai/gpt-4.1-mini`). Under **Text-to-speech (TTS)**, paste your Azure Speech key into **Lesson voice API key**, select a Cantonese voice, and enter the resource region. Under **Speech-to-text (STT)**, paste that Azure key into **Speech API key** and enter its region again. Both Azure sections can use one Speech resource; OpenRouter is separate. The Azure selections call Microsoft’s regional Speech endpoints directly; no speech URL entry is needed. Compatible providers remain available. **Save & test** checks a real provider request, which may incur a small provider charge.
4. For Supabase, open its dashboard from the page and create or select a project. Paste the project URL, public/publishable key, session-pooler PostgreSQL URI with database password, and secret/service-role key into the corresponding fields. Secret keys stay server-side; only the public key reaches the learner sign-in client.
5. Click **Initialize learning database** to install tables, RLS policies, and the Workshop 1 seed. The app detects an existing installation and preserves published history and learner records. No SQL copying is required.
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

Browser checks use Playwright Chromium (`npx playwright install chromium`) or a browser at `CHROMIUM_PATH`. Screenshots are written to `artifacts/` or `BROWSER_ARTIFACT_DIR`. The general HTTP tests are skipped without `TEST_BASE_URL`. The Azure assessment HTTP test uses `TEST_AZURE_BASE_URL` pointing to a separate, fresh-data server. Start that server with `TEST_AZURE_SPEECH_MOCK=true`, `NODE_OPTIONS="--import ./tests/helpers/azure-speech-mock.mjs"`, and temporary `DEMO_DATA_DIR`/`DEVELOPER_DATA_DIR` paths; then run tests with both base URL variables set. The explicit test preload mocks Azure only for its test key; application code never loads it. The PostgreSQL permission test uses PGlite to apply the actual migration with minimal Auth/Storage shims; it checks publishing gates, role escalation, privacy, server-derived correctness and mastery. This is not a substitute for testing a configured live Supabase project.

## Deployment boundaries

The complete local demonstration is operational. Live Supabase, AI, and Azure Speech endpoints require your credentials and separate live validation. Demo role switching is intentionally permissive: **do not expose `APP_MODE=demo` as a real multi-user children's platform**. Real deployments require Supabase mode, TLS, staff provisioning, consent/retention policies and provider review appropriate to your actual users. Current in-memory rate limiting assumes one process; use a shared limiter before scaling across instances. Retrieved source documents and generated educational content always need human review; output validation does not certify linguistic correctness.

## Workshop 1 rollout

The starter library now contains the Cantonese workshop held on **13 November 2026**. It follows the presentation and student notes, with Traditional Chinese, Yale and English. Amina, Daniel and Maya are fictional practice characters. The lesson links to browser-readable text editions of the presentation and student notes, including the notes’ exercises, answer key and vocabulary appendices. The original PDF artwork and maps can be linked from the draft editor when learner-accessible copies are available.

- **Existing Supabase installation.** Back up the database, then run **Developer setup → Initialize learning database** with the new release, or generate the content SQL with `npx tsx scripts/seed-supabase.ts > workshop-1-content.sql` and apply it once to the existing project through the Supabase SQL Editor as the database owner. This release uses the existing JSON schema and requires no new schema migration. If an installation predates the module or audio migrations, run the existing database initialization first.
- **Fresh Supabase installation.** Configure the project in Developer setup, initialize the database, then provision staff and learner accounts. No example character is provisioned.
- **Content and history.** Seeding uses the new lesson ID `workshop-2026-11-13` and can be safely repeated. It archives the former system content and publications based on the original café demo source. It retains published snapshots, source files, profiles, attempts, and completions. Existing demo files receive the same upgrade when loaded.
- **Hosting.** Build with `npm ci` and `npm run build`. Run `npm run start:hosted` on a Node.js host with HTTPS and the existing production environment/persistent configuration. Configure the existing Azure speech providers if the deployment uses them. After seeding, sign in with a test learner and check the dashboard, both references, a listening item, completion, and Studio access with a staff account.

Future workshops can be published entirely in the Volunteer Studio with reviewed activities and their own learner-accessible reference links.

## Cloudflare Workers

The checked-in Wrangler configuration targets the existing
`cantonese-learning-app` Worker. OpenNext's `WORKER_SELF_REFERENCE` service
points to that same Worker. Install the locked dependencies with `npm ci`
and generate the Worker with `npm run build:cloudflare`.

In Workers & Pages, set the build command to `npm run build:cloudflare`.
Use `npx wrangler preview` for branch builds and `npx wrangler deploy`
for production. Preview builds can be verified before merging a release to
`main`.

Before serving learner traffic, set the Worker runtime variables
`APP_MODE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Apply the Workshop 1 content seed
to the active Supabase project as described above. Use Worker secrets for any
server-only credentials. Use the environment-based configuration on Workers,
since its local filesystem cannot persist settings or learner data.

To enable Cantonese listening and pronunciation checks, set
`AZURE_SPEECH_KEY` as a Worker secret and `AZURE_SPEECH_REGION` to the
resource's region (for example, `eastasia`). The same Azure Speech resource
powers both controls, and listening defaults to the Cantonese HiuMaan voice.
For the Workshop 1 branch preview, run
`npx wrangler preview secret put AZURE_SPEECH_KEY --name replace-demo-with-nov-2026-workshop`
and enter the key at the prompt. If the resource is outside East Asia, use
the same command with `AZURE_SPEECH_REGION` and enter its region. The on-demand
audio uses the Workers Cache API where available, with direct synthesis when
the preview bypasses the cache.
