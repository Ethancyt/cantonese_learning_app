# Sample workshop uploads

Start with `quick-speech-test.txt` for a small upload and fewer audio-generation requests. Use `classroom-introductions.txt`, `.docx`, or `.pdf` for the full 15-minute lesson: greetings, names, student/teacher identities, and language study. These are original classroom materials using Traditional Chinese, Jyutping, and English. The screenshots use Yale romanization; the app uses Jyutping.

## Test through the website

1. In Developer setup, save and test OpenRouter and Azure Speech. Enter your Azure Speech resource key and matching region in both TTS and STT sections. Select a listed Hong Kong Cantonese voice such as `zh-HK-HiuMaanNeural` and listen to the preview. STT is optional; learners can record and replay without it.
2. Open Volunteer Studio. In demo mode choose **Enter demo volunteer mode** if prompted. In Supabase mode use a volunteer or admin account.
3. Choose **Create practice journey**, upload the quick TXT file, and click **Find the learning content**. Check that greetings and student/teacher vocabulary were extracted. With an AI key, the mode should say **AI-assisted**; without one, the structured TXT lines support source-based demo extraction.
4. Select beginner level, 5 minutes for the quick source (15 for the full source), and include flashcards, matching, listening, sentence order, and speaking. Click **Create practice draft**. Check vocabulary, answers, and module sections against the source.
5. Click **Generate lesson audio** and play the saved clips. Successful generation shows saved-phrase progress. Generate again without edits: unchanged clips should be reused. Provider generation can incur charges.
6. Review, **Approve this draft**, then **Publish to students**. Open **View student journey** and check listening playback and an activity answer.
7. In a speaking activity, allow microphone access, record the expected phrase, stop, and replay. Click **Check recognized words** to send the recording to the configured STT service. Expect transcript-based feedback, not a pronunciation or tone score.
8. If a provider fails, copy the exact website error and the operation that failed. Share no keys. “Connected” establishes a response, not correct Cantonese pronunciation.

The included answer key is lecturer guidance. Human review remains required before publishing. Use the fictional characters rather than requesting personal information from learners.
