import { spawn } from "node:child_process";
import { connect } from "node:net";
const mode = process.argv[2] || "dev";
console.log("Developer setup: http://localhost:3000/developer");
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    mode,
    "--hostname",
    "127.0.0.1",
    ...process.argv.slice(3),
  ],
  { stdio: "inherit", env: { ...process.env, LOCAL_DEVELOPER_SETUP: "true" } },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  process.exitCode = code || 0;
});

if (process.platform === "win32" && process.env.OPEN_SETUP_PAGE === "true") {
  let attempts = 0;
  const timer = setInterval(() => {
    if (++attempts > 60) {
      clearInterval(timer);
      return;
    }
    const socket = connect({ host: "127.0.0.1", port: 3000 });
    socket.on("connect", () => {
      socket.destroy();
      clearInterval(timer);
      spawn("cmd.exe", ["/c", "start", "", "http://localhost:3000/developer"], {
        stdio: "ignore",
      });
    });
    socket.on("error", () => socket.destroy());
  }, 1000);
  child.on("exit", () => clearInterval(timer));
}
