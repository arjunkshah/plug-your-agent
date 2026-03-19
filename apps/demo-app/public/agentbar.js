(() => {
  const script = document.currentScript;
  const config = window.AgentBarConfig || {};

  const apiBase = (config.apiBase || script?.dataset.api || window.location.origin).replace(/\/$/, "");
  const siteUrl = config.siteUrl || script?.dataset.site || window.location.origin;
  const siteKey = config.siteKey || script?.dataset.siteKey || "";
  const position = config.position || script?.dataset.position || "right";
  const title = config.title || script?.dataset.title || "Site Assistant";
  const subtitle = config.subtitle || script?.dataset.subtitle || "Ask anything about this site.";
  const openOnLoad = Boolean(config.open ?? script?.dataset.open === "true");
  const themeColor = config.themeColor || script?.dataset.themeColor || "#059669";
  const buttonLabel = config.buttonLabel || script?.dataset.buttonLabel || "Ask";
  const maxPages = Number(config.maxPages || script?.dataset.maxPages || 15);
  const crawlDepth = Number(config.depth || script?.dataset.depth || 1);

  const host = document.createElement("div");
  host.setAttribute("data-agentbar", "");
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const styles = `
    :host { all: initial; }
    .agentbar-root { position: fixed; z-index: 2147483646; font-family: ui-sans-serif, system-ui, -apple-system; }
    .agentbar-root.right { right: 20px; top: 50%; transform: translateY(-50%); }
    .agentbar-root.left { left: 20px; top: 50%; transform: translateY(-50%); }
    .agentbar-root.bottom { left: 50%; bottom: 20px; transform: translateX(-50%); }
    .agentbar-button { display: inline-flex; align-items: center; justify-content: center; min-width: 48px; height: 48px; padding: 0 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: #ffffff; cursor: pointer; font-size: 12px; color: #0f172a; box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.35); }
    .agentbar-panel { position: absolute; right: 64px; top: 0; width: 320px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 30px 60px -45px rgba(15, 23, 42, 0.35); display: none; flex-direction: column; max-height: 70vh; }
    .agentbar-panel.open { display: flex; }
    .agentbar-panel.left { left: 64px; right: auto; }
    .agentbar-panel.bottom { left: 50%; bottom: 64px; right: auto; top: auto; transform: translateX(-50%); }
    .agentbar-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; }
    .agentbar-title { font-weight: 600; }
    .agentbar-subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
    .agentbar-body { padding: 12px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .agentbar-message { padding: 8px 10px; border-radius: 12px; font-size: 12px; line-height: 1.5; border: 1px solid #e2e8f0; background: #f8fafc; color: #0f172a; white-space: pre-wrap; }
    .agentbar-message.user { border-color: ${themeColor}33; background: ${themeColor}14; color: #064e3b; }
    .agentbar-footer { border-top: 1px solid #e2e8f0; padding: 12px 14px; display: flex; gap: 8px; }
    .agentbar-input { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; font-size: 12px; }
    .agentbar-send { border: 1px solid ${themeColor}55; background: ${themeColor}1a; color: #064e3b; border-radius: 10px; width: 48px; cursor: pointer; font-size: 11px; }
    .agentbar-status { font-size: 11px; color: #64748b; padding: 0 14px 10px; }
    .agentbar-close { border: 1px solid #e2e8f0; background: #f1f5f9; color: #334155; border-radius: 10px; font-size: 11px; padding: 4px 8px; cursor: pointer; }
  `;

  shadow.innerHTML = `
    <style>${styles}</style>
    <div class="agentbar-root ${position}">
      <button class="agentbar-button" aria-label="Open chat">${buttonLabel}</button>
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
          <input class="agentbar-input" placeholder="Ask a question" />
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

  if (openOnLoad) {
    setOpen(true);
  }

  ingest();
})();
