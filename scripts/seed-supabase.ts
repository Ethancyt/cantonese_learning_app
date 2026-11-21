// Database-owner SQL only. Published historical snapshots are never replaced.
import { seedLessons } from "../lib/seeds";
import {
  retiredDemoFilename,
  retiredDemoOpening,
  retiredSystemLessonIds,
} from "../lib/content/retired-content";

const sqlString = (value: string) => "'" + value.replaceAll("'", "''") + "'";
export function curriculumSQL() {
  return (
    "begin;\n" +
    seedLessons
      .map((lesson) => {
        const payload = JSON.stringify(lesson).replaceAll("'", "''");
        return `INSERT INTO public.lessons(id,created_by,status,version,payload) VALUES('${lesson.id}',NULL,'published',${lesson.version},'${payload}'::jsonb)
ON CONFLICT(id) DO UPDATE SET status=excluded.status,version=excluded.version,payload=excluded.payload,updated_at=now()
WHERE lessons.created_by IS NULL AND lessons.status='published' AND lessons.version<excluded.version;
INSERT INTO public.published_versions(lesson_id,version,payload)
SELECT id,version,payload FROM public.lessons WHERE id='${lesson.id}' AND created_by IS NULL AND version=${lesson.version} AND payload='${payload}'::jsonb
ON CONFLICT(lesson_id,version) DO NOTHING;`;
      })
      .join("\n") +
    `
UPDATE public.lessons AS lesson
SET status='archived', payload=jsonb_set(lesson.payload,'{status}','"archived"'), updated_at=now()
WHERE lesson.status='published' AND (
  (lesson.created_by IS NULL AND lesson.id IN (${retiredSystemLessonIds.map(sqlString).join(", ")}))
  OR EXISTS (
    SELECT 1 FROM public.source_materials AS source
    WHERE source.id::text=lesson.payload->>'sourceMaterialId'
      AND source.filename=${sqlString(retiredDemoFilename)}
      AND starts_with(source.payload->>'text',${sqlString(retiredDemoOpening)})
  )
);
commit;
`
  );
}
if (process.argv[1]?.endsWith("seed-supabase.ts")) console.log(curriculumSQL());
