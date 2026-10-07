import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureDependencies } from "../scripts/ensure-dependencies.mjs";
test("startup repairs missing pg and syncs changed dependency locks without repeated installation", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "workshop-dependencies-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = {
    dependencies: { next: "1.0.0", pg: "1.0.0" },
    devDependencies: { typescript: "1.0.0" },
  };
  let version = "1.0.0";
  let calls = 0;
  async function file(name: string, value: unknown) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), JSON.stringify(value));
  }
  async function locked() {
    const packages = Object.fromEntries(
      ["next", "pg", "typescript"].map((name) => [
        "node_modules/" + name,
        {
          version: name === "pg" ? version : "1.0.0",
          integrity: "test-" + name,
        },
      ]),
    );
    await file("package-lock.json", { packages });
    return packages;
  }
  await file("package.json", manifest);
  const packages = await locked();
  await file("node_modules/next/package.json", { version: "1.0.0" });
  await file("node_modules/typescript/package.json", { version: "1.0.0" });
  await file("node_modules/.package-lock.json", { packages });
  const installer = async () => {
    calls++;
    const packages = await locked();
    for (const [location, entry] of Object.entries(packages))
      await file(location + "/package.json", { version: entry.version });
    await file("node_modules/.package-lock.json", { packages });
  };
  await ensureDependencies(root, { runInstall: installer });
  assert.equal(calls, 1);
  await ensureDependencies(root, { runInstall: installer });
  assert.equal(calls, 1);
  await rm(path.join(root, "node_modules/pg"), { recursive: true });
  await ensureDependencies(root, { runInstall: installer });
  assert.equal(calls, 2);
  version = "2.0.0";
  manifest.dependencies.pg = version;
  await file("package.json", manifest);
  await locked();
  await ensureDependencies(root, { runInstall: installer });
  assert.equal(calls, 3);
  await rm(path.join(root, "node_modules/pg"), { recursive: true });
  await assert.rejects(
    () =>
      ensureDependencies(root, {
        runInstall: async () => {
          throw new Error("offline");
        },
      }),
    /offline/,
  );
  await assert.rejects(
    () => ensureDependencies(root, { runInstall: async () => {} }),
    /still missing/,
  );
});
