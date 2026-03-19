(() => {
  const script = document.currentScript;
  const config = window.AgentBarConfig || {};

  const toBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return fallback;
  };

  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

  const apiBase = (config.apiBase || script?.dataset.api || window.location.origin).replace(/\/$/, "");
  const siteUrl = config.siteUrl || script?.dataset.site || window.location.origin;
  const siteKey = config.siteKey || script?.dataset.siteKey || "";
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
  const panelWidth = withUnit(config.panelWidth ?? script?.dataset.panelWidth, "320px");
  const panelMaxHeight = withUnit(config.panelMaxHeight ?? script?.dataset.panelMaxHeight, "70vh");
  const panelRadius = withUnit(config.panelRadius ?? script?.dataset.panelRadius, "16px");
  const buttonRadius = withUnit(config.buttonRadius ?? script?.dataset.buttonRadius, "16px");
  const offsetX = toNumber(config.offsetX ?? script?.dataset.offsetX, 20);
  const offsetY = toNumber(config.offsetY ?? script?.dataset.offsetY, 20);
  const maxPages = toNumber(config.maxPages ?? script?.dataset.maxPages, 15);
  const crawlDepth = toNumber(config.depth ?? script?.dataset.depth, 1);
  const accentSoft = toRgba(themeColor, 0.12);
  const accentBorder = toRgba(themeColor, 0.3);
  const accentStrong = toRgba(themeColor, 0.2);
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
    .agentbar-root.right { right: var(--agentbar-offset-x); top: 50%; transform: translateY(-50%); }
    .agentbar-root.left { left: var(--agentbar-offset-x); top: 50%; transform: translateY(-50%); }
    .agentbar-root.bottom { left: 50%; bottom: var(--agentbar-offset-y); transform: translateX(-50%); }
    .agentbar-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 48px; height: 48px; padding: 0 14px; border-radius: var(--agentbar-button-radius); border: 1px solid var(--agentbar-border); background: var(--agentbar-button-bg); cursor: pointer; font-size: 12px; color: var(--agentbar-button-text); box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.35); }
    .agentbar-button.icon-only { width: 48px; padding: 0; }
    .agentbar-icon { width: 18px; height: 18px; }
    .agentbar-button-label { font-size: 12px; letter-spacing: 0.02em; }
    .agentbar-panel { position: absolute; right: 64px; top: 0; width: var(--agentbar-panel-width); background: var(--agentbar-panel-bg); border: 1px solid var(--agentbar-border); border-radius: var(--agentbar-panel-radius); box-shadow: 0 30px 60px -45px rgba(15, 23, 42, 0.35); display: none; flex-direction: column; max-height: var(--agentbar-panel-max-height); }
    .agentbar-panel.open { display: flex; }
    .agentbar-panel.left { left: 64px; right: auto; }
    .agentbar-panel.bottom { left: 50%; bottom: calc(var(--agentbar-offset-y) + 64px); right: auto; top: auto; transform: translateX(-50%); }
    .agentbar-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--agentbar-border); font-size: 13px; color: var(--agentbar-text); }
    .agentbar-title { font-weight: 600; }
    .agentbar-subtitle { font-size: 11px; color: var(--agentbar-muted); margin-top: 2px; }
    .agentbar-body { padding: 12px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .agentbar-message { padding: 8px 10px; border-radius: 12px; font-size: 12px; line-height: 1.5; border: 1px solid var(--agentbar-border); background: #f8fafc; color: var(--agentbar-text); white-space: pre-wrap; }
    .agentbar-message.user { border-color: var(--agentbar-accent-border); background: var(--agentbar-accent-soft); color: var(--agentbar-accent-text); }
    .agentbar-footer { border-top: 1px solid var(--agentbar-border); padding: 12px 14px; display: flex; gap: 8px; }
    .agentbar-input { flex: 1; border: 1px solid var(--agentbar-border); border-radius: 10px; padding: 8px 10px; font-size: 12px; background: var(--agentbar-input-bg); color: var(--agentbar-text); }
    .agentbar-send { border: 1px solid var(--agentbar-accent-border); background: var(--agentbar-accent-strong); color: var(--agentbar-accent-text); border-radius: 10px; width: 48px; cursor: pointer; font-size: 11px; }
    .agentbar-status { font-size: 11px; color: var(--agentbar-muted); padding: 0 14px 10px; }
    .agentbar-close { border: 1px solid var(--agentbar-border); background: #f1f5f9; color: var(--agentbar-text); border-radius: 10px; font-size: 11px; padding: 4px 8px; cursor: pointer; }
  `;

  shadow.innerHTML = `
    <style>${styles}</style>
    <div class="agentbar-root ${position}">
      <button class="agentbar-button ${buttonLabel ? "" : "icon-only"}" aria-label="Open chat">
        ${bubbleIcon}
        ${buttonLabel ? `<span class="agentbar-button-label">${buttonLabel}</span>` : ""}
      </button>
      <div class="agentbar-panel ${position}">
        <div class="agentbar-header">
          <div>
            <div class="agentbar-title">${title}</div>
            <div class="agentbar-subtitle">${subtitle}</div>
          </div>
          <button class="agentbar-close" aria-label="Close">Close</button>
        </div>
        <div class="agentbar-body"></div>
        <div class="agentbar-status"></div>
        <div class="agentbar-footer">
          <input class="agentbar-input" placeholder="Type a message" />
          <button class="agentbar-send">Send</button>
        </div>
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

  if (!root || !panel || !body || !status || !input || !send || !openButton || !closeButton) {
    return;
  }

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
  };

  const setOpen = (value) => {
    state.open = value;
    panel.classList.toggle("open", value);
  };

  const setStatus = (text) => {
    status.textContent = text || "";
  };

  const appendMessage = (role, content) => {
    const message = { role, content };
    state.messages.push(message);
    const item = document.createElement("div");
    item.className = `agentbar-message ${role}`;
    item.textContent = content;
    body.appendChild(item);
    body.scrollTop = body.scrollHeight;
    return { message, item };
  };

  const ingest = async () => {
    if (state.ingested) {
      return;
    }
    try {
      setStatus("Indexing site content...");
      await fetch(`${apiBase}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: siteUrl,
          depth: crawlDepth,
          maxPages,
          siteKey: siteKey || undefined,
        }),
      });
      state.ingested = true;
      setStatus("Ready to help.");
    } catch (error) {
      setStatus("Failed to ingest site content.");
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
        appendMessage("assistant", "Something went wrong. Try again soon.");
        state.loading = false;
        setStatus("");
        return;
      }

      const { message, item } = appendMessage("assistant", "");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              item.textContent = message.content;
              body.scrollTop = body.scrollHeight;
            }
          } catch (_error) {
            // Ignore parse errors.
          }
        });
      }

      state.loading = false;
      setStatus("");
    } catch (error) {
      appendMessage("assistant", "Could not reach the assistant.");
      state.loading = false;
      setStatus("");
    }
  };

  openButton.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));
  send.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
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

  if (openOnLoad) {
    setOpen(true);
  }

  if (autoIngest) {
    ingest();
  }
})();
