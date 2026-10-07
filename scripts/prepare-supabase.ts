import { readFile, writeFile } from "node:fs/promises";
import { curriculumSQL } from "./seed-supabase";
async function main() {
  const schema = await readFile("supabase/schema.sql", "utf8");
  const modules = await readFile(
    "supabase/migrations/002_learning_modules.sql",
    "utf8",
  );
  await writeFile(
    "supabase/setup-new-project.sql",
    "-- FOR A NEW EMPTY PROJECT ONLY.\n" +
      schema +
      "\n" +
      modules +
      "\n" +
      curriculumSQL(),
  );
  await writeFile(
    "supabase/upgrade-existing-project.sql",
    "-- FOR A PROJECT WITH schema.sql ALREADY APPLIED.\n" +
      modules +
      "\n" +
      curriculumSQL(),
  );
  console.log(
    "Prepared new-project and existing-project SQL files in supabase/. No credentials needed.",
  );
}
main().catch(() => {
  console.error("Unable to prepare Supabase SQL files.");
  process.exitCode = 1;
});
