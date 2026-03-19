#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let resolved;

try {
  resolved = require.resolve("@arjun-shah/agentbar-cli/bin/agentbar.js");
} catch (error) {
  console.error("AgentBar CLI is missing. Reinstall with npm install -g agentbar-cli.");
  process.exit(1);
}

const child = spawn(process.execPath, [resolved, ...process.argv.slice(2)], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
