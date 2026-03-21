#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";

const CONFIG_FILE = "agentbar.config.json";
const DEFAULT_CONFIG = {
  apiBase: "https://agent-pug.vercel.app",
  authToken: "",
  accountEmail: "",
  siteUrl: "",
  siteKey: "",
  depth: 1,
  maxPages: 15,
  themeColor: "#059669",
  position: "right",
  title: "Site Assistant",
  subtitle: "Get answers from your site.",
  buttonLabel: "",
  fontFamily: "ui-sans-serif, system-ui, -apple-system",
  panelBackground: "#ffffff",
  textColor: "#0f172a",
  mutedTextColor: "#64748b",
  borderColor: "#e2e8f0",
  buttonBackground: "#ffffff",
  buttonTextColor: "#0f172a",
  accentTextColor: "",
  buttonShadow: "0 18px 40px -28px rgba(15, 23, 42, 0.35)",
  panelShadow: "0 30px 60px -45px rgba(15, 23, 42, 0.35)",
  badgeLabel: "",
  badgeBackground: "",
  badgeTextColor: "",
  userBubbleBackground: "",
  userBubbleText: "",
  userBubbleBorder: "",
  assistantBubbleBackground: "",
  assistantBubbleText: "",
  assistantBubbleBorder: "",
  panelWidth: "320px",
  panelMaxHeight: "70vh",
  panelRadius: "16px",
  buttonRadius: "16px",
  offsetX: 20,
  offsetY: 20,
  inputPlaceholder: "Type a message",
  sendLabel: "Send",
  suggestions: ["Search pricing", "Explain a feature", "Draft homepage copy"],
  greeting: "",
  draggable: true,
  dragOffset: 0,
  persistPosition: false,
  positionKey: "",
  openOnLoad: false,
  autoIngest: true,
  closeOnOutsideClick: true,
  showReset: false,
  persist: false,
  storageKey: "",
  showTypingIndicator: true,
  showExport: false,
  exportLabel: "Copy",
  showScrollButton: true,
  scrollLabel: "Scroll",
  showMinimize: false,
  minimizedOnLoad: false,
  minimizeLabel: "Minimize",
  expandLabel: "Expand",
  showTimestamps: false,
  timestampLocale: "",
  autoScroll: true,
  autoScrollThreshold: 24,
  messageMaxWidth: "85%",
  launcherTooltip: "",
};

const configPath = path.join(process.cwd(), CONFIG_FILE);

const loadConfig = () => {
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const data = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { ...DEFAULT_CONFIG, ...data };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
};

const saveConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const resolveSiteKey = (config) => {
  if (config.siteKey) {
    return config.siteKey;
  }
  const normalized = normalizeUrl(config.siteUrl);
  if (!normalized) {
    return "";
  }
  try {
    return new URL(normalized).hostname;
  } catch {
    return "";
  }
};

const authHeaders = (config) =>
  config.authToken
    ? {
        Authorization: `Bearer ${config.authToken}`,
      }
    : {};

const renderSnippet = (config) => {
  const apiBase = (config.apiBase || DEFAULT_CONFIG.apiBase).replace(/\/$/, "");
  const siteKey = resolveSiteKey(config) || "your-site-key";
  return `<script src="${apiBase}/agentbar.js" data-site-key="${siteKey}"></script>`;
};

