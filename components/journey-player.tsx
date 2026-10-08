"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Flag,
  Clock,
  BookOpen,
  Trophy,
} from "lucide-react";
import { useApp, DataBoundary } from "./app-provider";
import { ExerciseRenderer, typeLabels } from "./exercise-renderer";
import { ModuleTeaching } from "./module-section";
import { lessonActivityProgress } from "@/lib/lesson-resume";
export function CulturalCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="culture-card panel">
      <div className="eyebrow">A LITTLE HONG KONG CULTURE · 香港文化</div>
      <h3>🏮 {title}</h3>
      <p>{body}</p>
    </div>
  );
}
export function JourneyPlayer({
  id,
  resume = false,
}: {
  id: string;
  resume?: boolean;
}) {
  const { data, request, refresh } = useApp();
  const [index, setIndex] = useState<number | null>(null),
    [answer, setAnswer] = useState(""),
    [ready, setReady] = useState(false),
    [feedback, setFeedback] = useState<{
      correct: boolean;
      explanation: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [complete, setComplete] = useState(false),
    [reported, setReported] = useState(false);
  const [showTeaching, setShowTeaching] = useState(false);
  const lesson = data?.lessons.find((l) => l.id === id);
  const resumed = useRef("");
  useEffect(() => {
    if (!resume || !lesson || !data) return;
    const key = `${lesson.id}:${lesson.version}`;
    if (resumed.current === key) return;
    resumed.current = key;
    const progress = lessonActivityProgress(lesson, data.attempts);
    const next =
      progress.nextIndex >= 0
        ? progress.nextIndex
        : lesson.exercises.length - 1;
    if (next < 0) return;
    const section = lesson.module?.sections.find((s) =>
      s.exerciseIds.includes(lesson.exercises[next].id),
    );
    setIndex(next);
    setAnswer("");
    setReady(false);
    setFeedback(null);
    setError("");
    setComplete(false);
    setReported(false);
    setShowTeaching(
      !!section && section.exerciseIds[0] === lesson.exercises[next].id,
    );
    if (progress.nextIndex < 0) {
      setShowTeaching(false);
      setFeedback({
        correct: true,
        explanation:
          "All activities practised. Finish the lesson to save your completion.",
      });
    }
  }, [resume, lesson, data]);
  if (!data)
    return (
      <DataBoundary>
        <div />
      </DataBoundary>
    );
  if (!lesson)
    return (
      <div className="empty panel">
        <h2>Journey not available</h2>
        <Link className="btn" href="/">
          Back to my journeys
        </Link>
      </div>
    );
  const attempted = new Set(
    data.attempts
      .filter((a) => a.lessonId === lesson.id && a.version === lesson.version)
      .map((a) => a.exerciseId),
  );
  const first = lesson.exercises.findIndex((e) => !attempted.has(e.id));
  function start(n: number, teach = true) {
    setShowTeaching(teach && !!lesson?.module);
    setIndex(n);
    setAnswer("");
    setReady(false);
    setFeedback(null);
    setError("");
  }
  async function check() {
    if (index === null || !lesson) return;
    setBusy(true);
    try {
      const e = lesson.exercises[index];
      const result = await request("/api/data", {
        action: "attempt",
        lessonId: lesson.id,
        version: lesson.version,
        exerciseId: e.id,
        answer,
        attemptId: crypto.randomUUID(),
      });
      setFeedback({
        correct:
          ["flashcard", "speak", "ai_roleplay"].includes(e.type) ||
          result.correct,
        explanation: ["flashcard", "speak", "ai_roleplay"].includes(e.type)
          ? "Practice noted. Keep going at your own pace."
          : result.explanation,
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    if (!lesson || index === null) return;
    if (index < lesson.exercises.length - 1) {
      const currentSection = lesson.module?.sections.find((s) =>
        s.exerciseIds.includes(lesson.exercises[index].id),
      );
      start(
        index + 1,
        !currentSection?.exerciseIds.includes(lesson.exercises[index + 1].id),
      );
      return;
    }
    setBusy(true);
    try {
      await request("/api/data", {
        action: "complete",
        lessonId: lesson.id,
        version: lesson.version,
      });
      await refresh();
      setComplete(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (complete)
    return (
      <div className="completion panel">
        <div className="trophy">🏆</div>
        <span className="eyebrow">ONE LITTLE ADVENTURE, COMPLETE</span>
        <h1>好叻！You did it.</h1>
        <p>You brought a little more Cantonese into your day.</p>
        <div className="completion-score">
          <div>
            <strong>+20</strong>
            <span>journey XP · once per version</span>
          </div>
          <div>
            <strong>{data.stats.xp}</strong>
            <span>total XP</span>
          </div>
        </div>
        <p>
          {lesson.title_zh} · {lesson.title}
        </p>
        <Link className="btn" href="/">
          More adventures
          <ArrowRight size={17} />
        </Link>
        <Link className="btn secondary" href="/review">
          Review my words
        </Link>
      </div>
    );
  if (index !== null) {
    const e = lesson.exercises[index];
    const section = lesson.module?.sections.find((s) =>
      s.exerciseIds.includes(e.id),
    );
    if (section && showTeaching)
      return (
        <div className="exercise-container">
          <div className="panel module-intro">
            <button className="back-link" onClick={() => setIndex(null)}>
              <ArrowLeft size={14} />
              Back to lesson
            </button>
            <ModuleTeaching section={section} lesson={lesson} />
            <button className="btn" onClick={() => setShowTeaching(false)}>
              Continue to practice <ArrowRight size={17} />
            </button>
          </div>
        </div>
      );
    return (
      <div className="exercise-container">
        <div className="exercise-top">
          <button
            className="icon-btn"
            aria-label="Back to journey map"
            onClick={() => setIndex(null)}
          >
            <ArrowLeft size={21} />
          </button>
          <div className="progress-bar">
            <div
              style={{ width: `${(index / lesson.exercises.length) * 100}%` }}
            />
          </div>
          <span>
            {index + 1} / {lesson.exercises.length}
          </span>
        </div>
        {section && (
          <div className="section-reminder">
            <span className="eyebrow">{section.title}</span>
            <button className="text-link" onClick={() => setShowTeaching(true)}>
              Review conversation <BookOpen size={14} />
            </button>
          </div>
        )}
        <ExerciseRenderer
          key={`${e.id}-${index}`}
          exercise={e}
          lesson={lesson}
          onAnswer={(a, r) => {
            setAnswer(a);
            setReady(r);
          }}
          disabled={!!feedback || busy}
        />
        {feedback && (
          <div
            className={`feedback ${feedback.correct ? "" : "wrong"}`}
            role="status"
          >
            <h3>
              {feedback.correct
                ? "Nice little step! 做得好 ✨"
                : "Almost there. Try it once more 🌱"}
            </h3>
            <p>{feedback.explanation}</p>
          </div>
        )}
        {error && (
          <div className="error-note" role="alert">
            {error}
          </div>
        )}
        <div className="exercise-actions">
          <p>
            One small step at a time.
            <br />
            No rush. You’ve got this.
          </p>
          {feedback ? (
            <div className="speech-controls">
              {!feedback.correct && (
                <button
                  className="btn secondary"
                  onClick={() => {
                    setFeedback(null);
                    setReady(false);
                    start(index, false);
                  }}
                >
                  Try again
                </button>
              )}
              <button className="btn" disabled={busy} onClick={next}>
                {busy
                  ? "Saving…"
                  : index === lesson.exercises.length - 1
                    ? "Finish journey"
                    : "Continue"}
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <button className="btn" onClick={check} disabled={!ready || busy}>
              {busy
                ? "Checking…"
                : ["flashcard", "speak", "ai_roleplay"].includes(e.type)
                  ? "Continue"
                  : "Check answer"}
              <Check size={17} />
            </button>
          )}
        </div>
        <button
          className="report-button"
          disabled={reported}
          onClick={async () => {
            try {
              await request("/api/data", {
                action: "report",
                lessonId: lesson.id,
                version: lesson.version,
                reason: `Please review activity ${e.id}.`,
              });
              setReported(true);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <Flag size={10} />{" "}
          {reported
            ? "Report sent for volunteer review"
            : "Report this activity"}
        </button>
      </div>
    );
  }
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={14} />
        Back to my journeys
      </Link>
      <section className="journey-banner panel">
        <div className="big-icon">{lesson.icon}</div>
        <div>
          <span className="pill">{lesson.workshop}</span>
          <h1 style={{ marginTop: 14 }}>{lesson.title_zh}</h1>
          <p>
            {lesson.title} · {lesson.description}
          </p>
          {lesson.module && (
            <p className="module-situation">
              <strong>Your situation:</strong> {lesson.module.situation}
            </p>
          )}
          <div className="card-details" style={{ marginBottom: 18 }}>
            <Clock size={13} />
            {lesson.estimated_minutes} min<span>·</span>Version {lesson.version}
            <span>·</span>
            {attempted.size}/{lesson.exercises.length} activities explored
          </div>
          <button className="btn" onClick={() => start(first < 0 ? 0 : first)}>
            {attempted.size ? "Continue practice" : "Begin my journey"}
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
      <div className="journey-layout">
        <section className="path-panel panel">
          <h2 style={{ fontSize: 19, marginBottom: 16 }}>Your lesson path</h2>
          {lesson.module
            ? lesson.module.sections.map((section, n) => {
                const count = section.exerciseIds.filter((id) =>
                  attempted.has(id),
                ).length;
                return (
                  <div className="module-path-section" key={section.id}>
                    <button
                      className="path-row"
                      onClick={() =>
                        start(
                          lesson.exercises.findIndex(
                            (e) => e.id === section.exerciseIds[0],
                          ),
                        )
                      }
                    >
                      <span className="path-dot">
                        {count === section.exerciseIds.length ? (
                          <Check size={19} />
                        ) : (
                          n + 1
                        )}
                      </span>
                      <div>
                        <h3>
                          {section.title_zh} · {section.title}
                        </h3>
                        <p>{section.description}</p>
                        <span className="help-text">
                          Learn → follow a conversation → practise · {count}/
                          {section.exerciseIds.length} activities
                        </span>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                );
              })
            : lesson.exercises.map((e, n) => (
                <button
                  key={e.id}
                  className={`path-row ${attempted.has(e.id) ? "complete" : n === first ? "current" : ""}`}
                  onClick={() => start(n)}
                >
                  <span className="path-dot">
                    {attempted.has(e.id) ? (
                      <Check size={19} />
                    ) : n === lesson.exercises.length - 1 ? (
                      <Trophy size={19} />
                    ) : (
                      n + 1
                    )}
                  </span>
                  <div>
                    <h3>{typeLabels[e.type]}</h3>
                    <p>
                      {n === lesson.exercises.length - 1
                        ? "A little challenge to bring it together"
                        : e.instruction}
                    </p>
                  </div>
                  <span className="path-status">
                    {attempted.has(e.id) ? (
                      "Explored"
                    ) : n === first ? (
                      "Your next step"
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                </button>
              ))}
        </section>
        <aside>
          <div className="info-panel panel">
            <h3>What you’ll practise</h3>
            <ul className="objectives">
              {lesson.learningObjectives.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="help-text">
              After-class practice · Traditional Chinese + Jyutping + English.
            </p>
          </div>
          {lesson.module?.reference && (
            <div className="info-panel panel module-reference">
              <a
                href={lesson.module.reference.url}
                target="_blank"
                rel="noreferrer"
              >
                {lesson.module.reference.title} ↗
              </a>
              <p className="help-text">
                Practice adapted to this unit’s topics. Open the original class
                material to compare notes; this app uses modern Jyutping.
              </p>
            </div>
          )}
          {lesson.culturalNotes.map((c) => (
            <CulturalCard key={c.title} {...c} />
          ))}
          <div className="info-panel panel" style={{ marginTop: 18 }}>
            <h3>
              <BookOpen size={17} /> Your workshop words
            </h3>
            {lesson.vocabulary.map((v) => (
              <p className="help-text" style={{ margin: "8px 0" }} key={v.id}>
                <strong>{v.traditional}</strong> · {v.jyutping}
                <br />
                {v.english}
              </p>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
