// Database-owner SQL only. Published historical snapshots are never replaced.
import { seedLessons } from "../lib/seeds";
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
    "\ncommit;\n"
  );
}
if (process.argv[1]?.endsWith("seed-supabase.ts")) console.log(curriculumSQL());
