"use client";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Mic,
  Square,
  Send,
  Lightbulb,
  RefreshCw,
  Check,
} from "lucide-react";
import { recordingToWav } from "@/lib/audio-recording";
import { Exercise, Lesson } from "@/lib/schema";
import { ListenButton } from "./dashboard";
import { useApp } from "./app-provider";
export const typeLabels: Record<Exercise["type"], string> = {
  flashcard: "Meet the words",
  multiple_choice: "Journey challenge",
  match: "Make a match",
  listen_choose: "Listen & choose",
  sentence_order: "Build a sentence",
  fill_blank: "Fill the gap",
  speak: "Speaking practice",
  conversation_choice: "A little dialogue",
  scenario: "Try a real situation",
  ai_roleplay: "Meet your workshop buddy",
};
export function ExerciseRenderer({
  exercise: e,
  lesson,
  onAnswer,
  disabled = false,
  preview = false,
}: {
  exercise: Exercise;
  lesson: Lesson;
  onAnswer: (answer: string, ready: boolean) => void;
  disabled?: boolean;
  preview?: boolean;
}) {
  const [selected, setSelected] = useState(""),
    [tokens, setTokens] = useState<number[]>([]),
    [pairLeft, setPairLeft] = useState(""),
    [pairs, setPairs] = useState<{ left: string; right: string }[]>([]),
    [card, setCard] = useState(0),
    [flipped, setFlipped] = useState(false),
    [visited, setVisited] = useState(new Set([0])),
    [saved, setSaved] = useState(false);
  function pick(answer: string) {
    setSelected(answer);
    onAnswer(answer, !!answer);
  }
  const section = lesson.module?.sections.find((s) =>
    s.exerciseIds.includes(e.id),
  );
  const vocabulary = section
    ? lesson.vocabulary.filter((v) => section.vocabularyIds.includes(v.id))
    : lesson.vocabulary;
  const isChoice = [
    "multiple_choice",
    "listen_choose",
    "conversation_choice",
    "scenario",
  ].includes(e.type);
  return (
    <div className="exercise-panel panel">
      <div className="eyebrow">{typeLabels[e.type]}</div>
      <h2>{e.instruction}</h2>
      {e.type !== "flashcard" && e.type !== "ai_roleplay" && (
        <>
          <div
            className={`exercise-prompt ${["scenario", "conversation_choice", "sentence_order", "fill_blank"].includes(e.type) ? "scenario" : ""}`}
          >
            {e.type === "listen_choose" ? "聽一聽 · Listen closely" : e.prompt}
          </div>
          {e.type !== "listen_choose" && e.jyutping && (
            <span className="jyutping">{e.jyutping}</span>
          )}
          {e.english && e.type === "speak" && (
            <p className="help-text">{e.english}</p>
          )}
        </>
      )}
      {["listen_choose", "speak"].includes(e.type) && (
        <ListenButton lesson={lesson} text={e.prompt} />
      )}
      {isChoice && (
        <div className="exercise-options">
          {e.options.map((o, i) => (
            <button
              disabled={disabled}
              className={`option ${selected === o ? "selected" : ""}`}
              key={o}
              onClick={() => pick(o)}
            >
              <span>{i + 1}</span>
              {o}
            </button>
          ))}
        </div>
      )}
      {e.type === "flashcard" && (
        <>
          <button className="flashcard" onClick={() => setFlipped(!flipped)}>
            <div className="chinese">{vocabulary[card].traditional}</div>
            <div className="jyutping">{vocabulary[card].jyutping}</div>
            <p>
              {flipped ? vocabulary[card].english : "Tap to reveal the meaning"}
            </p>
            {flipped && (
              <p>
                {vocabulary[card].example} · {vocabulary[card].exampleEnglish}
              </p>
            )}
          </button>
          <div className="speech-controls">
            <ListenButton lesson={lesson} text={vocabulary[card].traditional} />
            <button
              className="btn secondary"
              onClick={() => {
                const ids = JSON.parse(
                  localStorage.getItem("saved-words") || "[]",
                );
                const id = vocabulary[card].traditional;
                localStorage.setItem(
                  "saved-words",
                  JSON.stringify([...new Set([...ids, id])]),
                );
                setSaved(true);
              }}
            >
              <Bookmark size={14} />
              {saved ? "Saved to wordbook" : "Save word"}
            </button>
          </div>
          <div className="flash-nav">
            <button
              aria-label="Previous word"
              className="icon-btn"
              disabled={card === 0}
              onClick={() => {
                setCard(card - 1);
                setFlipped(false);
                setSaved(false);
              }}
            >
              <ChevronLeft />
            </button>
            <span className="help-text">
              {card + 1} / {vocabulary.length}
            </span>
            <button
              aria-label="Next word"
              className="icon-btn"
              disabled={card === vocabulary.length - 1}
              onClick={() => {
                const next = card + 1;
                setCard(next);
                setFlipped(false);
                setSaved(false);
                const v = new Set([...visited, next]);
                setVisited(v);
                onAnswer("reviewed", v.size === vocabulary.length);
              }}
            >
              <ChevronRight />
            </button>
          </div>
          {vocabulary.length === 1 && (
            <button
              className="btn secondary"
              onClick={() => onAnswer("reviewed", true)}
            >
              I’ve reviewed this word
            </button>
          )}
          <p className="help-text">
            {visited.size === vocabulary.length
              ? "All words explored. Ready to continue!"
              : "Explore each word before continuing."}
          </p>
        </>
      )}
      {e.type === "sentence_order" && (
        <>
          <div className="sentence-tray" aria-label="Your sentence">
            {!tokens.length && (
              <span className="help-text">Tap the words below</span>
            )}
            {tokens.map((i, n) => (
              <button
                disabled={disabled}
                className="token"
                key={i}
                onClick={() => {
                  const next = tokens.filter((_, k) => k !== n);
                  setTokens(next);
                  onAnswer(
                    next.map((j) => e.tokens![j]).join(""),
                    next.length === e.tokens!.length,
                  );
                }}
              >
                {e.tokens![i]}
              </button>
            ))}
          </div>
          <div className="tokens">
            {e.tokens
              ?.map((_, i) => e.tokens!.length - 1 - i)
              .map((i) => (
                <button
                  className="token"
                  disabled={disabled || tokens.includes(i)}
                  key={i}
                  onClick={() => {
                    const next = [...tokens, i];
                    setTokens(next);
                    onAnswer(
                      next.map((j) => e.tokens![j]).join(""),
                      next.length === e.tokens!.length,
                    );
                  }}
                >
                  {e.tokens![i]}
                </button>
              ))}
          </div>
        </>
      )}
      {e.type === "fill_blank" && (
        <>
          <label className="field">
            Your answer
            <input
              disabled={disabled}
              value={selected}
              onChange={(ev) => pick(ev.target.value)}
              placeholder="Type the missing word"
            />
          </label>
          <div className="tokens">
            {e.options.map((o) => (
              <button
                className="token"
                disabled={disabled}
                key={o}
                onClick={() => pick(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
      {e.type === "match" && (
        <>
          <div className="match-grid">
            <div className="match-column">
              {e.pairs?.map((p) => (
                <button
                  disabled={disabled || pairs.some((x) => x.left === p.left)}
                  className={`option ${pairLeft === p.left ? "selected" : ""} ${pairs.some((x) => x.left === p.left) ? "matched" : ""}`}
                  key={p.left}
                  onClick={() => setPairLeft(p.left)}
                >
                  {p.left}
                </button>
              ))}
            </div>
            <div className="match-column">
              {[...(e.pairs || [])].reverse().map((p) => (
                <button
                  disabled={
                    disabled ||
                    !pairLeft ||
                    pairs.some((x) => x.right === p.right)
                  }
                  className={`option ${pairs.some((x) => x.right === p.right) ? "matched" : ""}`}
                  key={p.right}
                  onClick={() => {
                    const next = [...pairs, { left: pairLeft, right: p.right }];
                    setPairs(next);
                    setPairLeft("");
                    onAnswer(
                      JSON.stringify(
                        e
                          .pairs!.map((x) =>
                            next.find((n) => n.left === x.left),
                          )
                          .filter(Boolean),
                      ),
                      next.length === e.pairs!.length,
                    );
                  }}
                >
                  {p.right}
                </button>
              ))}
            </div>
          </div>
          <button
            className="text-link icon-btn"
            disabled={disabled}
            onClick={() => {
              setPairs([]);
              setPairLeft("");
              onAnswer("", false);
            }}
          >
            <RefreshCw size={13} />
            Reset pairs
          </button>
        </>
      )}
      {e.type === "speak" && (
        <Speaking
          lesson={lesson}
          exercise={e}
          onReady={() => onAnswer("practised", true)}
          preview={preview}
        />
      )}
      {e.type === "ai_roleplay" && (
        <Roleplay
          lesson={lesson}
          onReady={() => onAnswer("conversation practised", true)}
          preview={preview}
        />
      )}
    </div>
  );
}
function Speaking({
  lesson,
  exercise,
  onReady,
  preview,
}: {
  lesson: Lesson;
  exercise: Exercise;
  onReady: () => void;
  preview: boolean;
}) {
  const { request } = useApp();
  const [recording, setRecording] = useState(false),
    [url, setUrl] = useState(""),
    [blob, setBlob] = useState<Blob | null>(null),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    blobUrl = useRef("");
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      recorder.current?.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      URL.revokeObjectURL(blobUrl.current);
    },
    [],
  );
  async function start() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setNote(
          "This browser cannot record here. Practise aloud and use “I practised aloud”.",
        );
        return;
      }
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const r = new MediaRecorder(s);
      recorder.current = r;
      const parts: BlobPart[] = [];
      r.ondataavailable = (ev) => {
        if (ev.data.size) parts.push(ev.data);
      };
      r.onstop = () => {
        s.getTracks().forEach((t) => t.stop());
        const audio = new Blob(parts, { type: r.mimeType });
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = URL.createObjectURL(audio);
        setUrl(blobUrl.current);
        setBlob(audio);
        setRecording(false);
        setNote(
          "Recording stays on this device unless you choose “Check recognized words”.",
        );
        onReady();
      };
      r.start();
      setRecording(true);
      setNote("Recording… stops automatically after 30 seconds.");
      timer.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 30000);
    } catch {
      setNote(
        "Microphone permission was not granted. You can still practise aloud.",
      );
    }
  }
  async function transcribe() {
    if (!blob) return;
    setBusy(true);
    try {
      const wav = await recordingToWav(blob);
      const form = new FormData();
      form.set("audio", new File([wav], "practice.wav", { type: "audio/wav" }));
      form.set("lessonId", lesson.id);
      form.set("version", String(lesson.version));
      form.set("exerciseId", exercise.id);
      const result = await request("/api/transcribe", form);
      setNote(
        result.available
          ? `Recognized: ${result.recognized}\n${result.message}\n${result.note}`
          : result.message,
      );
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="speaking">
      <button
        className={`record-button ${recording ? "recording" : ""}`}
        aria-label={recording ? "Stop recording" : "Start recording"}
        onClick={() => {
          if (recording) {
            if (timer.current) clearTimeout(timer.current);
            recorder.current?.stop();
          } else start();
        }}
      >
        {recording ? <Square size={26} /> : <Mic size={29} />}
      </button>
      <p className="record-note" role="status">
        {note || "Listen first. Record yourself or practise aloud."}
      </p>
      {url && <audio controls src={url} />}
      <div className="speech-controls">
        {blob && !preview && (
          <button
            disabled={busy}
            className="btn secondary"
            onClick={transcribe}
          >
            {busy ? "Checking…" : "Check recognized words"}
          </button>
        )}
        <button
          className="btn secondary"
          onClick={() => {
            onReady();
            setNote(
              "Practice noted. This self-check gives no pronunciation score.",
            );
          }}
        >
          <Check size={14} />I practised aloud
        </button>
      </div>
      <p className="help-text" style={{ marginTop: 18 }}>
        Speaking practice checks effort and recognized words, not tone accuracy.
      </p>
    </div>
  );
}
function Roleplay({
  lesson,
  onReady,
  preview,
}: {
  lesson: Lesson;
  onReady: () => void;
  preview: boolean;
}) {
  const { request } = useApp();
  const [turns, setTurns] = useState<
      {
        role: "user" | "assistant";
        content: string;
        jyutping?: string;
        english?: string;
      }[]
    >([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [jp, setJp] = useState(true),
    [translate, setTranslate] = useState(false),
    [hint, setHint] = useState(""),
    [showHint, setShowHint] = useState(false),
    [mode, setMode] = useState(""),
    [done, setDone] = useState(false);
  async function send(text: string) {
    if (busy || done) return;
    setBusy(true);
    setError("");
    const messages = [
      ...turns.map((t) => ({ role: t.role, content: t.content })),
      ...(text ? [{ role: "user" as const, content: text }] : []),
    ];
    try {
      if (preview) {
        setTurns([
          ...turns,
          { role: "user", content: text },
          {
            role: "assistant",
            content: lesson.vocabulary[0].traditional,
            jyutping: lesson.vocabulary[0].jyutping,
            english: lesson.vocabulary[0].english,
          },
        ]);
        setMode("Student preview");
        return;
      }
      const result = await request("/api/roleplay", {
        lessonId: lesson.id,
        version: lesson.version,
        messages,
      });
      setTurns([
        ...turns,
        ...(text ? [{ role: "user" as const, content: text }] : []),
        {
          role: "assistant",
          content: result.traditional,
          jyutping: result.jyutping,
          english: result.english,
        },
      ]);
      setHint(result.hint);
      setMode(result.mode);
      setDone(result.done);
      if (result.done) onReady();
      setInput("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat-panel">
      <p className="chat-intro">
        {lesson.roleplay.scenario}
        <br />
        Use workshop phrases and pretend names. Keep personal details private.
      </p>
      <div className="chat-tools">
        <button onClick={() => setJp(!jp)}>
          {jp ? "Hide" : "Show"} Jyutping
        </button>
        <button onClick={() => setTranslate(!translate)}>
          {translate ? "Hide translation" : "Translate"}
        </button>
        <button onClick={() => setShowHint(!showHint)}>
          <Lightbulb size={11} /> Hint
        </button>
      </div>
      {showHint && (
        <div className="hint-box">
          {hint || `Try 「${lesson.vocabulary[0].traditional}」.`}
        </div>
      )}
      <div aria-live="polite">
        {turns.map((t, i) => (
          <div
            key={i}
            className={`chat-bubble ${t.role === "user" ? "mine" : ""}`}
          >
            <strong>{t.content}</strong>
            {jp && t.jyutping && <small>{t.jyutping}</small>}
            {translate && t.english && <small>{t.english}</small>}
          </div>
        ))}
      </div>
      {!turns.length && (
        <button
          className="btn secondary"
          disabled={busy}
          onClick={() => send("")}
        >
          {busy ? "Meeting your buddy…" : "Meet my workshop buddy"}
        </button>
      )}
      <div className="chat-replies">
        {!done &&
          lesson.roleplay.allowedVocabulary.slice(0, 4).map((w) => (
            <button key={w} disabled={busy} onClick={() => send(w)}>
              {w}
            </button>
          ))}
      </div>
      {!done && (
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) send(input.trim());
          }}
        >
          <label className="visually-hidden" htmlFor="roleplay-input">
            Your Cantonese reply
          </label>
          <input
            id="roleplay-input"
            maxLength={300}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try a workshop phrase…"
          />
          <button
            className="icon-btn"
            type="button"
            aria-label="Speak your reply"
            onClick={() => {
              const w = window as unknown as {
                SpeechRecognition?: new () => any;
                webkitSpeechRecognition?: new () => any;
              };
              const C = w.SpeechRecognition || w.webkitSpeechRecognition;
              if (!C) {
                setError(
                  "Voice input is unavailable on this browser. Use a suggested reply or type instead.",
                );
                return;
              }
              const r = new C();
              r.lang = "zh-HK";
              r.onresult = (event: any) =>
                setInput(event.results[0][0].transcript);
              r.onerror = () =>
                setError("Voice input could not start. Try typing instead.");
              r.start();
            }}
          >
            <Mic size={18} />
          </button>
          <button
            className="btn"
            disabled={busy || !input.trim()}
            aria-label="Send reply"
          >
            <Send size={16} />
          </button>
        </form>
      )}
      {mode && (
        <p className="help-text" style={{ marginTop: 14 }}>
          {mode}
        </p>
      )}
      {done && (
        <div className="success-note">
          <strong>好叻！Three replies practised.</strong>
          <p>
            You stayed with your workshop words. Review them in your wordbook.
          </p>
        </div>
      )}
      {error && (
        <div className="error-note" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
