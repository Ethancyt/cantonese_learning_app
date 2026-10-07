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
  MapPin,
} from "lucide-react";
import { useApp, DataBoundary } from "./app-provider";
import { Harbour, JourneyArt } from "./illustrations";
import type { Lesson } from "@/lib/schema";
import { useState, useEffect, useRef } from "react";
export function Dashboard() {
  const { data } = useApp();
  const [filter, setFilter] = useState("All journeys");
  if (!data)
    return (
      <DataBoundary>
        <div />
      </DataBoundary>
    );
  const done = (id: string) => data.completions.some((c) => c.lessonId === id);
  const current = data.lessons.find((l) => !done(l.id)) || data.lessons[0];
  const percent = current
    ? Math.round(
        (new Set(
          data.attempts
            .filter(
              (a) => a.lessonId === current.id && a.version === current.version,
            )
            .map((a) => a.exerciseId),
        ).size /
          current.exercises.length) *
          100,
      )
    : 0;
  const filtered = data.lessons.filter(
    (l) =>
      filter === "All journeys" ||
      (filter === "From my workshop" && l.createdBy !== "system") ||
      (filter === "Completed" && done(l.id)),
  );
  return (
    <DataBoundary>
      <div className="page-heading">
        <div>
          <div className="eyebrow">LET’S MAKE A LITTLE PROGRESS</div>
          <h1>
            你好，little explorer <span className="wave">👋</span>
          </h1>
          <p>
            A little Cantonese. A little confidence. A little closer to Hong
            Kong.
          </p>
        </div>
        <span className="date-tag">
          <MapPin size={14} />
          Hong Kong · 香港
        </span>
      </div>
      <section className="hero panel">
        <div className="hero-copy">
          <span className="pill light">
            YOUR NEXT ADVENTURE <span>今日練習</span>
          </span>
          <h2>
            Big adventures start
            <br />
            with a little <em>你好.</em>
          </h2>
          <p>
            You’ve learned it at your workshop.
            <br />
            Now let’s make it your own, one small step at a time.
          </p>
          <Link
            className="btn"
            href={current ? `/journey/${current.id}` : "/review"}
          >
            {percent ? "Continue my journey" : "Let’s get started"}
            <ArrowRight size={18} />
          </Link>
          <div className="hero-meta">
            <Clock size={14} />
            {current?.estimated_minutes || 5} minute practice<span>·</span>No
            rush. Just you.
          </div>
        </div>
        <div className="hero-art">
          <Harbour />
          <div className="harbour-label">
            下一站：香港日常 <span>Next stop: everyday Hong Kong</span>
          </div>
        </div>
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
              <small> journeys</small>
            </strong>
            <span>Adventures completed</span>
          </div>
        </div>
      </section>
      <section className="journeys-section">
        <div className="section-heading">
          <div>
            <h2>
              Your Hong Kong journeys <span>探索香港</span>
            </h2>
            <p>Practise what you’ve learned. Discover a little more.</p>
          </div>
          <span className="small-label">
            {data.lessons.length} journeys to explore
          </span>
        </div>
        <div className="filter-row" role="group" aria-label="Filter journeys">
          {["All journeys", "From my workshop", "Completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? "selected" : ""}
            >
              {f}
              {f === "All journeys" && <span>{data.lessons.length}</span>}
            </button>
          ))}
        </div>
        <div className="journey-grid">
          {filtered.map((l, i) => {
            const count = new Set(
              data.attempts
                .filter((a) => a.lessonId === l.id && a.version === l.version)
                .map((a) => a.exerciseId),
            ).size;
            const progress = Math.round((count / l.exercises.length) * 100);
            return (
              <Link
                className={`journey-card tone-${i % 4}`}
                href={`/journey/${l.id}`}
                key={l.id}
              >
                <div className="card-art">
                  <span className="card-unit">
                    {l.createdBy === "system"
                      ? `MODULE ${l.module?.unit || data.lessons.indexOf(l) + 1}`
                      : "YOUR WORKSHOP"}
                  </span>
                  {done(l.id) && (
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
                    {l.title_zh}
                    <ArrowUpRight size={20} />
                  </h3>
                  <p className="card-english">{l.title}</p>
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
                      {done(l.id)
                        ? "Journey complete"
                        : progress
                          ? `${progress}% explored`
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
            <h3>
              A little word for today <span>每日一詞</span>
            </h3>
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
        title={clip ? "Play saved lesson audio" : "Play device Cantonese voice"}
        onClick={async () => {
          if (clip && source) {
            setBusy(true);
            setNote("");
            try {
              if (!saved.current) {
                abort.current = new AbortController();
                const session = auth
                  ? (await auth.auth.getSession()).data.session
                  : null;
                const query = new URLSearchParams({
                  lessonId: source.id,
                  version: String(source.version),
                  clipId: clip.id,
                });
                const response = await fetch(`/api/audio?${query}`, {
                  headers: session
                    ? { Authorization: `Bearer ${session.access_token}` }
                    : {},
                  signal: abort.current.signal,
                });
                if (!response.ok)
                  throw new Error(
                    "Saved audio could not load. Please try again.",
                  );
                const url = URL.createObjectURL(await response.blob());
                saved.current = { audio: new Audio(url), url };
              }
              activeAudio?.pause();
              window.speechSynthesis?.cancel();
              activeAudio = saved.current.audio;
              activeAudio.currentTime = 0;
              activeAudio.onerror = () =>
                setNote("Saved audio could not play. Please try again.");
              await activeAudio.play();
            } catch (e) {
              if ((e as Error).name !== "AbortError")
                setNote(
                  (e as Error).name === "NotAllowedError"
                    ? "Audio is ready. Tap Listen again to play."
                    : "Saved audio could not play. Please try again.",
                );
            } finally {
              setBusy(false);
            }
            return;
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
