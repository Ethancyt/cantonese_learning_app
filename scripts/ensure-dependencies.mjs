import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

async function json(filename) {
  try {
    return JSON.parse(await readFile(filename, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}
async function installedMatches(root, manifest, lock, includeDev) {
  const required = {
    ...manifest.dependencies,
    ...(includeDev ? manifest.devDependencies : {}),
  };
  for (const name of Object.keys(required)) {
    const installed = await json(
      path.join(root, "node_modules", name, "package.json"),
    );
    if (
      !installed ||
      installed.version !== lock.packages?.[`node_modules/${name}`]?.version
    )
      return false;
  }
  const installedLock = await json(
    path.join(root, "node_modules", ".package-lock.json"),
  );
  if (!installedLock?.packages) return false;
  for (const [location, entry] of Object.entries(installedLock.packages)) {
    if (!location) continue;
    if (
      !location.startsWith("node_modules/") ||
      location.split("/").includes("..")
    )
      return false;
    const expected = lock.packages?.[location];
    if (
      !expected ||
      expected.version !== entry.version ||
      expected.integrity !== entry.integrity
    )
      return false;
    const installed = await json(path.join(root, location, "package.json"));
    if (!installed || installed.version !== entry.version) return false;
  }
  return true;
}
function install(root, includeDev) {
  return new Promise((resolve, reject) => {
    const npmCli = process.env.npm_execpath;
    const executable = npmCli
      ? process.execPath
      : process.platform === "win32"
        ? "npm.cmd"
        : "npm";
    const child = spawn(
      executable,
      [
        ...(npmCli ? [npmCli] : []),
        "ci",
        includeDev ? "--include=dev" : "--omit=dev",
      ],
      {
        cwd: root,
        stdio: "inherit",
        shell: !npmCli && process.platform === "win32",
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              "Dependency installation failed. Check your internet connection and launch the app again.",
            ),
          ),
    );
  });
}
export async function ensureDependencies(
  root,
  { includeDev = true, runInstall = install } = {},
) {
  const manifest = await json(path.join(root, "package.json"));
  const lock = await json(path.join(root, "package-lock.json"));
  if (!manifest || !lock)
    throw new Error(
      "The app download is incomplete. Sync the repository again before starting.",
    );
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        dependencies: manifest.dependencies,
        devDependencies: manifest.devDependencies,
        lock,
      }),
    )
    .digest("hex");
  const marker = path.join(root, "node_modules", ".workshop-dependencies.json");
  const previous = await json(marker);
  const matches = await installedMatches(root, manifest, lock, includeDev);
  if (!matches || (previous && previous.fingerprint !== fingerprint)) {
    console.log("Preparing updated app dependencies automatically…");
    await runInstall(root, includeDev);
    if (!(await installedMatches(root, manifest, lock, includeDev)))
      throw new Error(
        "Some app dependencies are still missing. Check the installation output and launch the app again.",
      );
  }
  await writeFile(marker, JSON.stringify({ fingerprint }), "utf8");
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  ensureDependencies(process.cwd(), {
    includeDev: !["start", "hosted"].includes(process.argv[2]),
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
