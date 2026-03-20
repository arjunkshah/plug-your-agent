;(async () => {
  const script = document.currentScript;
  let config = window.AgentBarConfig || {};

  const toBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return fallback;
  };

  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toList = (value, fallback) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/[|,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return fallback;
  };

  const withUnit = (value, fallback) => {
    if (typeof value === "number") {
      return `${value}px`;
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    return fallback;
  };

  const toRgba = (hex, alpha) => {
    if (typeof hex !== "string") return `rgba(5, 150, 105, ${alpha})`;
    const clean = hex.replace("#", "").trim();
    const normalized =
      clean.length === 3
        ? clean
            .split("")
            .map((char) => char + char)
            .join("")
        : clean;
    if (normalized.length !== 6) {
      return `rgba(5, 150, 105, ${alpha})`;
    }
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((value) => Number.isNaN(value))) {
      return `rgba(5, 150, 105, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const scriptOrigin = (() => {
    try {
      return script?.src ? new URL(script.src).origin : window.location.origin;
    } catch (_error) {
      return window.location.origin;
    }
  })();
  const seedApiBase = (config.apiBase || script?.dataset.api || scriptOrigin).replace(/\/$/, "");
  const seedSiteKey = config.siteKey || script?.dataset.siteKey || "";
  if (seedSiteKey) {
    try {
      const response = await fetch(
        `${seedApiBase}/api/config?siteKey=${encodeURIComponent(seedSiteKey)}`
      );
      if (response.ok) {
        const data = await response.json();
        const remoteConfig =
          data?.config && typeof data.config === "object" ? data.config : data;
        config = { ...remoteConfig, ...config };
      }
    } catch (_error) {
      // Ignore remote config failures.
    }
  }

  const apiBase = (config.apiBase || script?.dataset.api || seedApiBase).replace(/\/$/, "");
  const rawSiteUrl = config.siteUrl || script?.dataset.site || window.location.origin;
  const normalizeSiteUrl = (value) => {
    if (typeof value !== "string") {
      return window.location.origin;
    }
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return `https://${value}`;
  };
  const siteUrl = normalizeSiteUrl(rawSiteUrl);
  const siteKey = config.siteKey || script?.dataset.siteKey || seedSiteKey || "";
  const position = config.position || script?.dataset.position || "right";
  const title = config.title || script?.dataset.title || "Site Assistant";
  const subtitle = config.subtitle || script?.dataset.subtitle || "Get answers from your site.";
  const openOnLoad = toBoolean(
    config.openOnLoad ?? config.open ?? script?.dataset.open,
    false
  );
  const autoIngest = toBoolean(config.autoIngest ?? script?.dataset.autoIngest, true);
  const closeOnOutsideClick = toBoolean(
    config.closeOnOutsideClick ?? script?.dataset.closeOnOutsideClick,
    true
  );
  const themeColor = config.themeColor || script?.dataset.themeColor || "#059669";
  const buttonLabel = config.buttonLabel || script?.dataset.buttonLabel || "";
  const fontFamily =
    config.fontFamily ||
    script?.dataset.fontFamily ||
    "ui-sans-serif, system-ui, -apple-system";
  const panelBackground = config.panelBackground || script?.dataset.panelBackground || "#ffffff";
  const textColor = config.textColor || script?.dataset.textColor || "#0f172a";
  const mutedTextColor = config.mutedTextColor || script?.dataset.mutedTextColor || "#64748b";
  const borderColor = config.borderColor || script?.dataset.borderColor || "#e2e8f0";
  const buttonBackground = config.buttonBackground || script?.dataset.buttonBackground || "#ffffff";
  const buttonTextColor = config.buttonTextColor || script?.dataset.buttonTextColor || textColor;
  const accentTextColor = config.accentTextColor || script?.dataset.accentTextColor || themeColor;
  const buttonShadow =
    config.buttonShadow ||
    script?.dataset.buttonShadow ||
    "0 18px 40px -28px rgba(15, 23, 42, 0.35)";
  const panelShadow =
    config.panelShadow ||
    script?.dataset.panelShadow ||
    "0 30px 60px -45px rgba(15, 23, 42, 0.35)";
  const badgeLabel = config.badgeLabel || script?.dataset.badgeLabel || "";
  const badgeBackground =
    config.badgeBackground || script?.dataset.badgeBackground || themeColor;
  const badgeTextColor =
    config.badgeTextColor || script?.dataset.badgeTextColor || "#ffffff";
  const panelWidth = withUnit(config.panelWidth ?? script?.dataset.panelWidth, "320px");
  const panelMaxHeight = withUnit(config.panelMaxHeight ?? script?.dataset.panelMaxHeight, "70vh");
  const panelRadius = withUnit(config.panelRadius ?? script?.dataset.panelRadius, "16px");
  const buttonRadius = withUnit(config.buttonRadius ?? script?.dataset.buttonRadius, "16px");
  const inputPlaceholder =
    config.inputPlaceholder || script?.dataset.inputPlaceholder || "Type a message";
  const sendLabel = config.sendLabel || script?.dataset.sendLabel || "Send";
  const suggestions = toList(
    config.suggestions || script?.dataset.suggestions,
    ["Search pricing", "Explain a feature", "Draft homepage copy"]
  );
  const greeting = config.greeting || script?.dataset.greeting || "";
  const showReset = toBoolean(config.showReset ?? script?.dataset.showReset, false);
  const persist = toBoolean(config.persist ?? script?.dataset.persist, false);
  const showExport = toBoolean(config.showExport ?? script?.dataset.showExport, false);
  const exportLabel = config.exportLabel || script?.dataset.exportLabel || "Copy";
  const showScrollButton = toBoolean(
    config.showScrollButton ?? script?.dataset.showScrollButton,
    true
  );
  const scrollLabel = config.scrollLabel || script?.dataset.scrollLabel || "Scroll";
  const showMinimize = toBoolean(config.showMinimize ?? script?.dataset.showMinimize, false);
  const minimizedOnLoad = toBoolean(
    config.minimizedOnLoad ?? script?.dataset.minimizedOnLoad,
    false
  );
  const minimizeLabel = config.minimizeLabel || script?.dataset.minimizeLabel || "Minimize";
  const expandLabel = config.expandLabel || script?.dataset.expandLabel || "Expand";
  const showTimestamps = toBoolean(
    config.showTimestamps ?? script?.dataset.showTimestamps,
    false
  );
  const timestampLocale = config.timestampLocale || script?.dataset.timestampLocale || "";
  const autoScroll = toBoolean(config.autoScroll ?? script?.dataset.autoScroll, true);
  const autoScrollThreshold = toNumber(
    config.autoScrollThreshold ?? script?.dataset.autoScrollThreshold,
    24
  );
  const messageMaxWidth = withUnit(
    config.messageMaxWidth ?? script?.dataset.messageMaxWidth,
    "85%"
  );
  const launcherTooltip = config.launcherTooltip || script?.dataset.launcherTooltip || "";
  const storageKey =
    config.storageKey || script?.dataset.storageKey || `agentbar:${siteKey || siteUrl}`;
  const showTypingIndicator = toBoolean(
    config.showTypingIndicator ?? script?.dataset.showTypingIndicator,
    true
  );
  const offsetX = toNumber(config.offsetX ?? script?.dataset.offsetX, 20);
  const offsetY = toNumber(config.offsetY ?? script?.dataset.offsetY, 20);
  const maxPages = toNumber(config.maxPages ?? script?.dataset.maxPages, 15);
  const crawlDepth = toNumber(config.depth ?? script?.dataset.depth, 1);
  const accentSoft = toRgba(themeColor, 0.12);
  const accentBorder = toRgba(themeColor, 0.3);
  const accentStrong = toRgba(themeColor, 0.2);
  const userBubbleBackground =
    config.userBubbleBackground || script?.dataset.userBubbleBackground || accentSoft;
  const userBubbleText = config.userBubbleText || script?.dataset.userBubbleText || accentTextColor;
  const userBubbleBorder =
    config.userBubbleBorder || script?.dataset.userBubbleBorder || accentBorder;
  const assistantBubbleBackground =
    config.assistantBubbleBackground || script?.dataset.assistantBubbleBackground || "#f8fafc";
  const assistantBubbleText =
    config.assistantBubbleText || script?.dataset.assistantBubbleText || textColor;
  const assistantBubbleBorder =
    config.assistantBubbleBorder || script?.dataset.assistantBubbleBorder || borderColor;
  const draggable = toBoolean(config.draggable ?? script?.dataset.draggable, true);
  const persistPosition = toBoolean(
    config.persistPosition ?? script?.dataset.persistPosition,
    persist
  );
  const positionKey =
    config.positionKey || script?.dataset.positionKey || `${storageKey}:position`;
  const dragOffset = toNumber(config.dragOffset ?? script?.dataset.dragOffset, 0);
  const bubbleIcon = `
    <svg class="agentbar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M7.2 18.4l-3.2 1.6 1.6-3.2a7.5 7.5 0 111.6 1.6z"
      />
    </svg>
  `;

  const host = document.createElement("div");
  host.setAttribute("data-agentbar", "");
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const styles = `
    :host { all: initial; }
    .agentbar-root { position: fixed; z-index: 2147483646; font-family: var(--agentbar-font); color: var(--agentbar-text); }
    .agentbar-root.right { right: var(--agentbar-offset-x); top: calc(50% + var(--agentbar-drag-offset, 0px)); transform: translateY(-50%); }
    .agentbar-root.left { left: var(--agentbar-offset-x); top: calc(50% + var(--agentbar-drag-offset, 0px)); transform: translateY(-50%); }
    .agentbar-root.bottom { left: 50%; bottom: var(--agentbar-offset-y); transform: translateX(-50%); }
    .agentbar-button { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 48px; height: 48px; padding: 0 14px; border-radius: var(--agentbar-button-radius); border: 1px solid var(--agentbar-border); background: var(--agentbar-button-bg); cursor: pointer; font-size: 12px; color: var(--agentbar-button-text); box-shadow: var(--agentbar-button-shadow); transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .agentbar-button:active { transform: translateY(1px); }
    .agentbar-badge { position: absolute; top: -6px; right: -6px; background: var(--agentbar-badge-bg); color: var(--agentbar-badge-text); font-size: 10px; padding: 2px 6px; border-radius: 999px; border: 1px solid rgba(15, 23, 42, 0.1); }
    .agentbar-button.icon-only { width: 48px; padding: 0; }
    .agentbar-icon { width: 18px; height: 18px; }
    .agentbar-button-label { font-size: 12px; letter-spacing: 0.02em; }
    .agentbar-panel { position: absolute; right: 64px; top: 0; width: var(--agentbar-panel-width); background: var(--agentbar-panel-bg); border: 1px solid var(--agentbar-border); border-radius: var(--agentbar-panel-radius); box-shadow: var(--agentbar-panel-shadow); display: flex; flex-direction: column; max-height: var(--agentbar-panel-max-height); opacity: 0; transform: translateY(10px) scale(0.98); pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease; }
    .agentbar-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
    .agentbar-panel.minimized .agentbar-body,
    .agentbar-panel.minimized .agentbar-status,
    .agentbar-panel.minimized .agentbar-footer,
    .agentbar-panel.minimized .agentbar-scroll { display: none; }
    .agentbar-panel.left { left: 64px; right: auto; }
    .agentbar-panel.bottom { left: 50%; bottom: calc(var(--agentbar-offset-y) + 64px); right: auto; top: auto; transform: translateX(-50%); }
    .agentbar-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--agentbar-border); font-size: 13px; color: var(--agentbar-text); }
    .agentbar-header.draggable { cursor: grab; }
    .agentbar-header.draggable:active { cursor: grabbing; }
    .agentbar-title { font-weight: 600; }
    .agentbar-subtitle { font-size: 11px; color: var(--agentbar-muted); margin-top: 2px; }
    .agentbar-body { padding: 12px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
    .agentbar-empty { border: 1px dashed var(--agentbar-border); border-radius: 14px; padding: 12px; background: #f8fafc; }
    .agentbar-empty-title { font-size: 12px; font-weight: 600; }
    .agentbar-empty-subtitle { font-size: 11px; color: var(--agentbar-muted); margin-top: 4px; }
    .agentbar-suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .agentbar-suggestion { border: 1px solid var(--agentbar-border); background: #ffffff; color: var(--agentbar-text); border-radius: 999px; padding: 6px 10px; font-size: 11px; cursor: pointer; }
    .agentbar-message { padding: 8px 10px; border-radius: 12px; font-size: 12px; line-height: 1.5; border: 1px solid var(--agentbar-assistant-border); background: var(--agentbar-assistant-bg); color: var(--agentbar-assistant-text); white-space: pre-wrap; max-width: var(--agentbar-message-max-width); align-self: flex-start; }
    .agentbar-message.user { border-color: var(--agentbar-user-border); background: var(--agentbar-user-bg); color: var(--agentbar-user-text); align-self: flex-end; }
    .agentbar-text { display: block; }
    .agentbar-timestamp { display: block; font-size: 10px; color: var(--agentbar-muted); margin-top: 4px; }
    .agentbar-typing { display: flex; gap: 4px; align-items: center; }
    .agentbar-typing span { width: 6px; height: 6px; border-radius: 999px; background: var(--agentbar-muted); opacity: 0.4; animation: agentbar-dot 1.1s infinite; }
    .agentbar-typing span:nth-child(2) { animation-delay: 0.2s; }
    .agentbar-typing span:nth-child(3) { animation-delay: 0.4s; }
    .agentbar-footer { border-top: 1px solid var(--agentbar-border); padding: 12px 14px; display: flex; gap: 8px; }
    .agentbar-input { flex: 1; border: 1px solid var(--agentbar-border); border-radius: 10px; padding: 8px 10px; font-size: 12px; background: var(--agentbar-input-bg); color: var(--agentbar-text); }
    .agentbar-input:focus { outline: none; border-color: var(--agentbar-accent-border); }
    .agentbar-send { border: 1px solid var(--agentbar-accent-border); background: var(--agentbar-accent-strong); color: var(--agentbar-accent-text); border-radius: 10px; width: 48px; cursor: pointer; font-size: 11px; }
    .agentbar-status { font-size: 11px; color: var(--agentbar-muted); padding: 0 14px 10px; }
    .agentbar-close { border: 1px solid var(--agentbar-border); background: #f1f5f9; color: var(--agentbar-text); border-radius: 10px; font-size: 11px; padding: 4px 8px; cursor: pointer; }
    .agentbar-reset { border: 1px solid var(--agentbar-border); background: #ffffff; color: var(--agentbar-text); border-radius: 10px; font-size: 11px; padding: 4px 8px; cursor: pointer; }
    .agentbar-export { border: 1px solid var(--agentbar-border); background: #ffffff; color: var(--agentbar-text); border-radius: 10px; font-size: 11px; padding: 4px 8px; cursor: pointer; }
    .agentbar-minimize { border: 1px solid var(--agentbar-border); background: #ffffff; color: var(--agentbar-text); border-radius: 10px; font-size: 11px; padding: 4px 8px; cursor: pointer; }
    .agentbar-scroll { position: absolute; right: 16px; bottom: 64px; display: none; align-items: center; gap: 6px; border: 1px solid var(--agentbar-border); background: #ffffff; color: var(--agentbar-text); border-radius: 999px; font-size: 11px; padding: 6px 12px; cursor: pointer; box-shadow: var(--agentbar-panel-shadow); }
    .agentbar-scroll.show { display: inline-flex; }
    @keyframes agentbar-dot { 0%, 80%, 100% { transform: translateY(0); opacity: 0.3; } 40% { transform: translateY(-3px); opacity: 0.8; } }
  `;

  shadow.innerHTML = `
    <style>${styles}</style>
    <div class="agentbar-root ${position}">
      <button class="agentbar-button ${buttonLabel ? "" : "icon-only"}" aria-label="Open chat">
        ${bubbleIcon}
        ${buttonLabel ? `<span class="agentbar-button-label">${buttonLabel}</span>` : ""}
        ${badgeLabel ? `<span class="agentbar-badge">${badgeLabel}</span>` : ""}
      </button>
      <div class="agentbar-panel ${position}">
        <div class="agentbar-header">
          <div>
            <div class="agentbar-title">${title}</div>
            <div class="agentbar-subtitle">${subtitle}</div>
          </div>
          <div style="display:flex; gap:6px;">
            ${showReset ? `<button class="agentbar-reset" aria-label="Reset">Reset</button>` : ""}
            ${showExport ? `<button class="agentbar-export" aria-label="Export">${exportLabel}</button>` : ""}
            ${showMinimize ? `<button class="agentbar-minimize" aria-label="Minimize">${minimizeLabel}</button>` : ""}
            <button class="agentbar-close" aria-label="Close">Close</button>
          </div>
        </div>
        <div class="agentbar-body"></div>
        <div class="agentbar-status"></div>
        <div class="agentbar-footer">
          <input class="agentbar-input" placeholder="${inputPlaceholder}" />
          <button class="agentbar-send">${sendLabel}</button>
        </div>
        <button class="agentbar-scroll" aria-label="Scroll to bottom">${scrollLabel}</button>
      </div>
    </div>
  `;

  const root = shadow.querySelector(".agentbar-root");
  const panel = shadow.querySelector(".agentbar-panel");
  const body = shadow.querySelector(".agentbar-body");
  const status = shadow.querySelector(".agentbar-status");
  const input = shadow.querySelector(".agentbar-input");
  const send = shadow.querySelector(".agentbar-send");
  const openButton = shadow.querySelector(".agentbar-button");
  const closeButton = shadow.querySelector(".agentbar-close");
  const resetButton = shadow.querySelector(".agentbar-reset");
  const minimizeButton = shadow.querySelector(".agentbar-minimize");
  const header = shadow.querySelector(".agentbar-header");
  const exportButton = shadow.querySelector(".agentbar-export");
  const scrollButton = shadow.querySelector(".agentbar-scroll");

  if (!root || !panel || !body || !status || !input || !send || !openButton || !closeButton) {
    return;
  }

  const emptyState = document.createElement("div");
  emptyState.className = "agentbar-empty";
  emptyState.innerHTML = `
    <div class="agentbar-empty-title">Start a new conversation</div>
    <div class="agentbar-empty-subtitle">Try one of these prompts to get started.</div>
    <div class="agentbar-suggestions"></div>
  `;

  const suggestionsContainer = emptyState.querySelector(".agentbar-suggestions");
  if (suggestionsContainer) {
    suggestions.forEach((suggestion) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "agentbar-suggestion";
      chip.textContent = suggestion;
      chip.addEventListener("click", () => {
        input.value = suggestion;
        sendMessage();
      });
      suggestionsContainer.appendChild(chip);
    });
  }

  body.appendChild(emptyState);

  root.style.setProperty("--agentbar-font", fontFamily);
  root.style.setProperty("--agentbar-accent", themeColor);
  root.style.setProperty("--agentbar-accent-soft", accentSoft);
  root.style.setProperty("--agentbar-accent-border", accentBorder);
  root.style.setProperty("--agentbar-accent-strong", accentStrong);
  root.style.setProperty("--agentbar-accent-text", themeColor);
  root.style.setProperty("--agentbar-panel-bg", panelBackground);
  root.style.setProperty("--agentbar-text", textColor);
  root.style.setProperty("--agentbar-muted", mutedTextColor);
  root.style.setProperty("--agentbar-border", borderColor);
  root.style.setProperty("--agentbar-button-bg", buttonBackground);
  root.style.setProperty("--agentbar-button-text", buttonTextColor);
  root.style.setProperty("--agentbar-input-bg", panelBackground);
  root.style.setProperty("--agentbar-accent-text", accentTextColor);
  root.style.setProperty("--agentbar-button-shadow", buttonShadow);
  root.style.setProperty("--agentbar-panel-shadow", panelShadow);
  root.style.setProperty("--agentbar-badge-bg", badgeBackground);
  root.style.setProperty("--agentbar-badge-text", badgeTextColor);
  root.style.setProperty("--agentbar-user-bg", userBubbleBackground);
  root.style.setProperty("--agentbar-user-text", userBubbleText);
  root.style.setProperty("--agentbar-user-border", userBubbleBorder);
  root.style.setProperty("--agentbar-assistant-bg", assistantBubbleBackground);
  root.style.setProperty("--agentbar-assistant-text", assistantBubbleText);
  root.style.setProperty("--agentbar-assistant-border", assistantBubbleBorder);
  root.style.setProperty("--agentbar-message-max-width", messageMaxWidth);
  root.style.setProperty("--agentbar-panel-width", panelWidth);
  root.style.setProperty("--agentbar-panel-max-height", panelMaxHeight);
  root.style.setProperty("--agentbar-panel-radius", panelRadius);
  root.style.setProperty("--agentbar-button-radius", buttonRadius);
  root.style.setProperty("--agentbar-offset-x", `${offsetX}px`);
  root.style.setProperty("--agentbar-offset-y", `${offsetY}px`);

  const state = {
    open: openOnLoad,
    messages: [],
    ingested: false,
    loading: false,
    greeted: false,
    minimized: minimizedOnLoad,
    snapshotSent: false,
  };

  if (launcherTooltip) {
    openButton.title = launcherTooltip;
  }

  let dragOffsetY = dragOffset;
  const clampOffset = (value) => {
    const rootHeight = root.getBoundingClientRect().height || 48;
    const minTop = 12 + rootHeight / 2;
    const maxTop = window.innerHeight - 12 - rootHeight / 2;
    const desiredTop = window.innerHeight / 2 + value;
    const clampedTop = Math.min(Math.max(desiredTop, minTop), maxTop);
    return clampedTop - window.innerHeight / 2;
  };

  const applyDragOffset = (value) => {
    dragOffsetY = clampOffset(value);
    root.style.setProperty("--agentbar-drag-offset", `${dragOffsetY}px`);
    if (persistPosition) {
      try {
        localStorage.setItem(positionKey, String(dragOffsetY));
      } catch (_error) {
        // ignore
      }
    }
  };

  const loadPersisted = () => {
    if (!persist) {
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.messages)) {
        state.messages = parsed.messages;
      }
      if (typeof parsed?.open === "boolean") {
        state.open = parsed.open;
      }
      if (typeof parsed?.minimized === "boolean") {
        state.minimized = parsed.minimized;
      }
    } catch (_error) {
      // ignore
    }
  };

  const loadPersistedPosition = () => {
    if (!persistPosition) {
      return;
    }
    try {
      const raw = localStorage.getItem(positionKey);
      if (raw == null) {
        return;
      }
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        dragOffsetY = parsed;
      }
    } catch (_error) {
      // ignore
    }
  };

  const savePersisted = () => {
    if (!persist) {
      return;
    }
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ messages: state.messages, open: state.open, minimized: state.minimized })
      );
    } catch (_error) {
      // ignore
    }
  };

  loadPersisted();
  loadPersistedPosition();
  applyDragOffset(dragOffsetY);

  const setOpen = (value) => {
    state.open = value;
    panel.classList.toggle("open", value);
    panel.classList.toggle("minimized", state.minimized);
    openButton.setAttribute("aria-expanded", value ? "true" : "false");
    if (value) {
      requestAnimationFrame(() => {
        input.focus();
      });
      if (autoIngest) {
        ingest();
      }
      if (greeting && !state.greeted && state.messages.length === 0) {
        appendMessage("assistant", greeting);
        state.greeted = true;
      }
    }
    savePersisted();
  };

  const setMinimized = (value) => {
    state.minimized = value;
    panel.classList.toggle("minimized", value);
    if (minimizeButton) {
      minimizeButton.textContent = value ? expandLabel : minimizeLabel;
    }
    savePersisted();
  };

  const setStatus = (text) => {
    status.textContent = text || "";
  };

  const formatTimestamp = (value) => {
    const date = new Date(value);
    return date.toLocaleTimeString(timestampLocale || undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shouldAutoScroll = () => {
    if (!autoScroll) {
      return false;
    }
    return body.scrollHeight - body.scrollTop - body.clientHeight < autoScrollThreshold;
  };

  const createMessageNode = (message) => {
    const item = document.createElement("div");
    item.className = `agentbar-message ${message.role}`;
    const content = document.createElement("span");
    content.className = "agentbar-text";
    content.textContent = message.content;
    item.appendChild(content);
    if (showTimestamps) {
      const time = document.createElement("span");
      time.className = "agentbar-timestamp";
      time.textContent = formatTimestamp(message.createdAt || Date.now());
      item.appendChild(time);
    }
    return { item, content };
  };

  const appendMessage = (role, content) => {
    const message = { role, content, createdAt: Date.now() };
    state.messages.push(message);
    emptyState.style.display = "none";
    const shouldScroll = shouldAutoScroll();
    const { item, content: contentNode } = createMessageNode(message);
    body.appendChild(item);
    if (shouldScroll) {
      body.scrollTop = body.scrollHeight;
    }
    savePersisted();
    updateScrollButton();
    return { message, item, contentNode };
  };

  const renderHistory = () => {
    body.innerHTML = "";
    body.appendChild(emptyState);
    if (!state.messages.length) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";
    state.messages.forEach((message) => {
      const { item } = createMessageNode(message);
      body.appendChild(item);
    });
  };

  const typingEl = document.createElement("div");
  typingEl.className = "agentbar-message agentbar-typing";
  typingEl.innerHTML = "<span></span><span></span><span></span>";

  const updateScrollButton = () => {
    if (!scrollButton || !showScrollButton) {
      return;
    }
    const threshold = 24;
    const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < threshold;
    scrollButton.classList.toggle("show", !atBottom);
  };

  const sendSnapshot = async () => {
    if (state.snapshotSent) {
      return;
    }
    const text = document.body?.innerText || "";
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) {
      state.snapshotSent = true;
      return;
    }
    state.snapshotSent = true;
    try {
      await fetch(`${apiBase}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: siteUrl,
          pageUrl: window.location.href,
          pageTitle: document.title,
          pageText: cleaned.slice(0, 12000),
          siteKey: siteKey || undefined,
        }),
      });
    } catch (_error) {
      state.snapshotSent = false;
    }
  };

  const ingest = async () => {
    if (state.ingested) {
      return;
    }
    try {
      setStatus("Indexing site content...");
      await sendSnapshot();
      const response = await fetch(`${apiBase}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: siteUrl,
          depth: crawlDepth,
          maxPages,
          siteKey: siteKey || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.error || "Failed to ingest site content.";
        setStatus(message);
        return;
      }
      state.ingested = true;
      setStatus("Ready to help.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to ingest site content.";
      setStatus(message);
    }
  };

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text || state.loading) {
      return;
    }

    input.value = "";
    appendMessage("user", text);
    state.loading = true;
    setStatus("Thinking...");
    if (showTypingIndicator) {
      const shouldScroll = shouldAutoScroll();
      body.appendChild(typingEl);
      if (shouldScroll) {
        body.scrollTop = body.scrollHeight;
      }
    }

    try {
      await ingest();
      const response = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl,
          siteKey: siteKey || undefined,
          stream: true,
          messages: state.messages.map((message) => ({
            role: message.role === "user" ? "user" : "assistant",
            content: message.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        if (typingEl.parentElement) {
          typingEl.remove();
        }
        const data = await response.json().catch(() => ({}));
        const message =
          typeof data?.error === "string" && data.error.trim()
            ? data.error.trim()
            : "Something went wrong. Try again soon.";
        appendMessage("assistant", message);
        state.loading = false;
        setStatus("");
        updateScrollButton();
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        if (typingEl.parentElement) {
          typingEl.remove();
        }
        const data = await response.json().catch(() => ({}));
        const content =
          typeof data?.content === "string" && data.content.trim()
            ? data.content.trim()
            : "Something went wrong. Try again soon.";
        appendMessage("assistant", content);
        state.loading = false;
        setStatus("");
        updateScrollButton();
        return;
      }

      const { message, contentNode } = appendMessage("assistant", "");
      if (typingEl.parentElement) {
        typingEl.remove();
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const shouldScroll = shouldAutoScroll();
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        parts.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) {
            return;
          }
          const payload = trimmed.replace(/^data:\s*/, "");
          if (payload === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.token) {
              message.content += parsed.token;
              contentNode.textContent = message.content;
              if (shouldScroll) {
                body.scrollTop = body.scrollHeight;
              }
            }
          } catch (_error) {
            // Ignore parse errors.
          }
        });
      }

      state.loading = false;
      setStatus("");
      updateScrollButton();
    } catch (error) {
      if (typingEl.parentElement) {
        typingEl.remove();
      }
      appendMessage("assistant", "Could not reach the assistant.");
      state.loading = false;
      setStatus("");
      updateScrollButton();
    }
  };

  openButton.addEventListener("click", () => setOpen(!state.open));
  closeButton.addEventListener("click", () => setOpen(false));
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      state.messages = [];
      body.innerHTML = "";
      body.appendChild(emptyState);
      emptyState.style.display = "block";
      state.greeted = false;
      savePersisted();
    });
  }
  if (minimizeButton) {
    minimizeButton.addEventListener("click", () => setMinimized(!state.minimized));
  }
  if (exportButton) {
    exportButton.addEventListener("click", async () => {
      const transcript = state.messages
        .map((message) => {
          const role = message.role === "user" ? "User" : "Assistant";
          const stamp = showTimestamps
            ? `[${formatTimestamp(message.createdAt || Date.now())}] `
            : "";
          return `${stamp}${role}: ${message.content}`;
        })
        .join("\n");
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(transcript);
          setStatus("Transcript copied.");
        } else {
          setStatus("Clipboard not available.");
        }
      } catch (_error) {
        setStatus("Copy failed.");
      }
      setTimeout(() => setStatus(""), 1500);
    });
  }
  if (scrollButton) {
    scrollButton.addEventListener("click", () => {
      body.scrollTop = body.scrollHeight;
      updateScrollButton();
    });
  }
  send.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  if (closeOnOutsideClick) {
    document.addEventListener("click", (event) => {
      if (!state.open) {
        return;
      }
      const path = event.composedPath ? event.composedPath() : [];
      if (!path.includes(host)) {
        setOpen(false);
      }
    });
  }

  if (draggable && header && (position === "left" || position === "right")) {
    header.classList.add("draggable");
  }
  const dragState = { active: false, startY: 0, startOffset: 0 };
  const handlePointerMove = (event) => {
    if (!dragState.active) {
      return;
    }
    const nextOffset = dragState.startOffset + (event.clientY - dragState.startY);
    applyDragOffset(nextOffset);
  };
  const stopDragging = () => {
    dragState.active = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", stopDragging);
  };

  if (draggable && header && (position === "left" || position === "right")) {
    header.addEventListener("pointerdown", (event) => {
      if (event.target && event.target.closest("button")) {
        return;
      }
      dragState.active = true;
      dragState.startY = event.clientY;
      dragState.startOffset = dragOffsetY;
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", stopDragging);
    });
  }

  window.addEventListener("resize", () => applyDragOffset(dragOffsetY));

  renderHistory();
  setMinimized(state.minimized);
  setOpen(state.open);
  updateScrollButton();

  if (openOnLoad) {
    setOpen(true);
  }

  if (autoIngest) {
    ingest();
  }
  body.addEventListener("scroll", updateScrollButton);
})();
