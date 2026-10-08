"use client";
import { useState, useEffect } from "react";
import { ArrowRight, Bookmark, Check } from "lucide-react";
import { useApp, DataBoundary } from "./app-provider";
import { ListenButton } from "./dashboard";
import { ExerciseRenderer } from "./exercise-renderer";
import { Vocabulary, Lesson, Exercise } from "@/lib/schema";
export function Wordbook() {
  const { data, request, refresh } = useApp();
  const [filter, setFilter] = useState("All words"),
    [saved, setSaved] = useState<string[]>([]),
    [review, setReview] = useState<
      { lesson: Lesson; exercise: Exercise }[] | null
    >(null),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [ready, setReady] = useState(false),
    [feedback, setFeedback] = useState<{
      correct: boolean;
      explanation: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setSaved(JSON.parse(localStorage.getItem("saved-words") || "[]"));
  }, []);
  if (!data)
    return (
      <DataBoundary>
        <div />
      </DataBoundary>
    );
  const vocabulary = [
    ...new Map(
      data.lessons.flatMap((l) => l.vocabulary).map((v) => [v.traditional, v]),
    ).values(),
  ];
  const words = vocabulary.filter(
    (v) =>
      filter === "All words" ||
      (filter === "Saved" && saved.includes(v.traditional)) ||
      (filter === "Needs practice" &&
        data.mastery.some((m) => m.word === v.traditional && m.score < 80)),
  );
  function start() {
    const weak = data!.mastery.map((m) => m.word);
    const candidates = data!.lessons.flatMap((lesson) =>
      lesson.exercises
        .filter((e) => !["flashcard", "speak", "ai_roleplay"].includes(e.type))
        .map((exercise) => ({ lesson, exercise })),
    );
    candidates.sort(
      (a, b) =>
        Math.min(
          ...a.exercise.tags.map((t) => {
            const n = weak.indexOf(t);
            return n < 0 ? 999 : n;
          }),
        ) -
        Math.min(
          ...b.exercise.tags.map((t) => {
            const n = weak.indexOf(t);
            return n < 0 ? 999 : n;
          }),
        ),
    );
    setReview(candidates.slice(0, 5));
    setIndex(0);
    setFeedback(null);
    setReady(false);
  }
  if (review) {
    if (index >= review.length)
      return (
        <div className="completion panel">
          <div className="trophy">🌱</div>
          <h1>A little stronger today.</h1>
          <p>
            Five activities revisited. Your wordbook reflects your latest
            answers.
          </p>
          <button className="btn" onClick={() => setReview(null)}>
            Back to my words
          </button>
        </div>
      );
    const { lesson, exercise } = review[index];
    return (
      <div className="exercise-container">
        <button className="back-link icon-btn" onClick={() => setReview(null)}>
          ← Back to wordbook
        </button>
        <div className="exercise-top">
          <div className="progress-bar">
            <div style={{ width: `${(index / review.length) * 100}%` }} />
          </div>
          <span>
            {index + 1}/{review.length} review
          </span>
        </div>
        <ExerciseRenderer
          key={`${exercise.id}-${index}`}
          lesson={lesson}
          exercise={exercise}
          disabled={!!feedback || busy}
          onAnswer={(a, r) => {
            setAnswer(a);
            setReady(r);
          }}
        />
        {feedback && (
          <div
            className={`feedback ${feedback.correct ? "" : "wrong"}`}
            role="status"
          >
            <h3>
              {feedback.correct ? "A little win!" : "A word to revisit 🌱"}
            </h3>
            <p>{feedback.explanation}</p>
          </div>
        )}
        {error && <div className="error-note">{error}</div>}
        <div className="exercise-actions">
          <span className="help-text">
            Approved workshop material, picked for you.
          </span>
          <button
            className="btn"
            disabled={busy || (!feedback && !ready)}
            onClick={async () => {
              if (feedback) {
                setIndex(index + 1);
                setFeedback(null);
                setReady(false);
                setAnswer("");
                return;
              }
              setBusy(true);
              try {
                setFeedback(
                  await request("/api/data", {
                    action: "attempt",
                    lessonId: lesson.id,
                    version: lesson.version,
                    exerciseId: exercise.id,
                    answer,
                    attemptId: crypto.randomUUID(),
                  }),
                );
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Checking…" : feedback ? "Continue" : "Check answer"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE PRACTICE GOES A LONG WAY</div>
          <h1>Review today</h1>
          <p>Your workshop words, growing with you.</p>
        </div>
      </div>
      <div className="review-banner panel">
        <div>
          <h2>
            {data.mastery.filter((m) => m.score < 80).length} words could use a
            little love.
          </h2>
          <p>
            Review focuses on mistakes, mastery, and time since your last
            practice.
          </p>
        </div>
        <button className="btn" onClick={start} disabled={!data.lessons.length}>
          Start a 5-question review
          <ArrowRight size={17} />
        </button>
      </div>
      <div className="filter-row">
        {["All words", "Needs practice", "Saved"].map((f) => (
          <button
            className={filter === f ? "selected" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="wordbook-grid">
        {words.map((v) => {
          const m = data.mastery.find((m) => m.word === v.traditional);
          return (
            <div className="wordbook-card panel" key={v.traditional}>
              <div className="word-heading">
                <h3>{v.traditional}</h3>
                <ListenButton text={v.traditional} />
              </div>
              <span className="jyutping">{v.jyutping}</span>
              <p>{v.english}</p>
              <div className="mastery-label">
                <span>{m ? "Word mastery" : "Not practised yet"}</span>
                <strong>{m ? `${m.score}%` : "—"}</strong>
              </div>
              <div className="card-progress">
                <div style={{ width: `${m?.score || 0}%` }} />
              </div>
              <button
                className="text-link icon-btn"
                onClick={() => {
                  const next = saved.includes(v.traditional)
                    ? saved.filter((w) => w !== v.traditional)
                    : [...saved, v.traditional];
                  setSaved(next);
                  localStorage.setItem("saved-words", JSON.stringify(next));
                }}
              >
                {saved.includes(v.traditional) ? (
                  <Check size={13} />
                ) : (
                  <Bookmark size={13} />
                )}{" "}
                {saved.includes(v.traditional)
                  ? "Saved on this device"
                  : "Save word"}
              </button>
            </div>
          );
        })}
      </div>
      {!words.length && (
        <div className="empty panel">
          <h3>
            {filter === "Saved"
              ? "Keep a little word for later"
              : "Your words are looking good"}
          </h3>
          <p>
            {filter === "Saved"
              ? "Save a vocabulary card to find it here."
              : "As you practise, words that need review will appear here."}
          </p>
        </div>
      )}
    </>
  );
}
