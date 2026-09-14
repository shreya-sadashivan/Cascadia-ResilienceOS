import { spawn } from "node:child_process";
const children = [
  spawn("npm", ["run", "dev"], { stdio: "inherit", shell: true }),
  spawn("npm", ["run", "server"], { stdio: "inherit", shell: true }),
];
const shutdown = () => children.forEach((child) => child.kill("SIGTERM"));
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
children.forEach((child) => child.on("exit", (code) => { if (code && code !== 0) shutdown(); }));
