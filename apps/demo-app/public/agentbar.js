(() => {
  const script = document.currentScript;
  const config = window.AgentBarConfig || {};
  const apiBase = (config.apiBase || script?.dataset.api || window.location.origin).replace(/\/$/, "");
  const siteUrl = config.siteUrl || script?.dataset.site || window.location.origin;
  const position = config.position || script?.dataset.position || "right";
  const title = config.title || "Site Assistant";
  const openOnLoad = Boolean(config.open ?? false);

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
    .agentbar-button { width: 48px; height: 48px; border-radius: 16px; border: 1px solid #e2e8f0; background: #ffffff; cursor: pointer; box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.35); }
    .agentbar-panel { position: absolute; right: 64px; top: 0; width: 320px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 30px 60px -45px rgba(15, 23, 42, 0.35); display: none; flex-direction: column; max-height: 70vh; }
    .agentbar-panel.open { display: flex; }
    .agentbar-panel.left { left: 64px; right: auto; }
    .agentbar-panel.bottom { left: 50%; bottom: 64px; right: auto; top: auto; transform: translateX(-50%); }
    .agentbar-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; }
    .agentbar-body { padding: 12px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .agentbar-message { padding: 8px 10px; border-radius: 12px; font-size: 12px; line-height: 1.5; border: 1px solid #e2e8f0; background: #f8fafc; color: #0f172a; }
    .agentbar-message.user { border-color: rgba(5, 150, 105, 0.3); background: rgba(5, 150, 105, 0.08); color: #064e3b; }
    .agentbar-footer { border-top: 1px solid #e2e8f0; padding: 12px 14px; display: flex; gap: 8px; }
    .agentbar-input { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; font-size: 12px; }
    .agentbar-send { border: 1px solid rgba(5, 150, 105, 0.3); background: rgba(5, 150, 105, 0.1); color: #065f46; border-radius: 10px; width: 40px; cursor: pointer; }
    .agentbar-status { font-size: 11px; color: #64748b; padding: 0 14px 10px; }
  `;

  shadow.innerHTML = `
    <style>${styles}</style>
    <div class="agentbar-root ${position}">
      <button class="agentbar-button" aria-label="Open chat">A</button>
      <div class="agentbar-panel ${position}">
        <div class="agentbar-header">
          <span>${title}</span>
          <button class="agentbar-close" aria-label="Close">X</button>
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

  const renderMessages = () => {
    body.innerHTML = "";
    state.messages.forEach((message) => {
      const item = document.createElement("div");
      item.className = `agentbar-message ${message.role}`;
      item.textContent = message.content;
      body.appendChild(item);
    });
    body.scrollTop = body.scrollHeight;
  };

  const appendMessage = (role, content) => {
    state.messages.push({ role, content });
    renderMessages();
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
        body: JSON.stringify({ url: siteUrl }),
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
          messages: state.messages.map((message) => ({
            role: message.role === "user" ? "user" : "assistant",
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        appendMessage("assistant", "Something went wrong. Try again soon.");
        state.loading = false;
        setStatus("");
        return;
      }

      const data = await response.json();
      appendMessage("assistant", data.content || "No response available.");
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
