"use client";
import { reconcileSections } from "@/lib/content/structure";
import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Sparkles,
  Trash2,
  Check,
  Eye,
  RefreshCw,
  Save,
  Users,
  BookOpen,
  BarChart3,
  Clock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { lessonAudioTexts } from "@/lib/lesson-audio";
import { ListenButton } from "./dashboard";
import { useApp, DataBoundary } from "./app-provider";
import {
  Analysis,
  Lesson,
  Source,
  Exercise,
  exerciseTypes,
  isCorrect,
  lessonSchema,
} from "@/lib/schema";
import { demoMaterial } from "@/lib/seeds";
import { ExerciseRenderer, typeLabels } from "./exercise-renderer";
const steps = [
  "Upload",
  "Review material",
  "Choose practice",
  "Generate",
  "Edit & preview",
  "Publish",
];
export function Studio() {
  const { data, switchRole, request, refresh } = useApp();
  const [step, setStep] = useState<number | null>(null),
    [tab, setTab] = useState("My workshops"),
    [file, setFile] = useState<File | null>(null),
    [text, setText] = useState(""),
    [filename, setFilename] = useState("My workshop"),
    [source, setSource] = useState<Source | null>(null),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [lesson, setLesson] = useState<Lesson | null>(null),
    [mode, setMode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [selected, setSelected] = useState(0),
    [approval, setApproval] = useState(false),
    [published, setPublished] = useState(false),
    [settings, setSettings] = useState({
      types: [...exerciseTypes] as string[],
      level: "beginner",
      minutes: 10,
      age: "Children",
      references: true,
    }),
    [previewAnswer, setPreviewAnswer] = useState(""),
    [previewReady, setPreviewReady] = useState(false),
    [previewFeedback, setPreviewFeedback] = useState("");
  const current = lesson?.exercises[selected];
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setStep(0);
    setSource(null);
    setAnalysis(null);
    setLesson(null);
    setPublished(false);
    setApproval(false);
    setText("");
    setFile(null);
    setError("");
    setNote("");
    setMode("");
    setSelected(0);
  }
  function edit(patch: Partial<Lesson>) {
    setLesson((l) =>
      l ? reconcileSections({ ...l, ...patch, status: "under_review" }) : l,
    );
    setApproval(false);
  }
  function editExercise(patch: Partial<Exercise>) {
    if (!lesson) return;
    edit({
      exercises: lesson.exercises.map((e, i) =>
        i === selected ? { ...e, ...patch } : e,
      ),
    });
    setPreviewFeedback("");
  }
  async function upload(useDemo = false) {
    const form = new FormData();
    if (file && !useDemo) form.set("file", file);
    else {
      form.set("text", useDemo ? demoMaterial : text);
      form.set("filename", useDemo ? "Workshop Demo — 茶餐廳" : filename);
    }
    await run(async () => {
      const result = await request("/api/studio", form);
      setSource(result.source);
      setAnalysis(result.analysis);
      setMode(result.mode);
      setStep(1);
      await refresh();
    });
  }
  async function generate() {
    setStep(3);
    await run(async () => {
      const result = await request("/api/studio", {
        action: "generate",
        sourceId: source!.id,
        analysis,
        settings,
      });
      setLesson(result.lesson);
      setMode(result.mode);
      setSelected(0);
      setStep(4);
      await refresh();
    });
  }
  async function save(action = "save") {
    if (!lesson) return;
    lessonSchema.parse(lesson);
    const result = await request("/api/studio", { action, lesson });
    setLesson(result.lesson);
    setNote(
      action === "approve"
        ? "Review approved. This journey is ready to publish."
        : "Draft saved. Students cannot see it yet.",
    );
    await refresh();
    return result.lesson as Lesson;
  }
  async function generateAudio() {
    const saved = await save();
    if (!saved) return;
    let remaining = 1;
    try {
      while (remaining > 0) {
        const result = await request("/api/studio", {
          action: "audio",
          lessonId: saved.id,
        });
        setLesson(result.lesson);
        remaining = result.remaining;
        setNote(
          `Lesson audio: ${result.completed} of ${result.total} phrases saved. ${remaining ? "Generating…" : "Listen to the clips before approving."}`,
        );
      }
    } catch (e) {
      try {
        const current = await request("/api/data");
        const draft = current.drafts.find((l: Lesson) => l.id === saved.id);
        if (draft) setLesson(draft);
      } catch {
        /* Keep the last successfully returned batch. */
      }
      throw e;
    } finally {
      await refresh();
    }
  }
  async function open(l: Lesson) {
    await run(async () => {
      if (l.status === "published") {
        const result = await request("/api/studio", {
          action: "revise",
          lessonId: l.id,
        });
        l = result.lesson;
        await refresh();
      }
      setLesson(l);
      setSource(data!.sources.find((s) => s.id === l.sourceMaterialId) || null);
      setAnalysis({
        vocabulary: l.vocabulary,
        learningObjectives: l.learningObjectives,
        grammar: l.grammar,
        culturalNotes: l.culturalNotes,
        dialogue: [],
        expressions: [],
      });
      setStep(4);
      setSelected(0);
      setApproval(false);
      setPublished(false);
      setMode(
        l.origin === "ai" ? "AI-generated · review required" : "Workshop draft",
      );
    });
  }
  if (!data)
    return (
      <DataBoundary>
        <div />
      </DataBoundary>
    );
  if (data.role === "student")
    return (
      <div className="panel empty">
        <div style={{ fontSize: 45 }}>✏️</div>
        <h2>Volunteer Content Studio</h2>
        <p>Turn what you teach into little practice adventures.</p>
        {data.mode === "demo" ? (
          <button
            style={{ marginTop: 20 }}
            className="btn"
            onClick={() =>
              run(async () => {
                await switchRole("volunteer");
              })
            }
          >
            Enter demo volunteer mode
            <ArrowRight size={17} />
          </button>
        ) : (
          <p>Your administrator needs to grant volunteer access.</p>
        )}
        {error && <div className="error-note">{error}</div>}
      </div>
    );
  if (published && lesson)
    return (
      <div className="completion panel">
        <div className="trophy">🎉</div>
        <div className="eyebrow">
          FROM YOUR WORKSHOP TO THEIR NEXT ADVENTURE
        </div>
        <h1>
          {lesson.title_zh} is{" "}
          {lesson.availability === "scheduled" ? "scheduled" : "live"}.
        </h1>
        <p>
          Human-reviewed, published as version {lesson.version}.{" "}
          {lesson.availability === "available"
            ? "Your learners can start practising now."
            : `Available ${new Date(lesson.availableAt!).toLocaleString()}.`}
        </p>
        <div className="speech-controls">
          <Link className="btn" href={`/journey/${lesson.id}`}>
            View student journey
            <ExternalLink size={16} />
          </Link>
          <button
            className="btn secondary"
            onClick={() => {
              setStep(null);
              setPublished(false);
            }}
          >
            Back to Studio
          </button>
        </div>
      </div>
    );
  if (step === null) {
    const a = data.analytics;
    const displayed = data.drafts.filter((l) =>
      tab === "Published journeys"
        ? l.status === "published"
        : tab === "Generated drafts"
          ? l.status !== "published" && l.status !== "archived"
          : true,
    );
    return (
      <>
        <div className="page-heading studio-header">
          <div>
            <div className="eyebrow">
              YOU TEACH. WE KEEP THE PRACTICE GOING.
            </div>
            <h1>Your workshop, their next adventure.</h1>
            <p>
              Turn your teaching materials into practice. Review every little
              detail before sharing.
            </p>
          </div>
          <button className="btn" onClick={reset}>
            <Plus size={17} />
            Create practice journey
          </button>
        </div>
        <div className="demo-notice">
          <Sparkles size={16} />
          {data.mode === "demo"
            ? "Demo space · Content and progress persist on this server. Demo roles are for presentations only."
            : "Connected workspace · Your role and access are managed by your administrator."}
        </div>
        <section className="studio-stats">
          {[
            {
              icon: <Users size={17} />,
              value: a?.students || 0,
              label: "Students practised",
              note: "Real activity in this workspace",
            },
            {
              icon: <CheckCircle2 size={17} />,
              value: `${a?.completion || 0}%`,
              label: "Journey completion",
              note: "Completed / started journeys",
            },
            {
              icon: <RefreshCw size={17} />,
              value: a?.averageAttempts || 0,
              label: "Average attempts",
              note: "Per practised exercise",
            },
            {
              icon: <BookOpen size={17} />,
              value: data.drafts.filter((l) => l.status === "published").length,
              label: "Your published journeys",
              note: "Reviewed and shared",
            },
          ].map((s) => (
            <div className="studio-stat panel" key={s.label}>
              <span>
                {s.icon} {s.label}
              </span>
              <strong>{s.value}</strong>
              <small>{s.note}</small>
            </div>
          ))}
        </section>
        <div className="review-banner panel">
          <div>
            <span className="eyebrow">TRY THE FYP DEMONSTRATION</span>
            <h2>☕ From workshop slides to 去茶餐廳</h2>
            <p>
              Explore an original café workshop sample. Extract → generate →
              edit → approve → publish.
            </p>
          </div>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => {
              reset();
              setText(demoMaterial);
              setFilename("Workshop Demo — 茶餐廳");
            }}
          >
            Try sample workshop
            <ArrowRight size={17} />
          </button>
        </div>
        <div className="section-heading">
          <div>
            <h2>Your teaching corner</h2>
            <p>
              {data.sources.length} uploaded materials · {data.drafts.length}{" "}
              journeys
            </p>
          </div>
        </div>
        <div className="filter-row studio-tabs">
          {["My workshops", "Generated drafts", "Published journeys"].map(
            (t) => (
              <button
                key={t}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ),
          )}
        </div>
        <div className="draft-list">
          {displayed.map((l) => (
            <div className="draft-row panel" key={l.id}>
              <span className="draft-icon">{l.icon}</span>
              <div>
                <h3>{l.title_zh}</h3>
                <p>
                  {l.workshop} · {l.exercises.length} activities · Version{" "}
                  {l.version}
                </p>
              </div>
              <span className={`status ${l.status}`}>
                {l.status.replaceAll("_", " ")}
              </span>
              <button
                className="btn secondary"
                disabled={busy || l.status === "archived"}
                onClick={() => open(l)}
              >
                {l.status === "published" ? "Create revision" : "Open draft"}
                <ArrowRight size={15} />
              </button>
              {l.status === "published" &&
                (data.role === "admin" || data.mode === "demo") && (
                  <button
                    className="icon-btn"
                    aria-label={`Unpublish ${l.title_zh}`}
                    onClick={() =>
                      run(async () => {
                        await request("/api/studio", {
                          action: "archive",
                          lessonId: l.id,
                        });
                        await refresh();
                      })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                )}
            </div>
          ))}
        </div>
        {!displayed.length && (
          <div className="empty panel">
            <h3>A new adventure starts with your workshop.</h3>
            <p>
              Upload a material or try the café sample to create your first
              draft.
            </p>
          </div>
        )}
        {tab === "My workshops" && data.sources.length > 0 && (
          <div className="info-panel panel" style={{ marginTop: 20 }}>
            <h3>Uploaded materials</h3>
            {data.sources.map((s) => (
              <div className="draft-row" key={s.id}>
                <FileText size={17} />
                <div>
                  <h3 style={{ fontSize: 12 }}>{s.filename}</h3>
                  <p>
                    {s.chunks.length} source sections ·{" "}
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="btn secondary"
                  onClick={() =>
                    run(async () => {
                      const result = await request("/api/studio", {
                        action: "analyze",
                        sourceId: s.id,
                      });
                      setSource(result.source);
                      setAnalysis(result.analysis);
                      setMode(result.mode);
                      setStep(1);
                    })
                  }
                >
                  Use material
                </button>
              </div>
            ))}
          </div>
        )}
        {a?.difficult.length ? (
          <div className="info-panel panel" style={{ marginTop: 20 }}>
            <h3>Words learners find tricky</h3>
            {a.difficult.map((w) => (
              <p key={w.word} className="help-text">
                {w.word} · {w.score}% mastery · {w.attempts} attempts
              </p>
            ))}
          </div>
        ) : null}
        {error && (
          <div className="error-note" role="alert">
            {error}
          </div>
        )}
      </>
    );
  }
  return (
    <>
      <button
        className="back-link icon-btn"
        disabled={busy}
        onClick={() => {
          setStep(null);
          setError("");
        }}
      >
        <ArrowLeft size={14} />
        Back to Studio · unsaved edits stay here until you open another draft
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A NEW LITTLE ADVENTURE</div>
          <h1>
            Create a practice journey <span>✏️</span>
          </h1>
          <p>Your materials. Your teaching. A little help with the practice.</p>
        </div>
      </div>
      <div className="wizard-steps">
        {steps.map((s, i) => (
          <div className={`wizard-step ${step === i ? "active" : ""}`} key={s}>
            <b>{step > i ? <Check size={11} /> : i + 1}</b>
            {s}
          </div>
        ))}
      </div>
      <div className="wizard-panel panel">
        {step === 0 && (
          <>
            <h2>What did you teach?</h2>
            <p>
              Upload your own materials, or paste your workshop notes. Only use
              materials you have permission to share.
            </p>
            <div
              className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                  setText("");
                }
              }}
            >
              <Upload size={32} />
              <h3>{file ? file.name : "Drop your workshop material here"}</h3>
              <p>PDF, PPTX, DOCX, TXT, or Markdown · Up to 5 MB</p>
              <label
                className="btn secondary"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    document.getElementById("material-file")?.click();
                }}
              >
                Choose a file
                <input
                  id="material-file"
                  type="file"
                  accept=".pdf,.pptx,.docx,.txt,.md"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    setFile(selectedFile);
                    if (selectedFile) setText("");
                  }}
                />
              </label>
              {file && (
                <button
                  className="icon-btn"
                  aria-label="Remove selected file"
                  onClick={() => setFile(null)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="form-grid">
              <label className="field full-width">
                Workshop name
                <input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  maxLength={200}
                />
              </label>
              <label className="field full-width">
                Or paste your workshop notes
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (e.target.value.trim()) setFile(null);
                  }}
                  maxLength={60000}
                  rows={6}
                  placeholder={
                    "Goal: greet a workshop friend.\n你好 | nei5 hou2 | Hello\n早晨 | zou2 san4 | Good morning\n再見 | zoi3 gin3 | Goodbye"
                  }
                />
              </label>
            </div>
            <p className="help-text">
              Use one source at a time: choosing a file clears pasted notes, and
              typing notes clears the selected file. Without an AI connection,
              demo extraction uses “Chinese | Jyutping | English” lines. Scanned
              PDFs need text recognition before uploading.
            </p>
            <div className="studio-actions">
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => upload(true)}
              >
                Use café demo material
              </button>
              <button
                className="btn"
                disabled={busy || (!file && !text.trim())}
                onClick={() => upload()}
              >
                {busy ? "Reading your material…" : "Find the learning content"}
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {step === 1 && analysis && source && (
          <>
            <h2>Here’s what your workshop contains.</h2>
            <p>
              {source.filename} · Review, edit, or remove items before
              generating practice.
            </p>
            <span className="status ai_generated">{mode}</span>
            <div className="extracted-summary">
              <span>{analysis.vocabulary.length} workshop words</span>
              <span>{analysis.expressions.length} expressions</span>
              <span>{analysis.grammar.length} grammar patterns</span>
              <span>{analysis.dialogue.length} dialogues</span>
              <span>{analysis.learningObjectives.length} learning goals</span>
              <span>{analysis.culturalNotes.length} cultural notes</span>
            </div>
            <h3 style={{ fontSize: 16 }}>Workshop vocabulary</h3>
            {analysis.vocabulary.map((v, i) => (
              <div className="analysis-word" key={v.id}>
                <label>
                  Traditional Chinese
                  <input
                    value={v.traditional}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        vocabulary: analysis.vocabulary.map((w, j) =>
                          j === i
                            ? {
                                ...w,
                                traditional: e.target.value,
                                example: e.target.value,
                              }
                            : w,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Jyutping
                  <input
                    value={v.jyutping}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        vocabulary: analysis.vocabulary.map((w, j) =>
                          j === i
                            ? {
                                ...w,
                                jyutping: e.target.value,
                                exampleJyutping: e.target.value,
                              }
                            : w,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  English support
                  <input
                    value={v.english}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        vocabulary: analysis.vocabulary.map((w, j) =>
                          j === i
                            ? {
                                ...w,
                                english: e.target.value,
                                exampleEnglish: e.target.value,
                              }
                            : w,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  className="icon-btn"
                  aria-label={`Remove ${v.traditional}`}
                  onClick={() =>
                    setAnalysis({
                      ...analysis,
                      vocabulary: analysis.vocabulary.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
                <div className="provenance-note full-width">
                  Source: {source.filename} ·{" "}
                  {v.provenance?.sourcePage
                    ? `page ${v.provenance.sourcePage}`
                    : `section ${(v.provenance?.sourceChunk || 0) + 1}`}
                </div>
              </div>
            ))}
            <div className="form-grid">
              {(
                [
                  "learningObjectives",
                  "expressions",
                  "grammar",
                  "dialogue",
                ] as const
              ).map((key) => (
                <label className="field" key={key}>
                  {
                    {
                      learningObjectives: "Learning goals",
                      expressions: "Useful expressions",
                      grammar: "Grammar patterns",
                      dialogue: "Workshop dialogue",
                    }[key]
                  }
                  <textarea
                    value={analysis[key].join("\n")}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        [key]: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </label>
              ))}
              <label className="field full-width">
                Cultural notes · one note per line
                <textarea
                  value={analysis.culturalNotes.map((c) => c.body).join("\n")}
                  onChange={(e) =>
                    setAnalysis({
                      ...analysis,
                      culturalNotes: e.target.value
                        .split("\n")
                        .filter(Boolean)
                        .map((body) => ({ title: "From your workshop", body })),
                    })
                  }
                />
              </label>
            </div>
            <div className="studio-actions">
              <button className="btn secondary" onClick={() => setStep(0)}>
                Back
              </button>
              <button
                className="btn"
                disabled={
                  !analysis.vocabulary.length ||
                  !analysis.learningObjectives.length
                }
                onClick={() => setStep(2)}
              >
                <Check size={16} />
                Use this reviewed material
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Choose their little practice steps.</h2>
            <p>
              One workshop can become many ways to practise. Choose what fits
              your learners.
            </p>
            <div className="type-grid">
              {exerciseTypes.map((type) => (
                <label className="type-option" key={type}>
                  <input
                    type="checkbox"
                    checked={settings.types.includes(type)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        types: e.target.checked
                          ? [...settings.types, type]
                          : settings.types.filter((t) => t !== type),
                      })
                    }
                  />
                  {typeLabels[type]}
                </label>
              ))}
            </div>
            <div className="form-grid">
              <label className="field">
                Difficulty
                <select
                  value={settings.level}
                  onChange={(e) =>
                    setSettings({ ...settings, level: e.target.value })
                  }
                >
                  {["beginner", "intermediate", "advanced"].map((v) => (
                    <option value={v} key={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Learner group
                <select
                  value={settings.age}
                  onChange={(e) =>
                    setSettings({ ...settings, age: e.target.value })
                  }
                >
                  {["Children", "Teenagers", "Adults"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Practice length
                <select
                  value={settings.minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minutes: Number(e.target.value),
                    })
                  }
                >
                  {[5, 10, 15].map((v) => (
                    <option key={v} value={v}>
                      {v} minutes
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={settings.references}
                onChange={(e) =>
                  setSettings({ ...settings, references: e.target.checked })
                }
              />
              Use previous published lessons as style examples
            </label>
            <p className="help-text">
              Previous lessons guide the style. Your workshop material remains
              the source of learning content. Demo templates remain
              beginner-level; higher levels require the connected provider and
              human review.
            </p>
            <div className="studio-actions">
              <button className="btn secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="btn"
                disabled={
                  !settings.types.length ||
                  busy ||
                  (settings.level !== "beginner" && mode.startsWith("Demo"))
                }
                onClick={generate}
              >
                <Sparkles size={17} />
                Create practice draft
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <div className="generation-progress">
            {busy ? <div className="spinner" /> : <Sparkles size={40} />}
            <h3>
              {busy
                ? "Turning your workshop into little steps…"
                : "Your draft needs another try."}
            </h3>
            <p>
              Source content → practice activities → validation → your review.
              <br />
              Generated practice is never published automatically.
            </p>
            {!busy && (
              <button
                className="btn secondary"
                style={{ marginTop: 20 }}
                onClick={() => setStep(2)}
              >
                Adjust and retry
              </button>
            )}
          </div>
        )}
        {step === 4 && lesson && current && (
          <>
            <h2>Make every little step feel right.</h2>
            <p>
              Edit the draft and try the activities as a learner. Your judgement
              comes first.
            </p>
            <div className="editor-toolbar">
              <span className="status ai_generated">
                {mode || "Workshop draft"} · Version {lesson.version}
              </span>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => run(() => save())}
              >
                <Save size={14} />
                Save draft
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                Journey title · Chinese
                <input
                  value={lesson.title_zh}
                  onChange={(e) => edit({ title_zh: e.target.value })}
                />
              </label>
              <label className="field">
                Journey title · English
                <input
                  value={lesson.title}
                  onChange={(e) => edit({ title: e.target.value })}
                />
              </label>
            </div>
            {lesson.module && (
              <details className="panel module-intro">
                <summary>Review module teaching and context</summary>
                <label className="field">
                  Situation
                  <textarea
                    value={lesson.module.situation}
                    onChange={(e) =>
                      edit({
                        module: {
                          ...lesson.module!,
                          situation: e.target.value,
                        },
                      })
                    }
                  />
                </label>
                {lesson.module.sections.map((section, n) => (
                  <div className="teaching-points" key={section.id}>
                    <label className="field">
                      Section title
                      <input
                        value={section.title}
                        onChange={(e) =>
                          edit({
                            module: {
                              ...lesson.module!,
                              sections: lesson.module!.sections.map((s, i) =>
                                i === n ? { ...s, title: e.target.value } : s,
                              ),
                            },
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Teaching points · one per line
                      <textarea
                        value={section.teachingPoints.join("\n")}
                        onChange={(e) =>
                          edit({
                            module: {
                              ...lesson.module!,
                              sections: lesson.module!.sections.map((s, i) =>
                                i === n
                                  ? {
                                      ...s,
                                      teachingPoints:
                                        e.target.value.split("\n"),
                                    }
                                  : s,
                              ),
                            },
                          })
                        }
                      />
                    </label>
                    <p>
                      {section.exerciseIds.length} linked activities ·{" "}
                      {section.examples.length} source examples
                    </p>
                  </div>
                ))}
              </details>
            )}
            <div className="editor-layout">
              <aside className="editor-outline">
                {lesson.exercises.map((e, i) => (
                  <button
                    key={e.id}
                    className={selected === i ? "active" : ""}
                    onClick={() => {
                      setSelected(i);
                      setPreviewFeedback("");
                      setPreviewReady(false);
                    }}
                  >
                    <b>{i + 1}</b>
                    <span>{typeLabels[e.type]}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    const clone = { ...current, id: crypto.randomUUID() };
                    edit({ exercises: [...lesson.exercises, clone] });
                    setSelected(lesson.exercises.length);
                  }}
                >
                  <Plus size={14} />
                  Add activity
                </button>
              </aside>
              <div className="editor-main">
                <div className="editor-toolbar">
                  <h3>{typeLabels[current.type]}</h3>
                  <div className="speech-controls">
                    <button
                      className="btn secondary"
                      disabled={busy || !source}
                      onClick={() =>
                        run(async () => {
                          const result = await request("/api/studio", {
                            action: "generate",
                            sourceId: source!.id,
                            analysis: analysis || {
                              vocabulary: lesson.vocabulary,
                              learningObjectives: lesson.learningObjectives,
                              grammar: lesson.grammar,
                              culturalNotes: lesson.culturalNotes,
                              expressions: [],
                              dialogue: [],
                            },
                            settings: { ...settings, types: [current.type] },
                          });
                          const replacement = {
                            ...result.lesson.exercises[0],
                            id: current.id,
                          };
                          editExercise(replacement);
                          setNote(
                            "Activity regenerated. Review the revised wording. A generation draft is also saved in Studio.",
                          );
                        })
                      }
                    >
                      <RefreshCw size={12} />
                      Regenerate
                    </button>
                    <button
                      className="icon-btn"
                      disabled={lesson.exercises.length <= 1}
                      aria-label="Delete activity"
                      onClick={() => {
                        edit({
                          exercises: lesson.exercises.filter(
                            (_, i) => i !== selected,
                          ),
                        });
                        setSelected(Math.max(0, selected - 1));
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                {current.provenance && (
                  <div className="provenance-note">
                    {lesson.origin === "ai"
                      ? "✨ AI generated"
                      : "✦ Source-assisted demo"}{" "}
                    · Source: {source?.filename || lesson.workshop},{" "}
                    {current.provenance.sourcePage
                      ? `page ${current.provenance.sourcePage}`
                      : `section ${(current.provenance.sourceChunk || 0) + 1}`}
                    <details>
                      <summary>See workshop excerpt</summary>
                      {current.provenance.sourceExcerpt}
                    </details>
                  </div>
                )}
                <div className="editor-form">
                  <div className="form-grid">
                    <label className="field full-width">
                      Practice type
                      <select
                        value={current.type}
                        onChange={(e) => {
                          const type = e.target.value as Exercise["type"];
                          const word = lesson.vocabulary[0];
                          editExercise({
                            type,
                            options: lesson.vocabulary.map(
                              (v) => v.traditional,
                            ),
                            answer: word.traditional,
                            pairs: lesson.vocabulary.map((v) => ({
                              left: v.traditional,
                              right: v.english,
                            })),
                            tokens: [word.traditional],
                          });
                        }}
                      >
                        {exerciseTypes.map((t) => (
                          <option key={t} value={t}>
                            {typeLabels[t]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field full-width">
                      Instruction
                      <input
                        value={current.instruction}
                        onChange={(e) =>
                          editExercise({ instruction: e.target.value })
                        }
                      />
                    </label>
                    <label className="field full-width">
                      Question or phrase
                      <textarea
                        rows={2}
                        value={current.prompt}
                        onChange={(e) =>
                          editExercise({ prompt: e.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      Jyutping
                      <input
                        value={current.jyutping}
                        onChange={(e) =>
                          editExercise({ jyutping: e.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      English support
                      <input
                        value={current.english}
                        onChange={(e) =>
                          editExercise({ english: e.target.value })
                        }
                      />
                    </label>
                    {![
                      "flashcard",
                      "speak",
                      "ai_roleplay",
                      "match",
                      "sentence_order",
                    ].includes(current.type) && (
                      <label className="field full-width">
                        Choices · one per line
                        <textarea
                          rows={3}
                          value={current.options.join("\n")}
                          onChange={(e) =>
                            editExercise({
                              options: e.target.value
                                .split("\n")
                                .filter(Boolean),
                            })
                          }
                        />
                      </label>
                    )}
                    {!["flashcard", "ai_roleplay", "match"].includes(
                      current.type,
                    ) && (
                      <label className="field full-width">
                        Expected answer
                        <input
                          value={current.answer}
                          onChange={(e) =>
                            editExercise({ answer: e.target.value })
                          }
                        />
                      </label>
                    )}
                    {current.type === "sentence_order" && (
                      <label className="field full-width">
                        Sentence pieces · separate with |
                        <input
                          value={current.tokens?.join("|") || ""}
                          onChange={(e) =>
                            editExercise({
                              tokens: e.target.value.split("|").filter(Boolean),
                            })
                          }
                        />
                      </label>
                    )}
                    {current.type === "match" && (
                      <label className="field full-width">
                        Matching pairs · Chinese | English, one per line
                        <textarea
                          value={
                            current.pairs
                              ?.map((p) => `${p.left}|${p.right}`)
                              .join("\n") || ""
                          }
                          onChange={(e) =>
                            editExercise({
                              pairs: e.target.value.split("\n").map((l) => {
                                const [left = "", right = ""] = l.split("|");
                                return { left, right };
                              }),
                            })
                          }
                        />
                      </label>
                    )}
                    <label className="field full-width">
                      Learner feedback
                      <textarea
                        value={current.explanation}
                        onChange={(e) =>
                          editExercise({ explanation: e.target.value })
                        }
                      />
                    </label>
                    <label className="field full-width">
                      Words to track · separated with |
                      <input
                        value={current.tags.join("|")}
                        onChange={(e) =>
                          editExercise({
                            tags: e.target.value.split("|").filter(Boolean),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
                <div className="preview-wrap">
                  <div className="preview-label">
                    STUDENT VIEW · TRY IT BELOW
                  </div>
                  <ExerciseRenderer
                    key={JSON.stringify(current)}
                    exercise={current}
                    lesson={lesson}
                    preview
                    onAnswer={(a, r) => {
                      setPreviewAnswer(a);
                      setPreviewReady(r);
                    }}
                  />
                  {previewReady && (
                    <button
                      className="btn secondary"
                      style={{ margin: "0 20px 15px" }}
                      onClick={() =>
                        setPreviewFeedback(
                          ["flashcard", "speak", "ai_roleplay"].includes(
                            current.type,
                          )
                            ? "Practice complete"
                            : current.type === "match"
                              ? previewAnswer === JSON.stringify(current.pairs)
                                ? "Correct!"
                                : "Try matching again."
                              : isCorrect(current, previewAnswer)
                                ? "Correct!"
                                : "Try again — " + current.explanation,
                        )
                      }
                    >
                      Check preview answer
                    </button>
                  )}
                  {previewFeedback && (
                    <div className="hint-box" role="status">
                      {previewFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <section className="panel" style={{ padding: 24, marginTop: 24 }}>
              <h3>Lesson voice clips</h3>
              <p>
                {
                  lessonAudioTexts(lesson).filter((text) =>
                    lesson.audio?.some((clip) => clip.text === text),
                  ).length
                }{" "}
                of {lessonAudioTexts(lesson).length} phrases have saved audio.
                Review the Cantonese wording, then generate and listen before
                approving.
              </p>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => run(generateAudio)}
              >
                Generate lesson audio
              </button>
              <p className="setup-field-help">
                Set up a voice provider in Developer setup first. Finished clips
                are reused on retry; changing text generates a new clip.
                Generation uses your provider quota.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                {(lesson.audio || [])
                  .filter((clip) =>
                    lessonAudioTexts(lesson).includes(clip.text),
                  )
                  .map((clip) => (
                    <div
                      key={clip.id}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span>{clip.text}</span>
                      <ListenButton lesson={lesson} text={clip.text} />
                    </div>
                  ))}
              </div>
            </section>
            <div className="studio-actions">
              <button
                className="btn secondary"
                onClick={() => run(() => save())}
                disabled={busy}
              >
                <Save size={14} />
                Save draft
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await save();
                    setStep(5);
                  })
                }
              >
                Ready to review & publish
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {step === 5 && lesson && (
          <>
            <h2>A new adventure, ready to share.</h2>
            <p>
              Choose how students find it. A human review is required before
              publishing.
            </p>
            <div className="form-grid">
              <label className="field">
                Journey title · Chinese
                <input
                  value={lesson.title_zh}
                  onChange={(e) => edit({ title_zh: e.target.value })}
                />
              </label>
              <label className="field">
                Journey title · English
                <input
                  value={lesson.title}
                  onChange={(e) => edit({ title: e.target.value })}
                />
              </label>
              <label className="field">
                Journey icon
                <input
                  value={lesson.icon}
                  maxLength={8}
                  onChange={(e) => edit({ icon: e.target.value })}
                />
              </label>
              <label className="field">
                Topic
                <input
                  value={lesson.topic}
                  onChange={(e) => edit({ topic: e.target.value })}
                />
              </label>
              <label className="field">
                Workshop
                <input
                  value={lesson.workshop}
                  onChange={(e) => edit({ workshop: e.target.value })}
                />
              </label>
              <label className="field">
                Availability
                <select
                  value={lesson.availability}
                  onChange={(e) =>
                    edit({
                      availability: e.target.value as Lesson["availability"],
                    })
                  }
                >
                  <option value="available">Available immediately</option>
                  <option value="scheduled">Schedule for later</option>
                </select>
              </label>
              {lesson.availability === "scheduled" && (
                <label className="field">
                  Available from
                  <input
                    type="datetime-local"
                    onChange={(e) => {
                      if (e.target.value)
                        edit({
                          availableAt: new Date(e.target.value).toISOString(),
                        });
                    }}
                  />
                </label>
              )}
              <label className="field full-width">
                Short description
                <textarea
                  value={lesson.description}
                  onChange={(e) => edit({ description: e.target.value })}
                />
              </label>
            </div>
            <div className="approval-box">
              <h3>
                <CheckCircle2 size={18} /> Your review makes it ready.
              </h3>
              <label>
                <input
                  type="checkbox"
                  checked={approval}
                  onChange={(e) => setApproval(e.target.checked)}
                />
                I checked the Cantonese, Jyutping, answers, source grounding,
                and suitability for learners. I have permission to use the
                source material.
              </label>
              <p>
                {lesson.exercises.length} activities ·{" "}
                {lesson.vocabulary.length} vocabulary items ·{" "}
                {lesson.estimated_minutes} minutes · Version {lesson.version}
              </p>
              <button
                className="btn secondary"
                style={{ marginTop: 18 }}
                disabled={!approval || busy || lesson.status === "approved"}
                onClick={() => run(() => save("approve"))}
              >
                <Check size={16} />
                {lesson.status === "approved"
                  ? "Review approved"
                  : "Approve this draft"}
              </button>
            </div>
            {data.history.filter((l) => l.id === lesson.id).length > 0 && (
              <div className="history-list">
                <strong>Published history</strong>
                {data.history
                  .filter((l) => l.id === lesson.id)
                  .map((l) => (
                    <p key={l.version}>
                      Version {l.version} · {l.title_zh} ·{" "}
                      {new Date(l.updatedAt).toLocaleDateString()}
                    </p>
                  ))}
              </div>
            )}
            <div className="studio-actions">
              <button className="btn secondary" onClick={() => setStep(4)}>
                Back to activities
              </button>
              <button
                className="btn"
                disabled={busy || lesson.status !== "approved" || !approval}
                onClick={() =>
                  run(async () => {
                    const result = await request("/api/studio", {
                      action: "publish",
                      lessonId: lesson.id,
                    });
                    setLesson(result.lesson);
                    setPublished(true);
                    await refresh();
                  })
                }
              >
                {busy ? "Publishing…" : "Publish to students"}
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {error && (
          <div className="error-note" role="alert">
            {error.includes("Zod") || error.includes('"code"')
              ? "Some fields need attention. Check the answers, unique choices, sentence pieces, and required lesson details."
              : error}
          </div>
        )}
        {note && (
          <div className="success-note" role="status">
            {note}
          </div>
        )}
      </div>
    </>
  );
}
