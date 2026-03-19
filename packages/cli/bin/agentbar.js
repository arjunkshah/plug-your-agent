#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import process from "node:process";

const CONFIG_FILE = "agentbar.config.json";
const DEFAULT_CONFIG = {
  apiBase: "https://agent-pug.vercel.app",
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

const renderSnippet = (config) => {
  const lines = [
    "<script",
    `  src=\"${config.apiBase.replace(/\/$/, "")}/agentbar.js\"`,
    `  data-site=\"${config.siteUrl || "https://your-site.com"}\"`,
    `  data-api=\"${config.apiBase.replace(/\/$/, "")}\"`,
    `  data-depth=\"${config.depth}\"`,
    `  data-max-pages=\"${config.maxPages}\"`,
  ];
  if (config.siteKey) {
    lines.push(`  data-site-key=\"${config.siteKey}\"`);
  }
  if (config.themeColor) {
    lines.push(`  data-theme-color=\"${config.themeColor}\"`);
  }
  if (config.position) {
    lines.push(`  data-position=\"${config.position}\"`);
  }
  if (config.title) {
    lines.push(`  data-title=\"${config.title}\"`);
  }
  if (config.subtitle) {
    lines.push(`  data-subtitle=\"${config.subtitle}\"`);
  }
  if (config.buttonLabel) {
    lines.push(`  data-button-label=\"${config.buttonLabel}\"`);
  }
  if (config.fontFamily) {
    lines.push(`  data-font-family=\"${config.fontFamily}\"`);
  }
  if (config.panelBackground) {
    lines.push(`  data-panel-background=\"${config.panelBackground}\"`);
  }
  if (config.textColor) {
    lines.push(`  data-text-color=\"${config.textColor}\"`);
  }
  if (config.mutedTextColor) {
    lines.push(`  data-muted-text-color=\"${config.mutedTextColor}\"`);
  }
  if (config.borderColor) {
    lines.push(`  data-border-color=\"${config.borderColor}\"`);
  }
  if (config.buttonBackground) {
    lines.push(`  data-button-background=\"${config.buttonBackground}\"`);
  }
  if (config.buttonTextColor) {
    lines.push(`  data-button-text-color=\"${config.buttonTextColor}\"`);
  }
  if (config.accentTextColor) {
    lines.push(`  data-accent-text-color=\"${config.accentTextColor}\"`);
  }
  if (config.buttonShadow) {
    lines.push(`  data-button-shadow=\"${config.buttonShadow}\"`);
  }
  if (config.panelShadow) {
    lines.push(`  data-panel-shadow=\"${config.panelShadow}\"`);
  }
  if (config.badgeLabel) {
    lines.push(`  data-badge-label=\"${config.badgeLabel}\"`);
  }
  if (config.badgeBackground) {
    lines.push(`  data-badge-background=\"${config.badgeBackground}\"`);
  }
  if (config.badgeTextColor) {
    lines.push(`  data-badge-text-color=\"${config.badgeTextColor}\"`);
  }
  if (config.userBubbleBackground) {
    lines.push(`  data-user-bubble-background=\"${config.userBubbleBackground}\"`);
  }
  if (config.userBubbleText) {
    lines.push(`  data-user-bubble-text=\"${config.userBubbleText}\"`);
  }
  if (config.userBubbleBorder) {
    lines.push(`  data-user-bubble-border=\"${config.userBubbleBorder}\"`);
  }
  if (config.assistantBubbleBackground) {
    lines.push(`  data-assistant-bubble-background=\"${config.assistantBubbleBackground}\"`);
  }
  if (config.assistantBubbleText) {
    lines.push(`  data-assistant-bubble-text=\"${config.assistantBubbleText}\"`);
  }
  if (config.assistantBubbleBorder) {
    lines.push(`  data-assistant-bubble-border=\"${config.assistantBubbleBorder}\"`);
  }
  if (config.panelWidth) {
    lines.push(`  data-panel-width=\"${config.panelWidth}\"`);
  }
  if (config.panelMaxHeight) {
    lines.push(`  data-panel-max-height=\"${config.panelMaxHeight}\"`);
  }
  if (config.panelRadius) {
    lines.push(`  data-panel-radius=\"${config.panelRadius}\"`);
  }
  if (config.buttonRadius) {
    lines.push(`  data-button-radius=\"${config.buttonRadius}\"`);
  }
  if (typeof config.offsetX === "number") {
    lines.push(`  data-offset-x=\"${config.offsetX}\"`);
  }
  if (typeof config.offsetY === "number") {
    lines.push(`  data-offset-y=\"${config.offsetY}\"`);
  }
  if (config.inputPlaceholder) {
    lines.push(`  data-input-placeholder=\"${config.inputPlaceholder}\"`);
  }
  if (config.sendLabel) {
    lines.push(`  data-send-label=\"${config.sendLabel}\"`);
  }
  if (config.suggestions?.length) {
    lines.push(`  data-suggestions=\"${config.suggestions.join(" | ")}\"`);
  }
  if (config.greeting) {
    lines.push(`  data-greeting=\"${config.greeting}\"`);
  }
  if (typeof config.draggable === "boolean") {
    lines.push(`  data-draggable=\"${config.draggable}\"`);
  }
  if (typeof config.dragOffset === "number" && config.dragOffset !== 0) {
    lines.push(`  data-drag-offset=\"${config.dragOffset}\"`);
  }
  if (typeof config.persistPosition === "boolean") {
    lines.push(`  data-persist-position=\"${config.persistPosition}\"`);
  }
  if (config.positionKey) {
    lines.push(`  data-position-key=\"${config.positionKey}\"`);
  }
  if (config.openOnLoad) {
    lines.push(`  data-open=\"${config.openOnLoad}\"`);
  }
  if (config.showReset) {
    lines.push(`  data-show-reset=\"${config.showReset}\"`);
  }
  if (config.persist) {
    lines.push(`  data-persist=\"${config.persist}\"`);
  }
  if (config.storageKey) {
    lines.push(`  data-storage-key=\"${config.storageKey}\"`);
  }
  if (typeof config.showTypingIndicator === "boolean") {
    lines.push(`  data-show-typing-indicator=\"${config.showTypingIndicator}\"`);
  }
  if (typeof config.autoIngest === "boolean") {
    lines.push(`  data-auto-ingest=\"${config.autoIngest}\"`);
  }
  if (typeof config.closeOnOutsideClick === "boolean") {
    lines.push(`  data-close-on-outside-click=\"${config.closeOnOutsideClick}\"`);
  }
  lines.push("></script>");
  return lines.join("\n");
};

const printHelp = () => {
  console.log("Agent Plugin Bar CLI\n");
  console.log("Commands:");
  console.log("  agentbar init           Interactive setup and snippet output");
  console.log("  agentbar snippet        Print current embed snippet");
  console.log("  agentbar set <key> <v>  Update config value");
  console.log("  agentbar config         Print config JSON");
  console.log("  agentbar help           Show help\n");
  console.log("Config keys:");
  console.log(
    "  siteUrl, apiBase, depth, maxPages, siteKey, themeColor, position, title, subtitle,"
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
    "  showReset, persist, storageKey, showTypingIndicator, closeOnOutsideClick\n"
  );
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

const init = async () => {
  const config = loadConfig();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    config.siteUrl = await ask(rl, "Site URL", config.siteUrl || "https://your-site.com");
    config.apiBase = await ask(rl, "API base URL", config.apiBase);
    config.depth = Number(await ask(rl, "Crawl depth", String(config.depth)) || config.depth);
    config.maxPages = Number(
      await ask(rl, "Max pages", String(config.maxPages)) || config.maxPages
    );
    config.siteKey = await ask(rl, "Site key (optional)", config.siteKey);
    config.themeColor = await ask(rl, "Theme color", config.themeColor);
    config.position = await ask(rl, "Position (left/right/bottom)", config.position);
    config.title = await ask(rl, "Widget title", config.title);
    config.subtitle = await ask(rl, "Widget subtitle", config.subtitle);
    config.buttonLabel = await ask(rl, "Button label", config.buttonLabel);
    config.fontFamily = await ask(rl, "Font family", config.fontFamily);
    config.inputPlaceholder = await ask(rl, "Input placeholder", config.inputPlaceholder);
    config.sendLabel = await ask(rl, "Send button label", config.sendLabel);
    const suggestionInput = await ask(
      rl,
      "Suggestions (pipe or comma separated)",
      config.suggestions.join(" | ")
    );
    config.suggestions = suggestionInput
      .split(/[|,]/)
      .map((value) => value.trim())
      .filter(Boolean);
    config.greeting = await ask(rl, "Greeting (optional)", config.greeting);
    config.draggable =
      (await ask(rl, "Draggable launcher (true/false)", String(config.draggable))) === "true";
    config.persistPosition =
      (await ask(rl, "Persist position (true/false)", String(config.persistPosition))) === "true";
    config.openOnLoad = (await ask(rl, "Open on load (true/false)", String(config.openOnLoad))) === "true";
    config.showReset = (await ask(rl, "Show reset button (true/false)", String(config.showReset))) === "true";
    config.persist = (await ask(rl, "Persist chat (true/false)", String(config.persist))) === "true";
    config.showTypingIndicator =
      (await ask(rl, "Show typing indicator (true/false)", String(config.showTypingIndicator))) ===
      "true";
    config.autoIngest = (await ask(rl, "Auto ingest (true/false)", String(config.autoIngest))) === "true";
  } finally {
    rl.close();
  }

  saveConfig(config);
  console.log("\nSaved config to", configPath);
  console.log("\nEmbed snippet:\n");
  console.log(renderSnippet(config));
};

const setValue = (key, value) => {
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

  if (key === "depth" || key === "maxPages") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      console.error(`${key} must be a number.`);
      process.exit(1);
    }
    config[key] = parsed;
  } else if (key === "offsetX" || key === "offsetY") {
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
    key === "persistPosition"
  ) {
    config[key] = value === "true" || value === true;
  } else if (key === "dragOffset") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      console.error(`${key} must be a number.`);
      process.exit(1);
    }
    config[key] = parsed;
  } else if (key === "suggestions") {
    config[key] = String(value)
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else {
    config[key] = value;
  }

  saveConfig(config);
  console.log("Updated", key, "in", configPath);
};

const main = async () => {
  const [command, arg1, arg2] = process.argv.slice(2);

  switch (command) {
    case "init":
      await init();
      return;
    case "snippet": {
      const config = loadConfig();
      console.log(renderSnippet(config));
      return;
    }
    case "set":
      setValue(arg1, arg2);
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

main();
