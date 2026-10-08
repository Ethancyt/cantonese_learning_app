"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  Star,
  Trophy,
  Clock,
  Headphones,
  Volume2,
  ChevronRight,
  Check,
  BookOpen,
} from "lucide-react";
import { useApp, DataBoundary } from "./app-provider";
import { JourneyArt } from "./illustrations";
import type { Lesson } from "@/lib/schema";
import { lessonCompleted } from "@/lib/lesson-completion";
import { lessonActivityProgress, lessonToContinue } from "@/lib/lesson-resume";
import { useState, useEffect, useRef } from "react";
export function Dashboard() {
  const { data } = useApp();
  const [filter, setFilter] = useState("All lessons");
  if (!data)
    return (
      <DataBoundary>
        <div />
      </DataBoundary>
    );
  const done = (lesson: Lesson) => lessonCompleted(lesson, data.completions);
  const current = lessonToContinue(
    data.lessons,
    data.attempts,
    data.completions,
  );
  const currentProgress = current
    ? lessonActivityProgress(current, data.attempts)
    : null;
  const nextExercise =
    current && currentProgress && currentProgress.nextIndex >= 0
      ? current.exercises[currentProgress.nextIndex]
      : null;
  const nextSection = current?.module?.sections.find(
    (section) => nextExercise && section.exerciseIds.includes(nextExercise.id),
  );
  const filtered = data.lessons.filter(
    (l) =>
      filter === "All lessons" ||
      (filter === "From my workshop" && l.createdBy !== "system") ||
      (filter === "Completed" && done(l)),
  );
  return (
    <DataBoundary>
      <div className="page-heading">
        <div>
          <h1>My lessons</h1>
          <p>Continue your practice or choose a lesson below.</p>
        </div>
      </div>
      <section className="continue-lesson panel" aria-label="Continue lesson">
        <div className="continue-icon" aria-hidden="true">
          <BookOpen size={28} />
        </div>
        <div className="continue-copy">
          <div className="eyebrow">
            {current
              ? currentProgress?.explored
                ? "CONTINUE YOUR LESSON"
                : "YOUR NEXT LESSON"
              : data.lessons.length
                ? "ALL LESSONS COMPLETED"
                : "READY TO LEARN"}
          </div>
          <h2>
            {current?.title ||
              (data.lessons.length
                ? "Keep practising your vocabulary"
                : "Your lessons will appear here")}
          </h2>
          <p>
            {current
              ? nextSection
                ? `Up next: ${nextSection.title}`
                : nextExercise
                  ? `Up next: ${nextExercise.instruction}`
                  : "All activities practised. Finish the lesson to save your completion."
              : data.lessons.length
                ? "Review your words or revisit a completed lesson below."
                : "A volunteer can publish learning materials for you to practise."}
          </p>
          {current && currentProgress && (
            <div className="continue-progress">
              <div
                className="card-progress"
                role="progressbar"
                aria-label="Lesson progress"
                aria-valuenow={currentProgress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div style={{ width: `${currentProgress.percent}%` }} />
              </div>
              <span>
                {currentProgress.explored} of {currentProgress.total} activities
                practised · {currentProgress.percent}%
              </span>
            </div>
          )}
          {current && (
            <div className="continue-meta">
              <Clock size={14} />
              {current.estimated_minutes} minute lesson
            </div>
          )}
        </div>
        {(current || data.lessons.length > 0) && (
          <Link
            className="btn"
            href={current ? `/journey/${current.id}?resume=1` : "/review"}
          >
            {current
              ? currentProgress?.explored
                ? currentProgress.percent === 100
                  ? "Finish lesson"
                  : "Continue lesson"
                : "Start lesson"
              : "Review my words"}
            <ArrowRight size={18} />
          </Link>
        )}
      </section>
      <section className="stats-row">
        <div className="stat">
          <div className="stat-icon peach">
            <Flame size={24} />
          </div>
          <div>
            <strong>
              {data.stats.streak}
              <small> day{data.stats.streak === 1 ? "" : "s"}</small>
            </strong>
            <span>Practice streak</span>
          </div>
          <span className="stat-caption">Keep the spark going</span>
        </div>
        <div className="stat">
          <div className="stat-icon yellow">
            <Star size={24} />
          </div>
          <div>
            <strong>
              {data.stats.xp}
              <small> XP</small>
            </strong>
            <span>Little wins, added up</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon mint">
            <Trophy size={24} />
          </div>
          <div>
            <strong>
              {data.stats.completed}
              <small> lessons</small>
            </strong>
            <span>Lessons completed</span>
          </div>
        </div>
      </section>
      <section className="journeys-section">
        <div className="section-heading">
          <div>
            <h2>Your after-class lessons</h2>
            <p>
              Follow Lessons 1–4 alongside your Cantonese class, then review
              what you’ve learned.
            </p>
          </div>
          <span className="small-label">
            {data.lessons.length} lessons to practise
          </span>
        </div>
        <div className="filter-row" role="group" aria-label="Filter journeys">
          {["All lessons", "From my workshop", "Completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? "selected" : ""}
            >
              {f}
              {f === "All lessons" && <span>{data.lessons.length}</span>}
            </button>
          ))}
        </div>
        <div className="journey-grid">
          {filtered.map((l, i) => {
            const progress = lessonActivityProgress(l, data.attempts).percent;
            return (
              <Link
                className={`journey-card tone-${i % 4}`}
                href={`/journey/${l.id}`}
                key={l.id}
              >
                <div className="card-art">
                  <span className="card-unit">
                    {l.createdBy === "system"
                      ? `LESSON ${l.module?.unit || data.lessons.indexOf(l) + 1}`
                      : "YOUR WORKSHOP"}
                  </span>
                  {done(l) && (
                    <span className="done-badge">
                      <Check size={12} />
                      Completed
                    </span>
                  )}
                  <JourneyArt kind={l.id} />
                </div>
                <div className="card-content">
                  <div className="card-topic">{l.topic}</div>
                  <h3>
                    {l.title}
                    <ArrowUpRight size={20} />
                  </h3>
                  <p className="card-english" lang="zh-HK">
                    {l.title_zh}
                  </p>
                  <p className="card-description">{l.description}</p>
                  <div className="card-details">
                    <Clock size={13} />
                    {l.estimated_minutes} min<span>·</span>
                    {l.module ? `${l.module.sections.length} sections · ` : ""}
                    {l.exercises.length} activities
                  </div>
                  <div className="card-progress">
                    <div style={{ width: `${progress}%` }} />
                  </div>
                  <div className="card-bottom">
                    <span>
                      {done(l)
                        ? "Lesson complete"
                        : progress
                          ? `${progress}% practised`
                          : "Ready when you are"}
                    </span>
                    <span>
                      {progress ? "Continue" : "Explore"}
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {!filtered.length && (
          <div className="empty panel">
            <h3>
              {filter === "Completed"
                ? "Your first little win is waiting"
                : "A new workshop adventure is coming"}
            </h3>
            <p>
              {filter === "Completed"
                ? "Complete a journey and it will appear here."
                : "Publish a reviewed journey from the Volunteer Studio."}
            </p>
          </div>
        )}
      </section>
      <section className="bottom-grid">
        <div className="word-card panel">
          <div className="section-heading">
            <h3>A word to practise</h3>
            <span className="word-tag">MANNERS</span>
          </div>
          <div className="word-detail">
            <span className="word-symbol">唔該</span>
            <div>
              <span className="jyutping">m4 goi1</span>
              <p>Thank you · Please</p>
            </div>
            <ListenButton text="唔該" />
          </div>
          <p>Little words go a long way. Try it when someone helps you.</p>
          <Link href="/review" className="text-link">
            Open my wordbook <ArrowRight size={15} />
          </Link>
        </div>
        <div className="workshop-note panel">
          <div className="note-icon">
            <Headphones size={24} />
          </div>
          <div>
            <span className="eyebrow">LEARN TOGETHER. PRACTISE ANYWHERE.</span>
            <h3>Your workshop, a little further.</h3>
            <p>
              Volunteers teach. You explore.
              <br />
              Every journey carries a little piece of Hong Kong.
            </p>
            <Link href="/studio" className="text-link">
              Visit the Volunteer Studio <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </DataBoundary>
  );
}
let activeAudio: HTMLAudioElement | null = null;
export function ListenButton({
  text,
  lesson,
}: {
  text: string;
  lesson?: Lesson;
}) {
  const { data, auth } = useApp();
  const source =
    lesson ||
    data?.lessons.find((l) => l.audio?.some((c) => c.text === text.trim()));
  const clip = source?.audio?.find((c) => c.text === text.trim());
  const [note, setNote] = useState(""),
    [busy, setBusy] = useState(false);
  const saved = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    setNote("");
    return () => {
      abort.current?.abort();
      if (saved.current) {
        saved.current.audio.pause();
        URL.revokeObjectURL(saved.current.url);
        saved.current = null;
      }
    };
  }, [source?.id, source?.version, clip?.id, text]);
  return (
    <div className="listen-wrap">
      <button
        className="listen-btn"
        aria-label={`Listen to ${text}`}
        disabled={busy}
        title={clip ? "Play saved lesson audio" : "Play Cantonese voice"}
        onClick={async () => {
          if (source) {
            setBusy(true);
            setNote("");
            try {
              if (!saved.current) {
                abort.current = new AbortController();
                const session = auth
                  ? (await auth.auth.getSession()).data.session
                  : null;
                const query = clip
                  ? new URLSearchParams({
                      lessonId: source.id,
                      version: String(source.version),
                      clipId: clip.id,
                    })
                  : null;
                const response = await fetch(
                  query ? `/api/audio?${query}` : "/api/audio",
                  {
                    method: clip ? "GET" : "POST",
                    headers: session
                      ? {
                          Authorization: `Bearer ${session.access_token}`,
                          ...(!clip
                            ? { "Content-Type": "application/json" }
                            : {}),
                        }
                      : !clip
                        ? { "Content-Type": "application/json" }
                        : {},
                    body: clip
                      ? undefined
                      : JSON.stringify({
                          lessonId: source.id,
                          version: source.version,
                          text,
                        }),
                    signal: abort.current.signal,
                  },
                );
                if (!response.ok) {
                  const error = await response.json().catch(() => ({}));
                  throw new Error(
                    error.error ||
                      "Lesson audio could not load. Please try again.",
                  );
                }
                if (
                  !response.headers
                    .get("Content-Type")
                    ?.includes("application/json")
                ) {
                  const url = URL.createObjectURL(await response.blob());
                  saved.current = { audio: new Audio(url), url };
                }
              }
              if (saved.current) {
                activeAudio?.pause();
                window.speechSynthesis?.cancel();
                activeAudio = saved.current.audio;
                activeAudio.currentTime = 0;
                activeAudio.onerror = () =>
                  setNote("Saved audio could not play. Please try again.");
                await activeAudio.play();
                return;
              }
            } catch (e) {
              if ((e as Error).name !== "AbortError")
                setNote(
                  (e as Error).name === "NotAllowedError"
                    ? "Audio is ready. Tap Listen again to play."
                    : (e as Error).message ||
                        "Lesson audio could not play. Please try again.",
                );
              return;
            } finally {
              setBusy(false);
            }
          }
          activeAudio?.pause();
          if (!("speechSynthesis" in window)) {
            setNote("Audio is unavailable on this browser.");
            return;
          }
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find((v) => /yue|zh-HK/i.test(v.lang));
          if (!voice) {
            setNote(
              "No Cantonese voice installed. Add a Hong Kong Cantonese voice in your device settings.",
            );
            return;
          }
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = voice.lang;
          utterance.voice = voice;
          utterance.rate = 0.8;
          utterance.onerror = () =>
            setNote("Audio could not play. Please try again.");
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
          setNote("");
        }}
      >
        <Volume2 size={20} />
      </button>
      {note && (
        <p className="audio-note" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
