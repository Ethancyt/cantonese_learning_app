"use client";
import { Lesson, ModuleSection } from "@/lib/schema";
import { ListenButton } from "./dashboard";
export function ModuleTeaching({
  section,
  lesson,
}: {
  section: ModuleSection;
  lesson: Lesson;
}) {
  return (
    <section className="module-teaching">
      <span className="eyebrow">
        MODULE {lesson.module?.unit} · LEARN IN CONTEXT
      </span>
      <h2>{section.title_zh}</h2>
      <h3>{section.title}</h3>
      <p>{section.description}</p>
      <div className="teaching-points">
        <h3>Notice the pattern</h3>
        <ul>
          {section.teachingPoints.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      {!!section.dialogue.length && (
        <>
          <h3>A conversation to follow</h3>
          <div className="module-dialogue">
            {section.dialogue.map((line, i) => (
              <div className="dialogue-line" key={i}>
                <span className="eyebrow">{line.speaker}</span>
                <div className="dialogue-phrase">
                  <strong>{line.traditional}</strong>
                  <ListenButton lesson={lesson} text={line.traditional} />
                </div>
                <span className="jyutping">{line.jyutping}</span>
                <p>{line.english}</p>
              </div>
            ))}
          </div>
        </>
      )}
      <details className="module-examples">
        <summary>Useful phrases in sentences</summary>
        {section.examples.map((e, i) => (
          <div className="dialogue-line" key={i}>
            <div className="dialogue-phrase">
              <strong>{e.traditional}</strong>
              <ListenButton lesson={lesson} text={e.traditional} />
            </div>
            <p className="jyutping">{e.jyutping}</p>
            <p>{e.english}</p>
          </div>
        ))}
      </details>
    </section>
  );
}