const openBrowser = (url) => {
  try {
    if (process.platform === "darwin") {
      spawn("open", [url], { stdio: "ignore", detached: true }).unref();
      return true;
    }
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
      return true;
    }
    if (process.platform === "linux") {
      spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const syncConfig = async (config) => {
  const apiBase = (config.apiBase || DEFAULT_CONFIG.apiBase).replace(/\/$/, "");
  const siteKey = resolveSiteKey(config);
  if (!siteKey || !config.authToken) {
    return;
  }
  try {
    const response = await fetch(`${apiBase}/api/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(config),
      },
      body: JSON.stringify({
        siteKey,
        config: { ...config, siteKey },
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || "Could not sync hosted settings.");
    }
  } catch (_error) {
    console.warn("Could not sync settings to the hosted dashboard.");
  }
};

const printHelp = () => {
  console.log("Agent Plugin Bar CLI\n");
  console.log("Commands:");
  console.log("  agentbar login          Open the web login flow and save an auth token");
  console.log("  agentbar init           Interactive setup and snippet output");
  console.log("  agentbar snippet        Print current embed snippet");
  console.log("  agentbar set <key> <v>  Update config value");
  console.log("  agentbar stats          Fetch indexing status from the API");
  console.log("  agentbar config         Print config JSON");
  console.log("  agentbar help           Show help\n");
  console.log("Config keys:");
  console.log(
    "  siteUrl, apiBase, authToken, accountEmail, depth, maxPages, siteKey, themeColor, position, title, subtitle,"
  );
  console.log(
    "  buttonLabel, fontFamily, panelBackground, textColor, mutedTextColor, borderColor,"
  );
  console.log(
    "  buttonBackground, buttonTextColor, accentTextColor, buttonShadow, panelShadow, badgeLabel,"
  );
  console.log(
    "  badgeBackground, badgeTextColor, userBubbleBackground, userBubbleText, userBubbleBorder,"
  );
  console.log(
    "  assistantBubbleBackground, assistantBubbleText, assistantBubbleBorder, panelWidth, panelMaxHeight,"
  );
  console.log(
    "  panelRadius, buttonRadius, offsetX, offsetY, inputPlaceholder, sendLabel, suggestions,"
  );
  console.log(
    "  greeting, draggable, dragOffset, persistPosition, positionKey, openOnLoad, autoIngest,"
  );
  console.log(
    "  showReset, persist, storageKey, showTypingIndicator, showExport, exportLabel,"
  );
  console.log(
    "  showScrollButton, scrollLabel, showMinimize, minimizedOnLoad, minimizeLabel, expandLabel,"
  );
  console.log(
    "  showTimestamps, timestampLocale, autoScroll, autoScrollThreshold, messageMaxWidth,"
  );
  console.log("  launcherTooltip, closeOnOutsideClick\n");
  console.log(`Config file: ${configPath}`);
};

const ask = (rl, prompt, fallback) =>
  new Promise((resolve) => {
    const label = fallback ? `${prompt} (${fallback}): ` : `${prompt}: `;
    rl.question(label, (answer) => {
      const value = answer.trim();
      resolve(value || fallback || "");
    });
  });

const login = async (existingConfig = loadConfig()) => {
  const config = { ...existingConfig };
  const apiBase = (config.apiBase || DEFAULT_CONFIG.apiBase).replace(/\/$/, "");

  const response = await fetch(`${apiBase}/api/auth/device/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to start login.");
  }

  console.log(`User code: ${data.userCode}`);
  console.log(`Verification URL: ${data.verificationUrl}`);
  if (!openBrowser(data.verificationUrl)) {
    console.log("Open that URL in your browser to continue.");
  }
  console.log("Waiting for approval...\n");

  const intervalMs = Math.max(1000, Number(data.interval || 2) * 1000);
  const expiresAt = Number(data.expiresAt || 0);

  while (!expiresAt || Date.now() < expiresAt) {
    await sleep(intervalMs);
    const pollResponse = await fetch(`${apiBase}/api/auth/device/poll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceCode: data.deviceCode }),
    });
    const pollData = await pollResponse.json().catch(() => ({}));
    if (!pollResponse.ok) {
      throw new Error(pollData?.error || "Login polling failed.");
    }
    if (!pollData.approved) {
      continue;
    }
    config.authToken = pollData.accessToken || "";
    config.accountEmail = pollData.user?.email || "";
    saveConfig(config);
    console.log(`Logged in as ${config.accountEmail || "your account"}.`);
    return config;
  }

  throw new Error("Login request expired before approval.");
};

const init = async () => {
  let config = loadConfig();
  if (!config.authToken) {
    console.log("No saved login found. Opening the web login flow...\n");
    config = await login(config);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const siteUrlInput = await ask(rl, "Site URL", config.siteUrl || "https://your-site.com");
    config.siteUrl = normalizeUrl(siteUrlInput);
    if (!config.siteUrl) {
      config.siteUrl = "https://your-site.com";
    }
    config.siteKey = resolveSiteKey(config);
  } finally {
    rl.close();
  }

  saveConfig(config);
  await syncConfig(config);
  console.log("\nSaved config to", configPath);
  console.log("\nEmbed snippet:\n");
  console.log(renderSnippet(config));
  console.log(`\nDashboard: ${(config.apiBase || DEFAULT_CONFIG.apiBase).replace(/\/$/, "")}\n`);
};

const printStats = async () => {
  const config = loadConfig();
  const apiBase = (config.apiBase || DEFAULT_CONFIG.apiBase).replace(/\/$/, "");
  const siteKey = resolveSiteKey(config);

  if (!siteKey) {
    console.error("Missing siteUrl. Run `agentbar init` or `agentbar set siteUrl <url>` first.");
    process.exit(1);
  }

  if (!config.authToken) {
    console.error("Missing auth token. Run `agentbar login` first.");
    process.exit(1);
  }

  try {
    const response = await fetch(`${apiBase}/api/status`, {
      headers: authHeaders(config),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || `Status request failed (${response.status})`);
    }
    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const matched = items.filter((item) => item.key === siteKey);
    if (!matched.length) {
      console.log("No indexed content found for", siteKey);
      console.log("Save the site config and run reindex from the console first.");
      return;
    }
    matched.forEach((item) => {
      console.log(`Site: ${item.url}`);
      console.log(`Pages indexed: ${item.pages?.length ?? 0}`);
      console.log(`Chunks: ${item.chunkCount ?? 0}`);
      console.log(`Updated: ${item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "N/A"}`);
      console.log("");
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load stats.";
    console.error(message);
    process.exit(1);
  }
};

const setValue = async (key, value) => {
  if (!key || typeof value === "undefined") {
    console.error("Usage: agentbar set <key> <value>");
    process.exit(1);
  }

  const config = loadConfig();
  const allowed = new Set(Object.keys(DEFAULT_CONFIG));
  if (!allowed.has(key)) {
    console.error(`Unknown key: ${key}`);
    printHelp();
    process.exit(1);
  }

  if (key === "depth" || key === "maxPages" || key === "autoScrollThreshold") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      console.error(`${key} must be a number.`);
      process.exit(1);
    }
    config[key] = parsed;
  } else if (key === "offsetX" || key === "offsetY" || key === "dragOffset") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      console.error(`${key} must be a number.`);
      process.exit(1);
    }
    config[key] = parsed;
  } else if (
    key === "openOnLoad" ||
    key === "autoIngest" ||
    key === "closeOnOutsideClick" ||
    key === "showReset" ||
    key === "persist" ||
    key === "showTypingIndicator" ||
    key === "draggable" ||
    key === "persistPosition" ||
    key === "showExport" ||
    key === "showScrollButton" ||
    key === "showMinimize" ||
    key === "minimizedOnLoad" ||
    key === "showTimestamps" ||
    key === "autoScroll"
  ) {
    config[key] = value === "true" || value === true;
  } else if (key === "suggestions") {
    config[key] = String(value)
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (key === "siteUrl") {
    config[key] = normalizeUrl(value);
    config.siteKey = resolveSiteKey(config);
  } else {
    config[key] = value;
  }

  saveConfig(config);
  await syncConfig(config);
  console.log("Updated", key, "in", configPath);
};

const main = async () => {
  const [command, arg1, arg2] = process.argv.slice(2);

  switch (command) {
    case "login":
      await login();
      return;
    case "init":
      await init();
      return;
    case "snippet": {
      const config = loadConfig();
      console.log(renderSnippet(config));
      return;
    }
    case "stats":
      await printStats();
      return;
    case "set":
      await setValue(arg1, arg2);
      return;
    case "config":
      console.log(JSON.stringify(loadConfig(), null, 2));
      return;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      return;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
