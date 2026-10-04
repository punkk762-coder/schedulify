const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("🚀 Starting Schedulfy (Backend on :4000, Frontend on :3000)...");

const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: backendDir,
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, PORT: "4000" },
});

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: frontendDir,
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, PORT: "3000" },
});

backend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[36m[backend]\x1b[0m ${data}`);
});
backend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[31m[backend]\x1b[0m ${data}`);
});

frontend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[35m[frontend]\x1b[0m ${data}`);
});
frontend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[31m[frontend]\x1b[0m ${data}`);
});

function cleanup() {
  console.log("\n🛑 Stopping backend and frontend...");
  if (isWindows) {
    if (backend.pid) spawn("taskkill", ["/pid", backend.pid.toString(), "/f", "/t"]);
    if (frontend.pid) spawn("taskkill", ["/pid", frontend.pid.toString(), "/f", "/t"]);
  } else {
    backend.kill();
    frontend.kill();
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
