import { useState } from "react";
import { AgentBar } from "@agentbar/react";
import { createProxyProvider } from "@agentbar/runtime";
import type { HostApi, HostApiSchema } from "@agentbar/runtime";

const apiBase = import.meta.env.VITE_AGENTBAR_API_BASE || "";
const apiBaseDisplay = apiBase || window.location.origin;
const llmProvider = apiBase
  ? createProxyProvider({
      endpoint: `${apiBase}/api/chat`,
      siteUrl: window.location.origin,
    })
  : undefined;

const hostApi: HostApi = {
  searchFaq: async (query) => {
    const base = [
      {
        title: "Invite teammates to a workspace",
        snippet: "Add collaborators from the Settings panel and assign roles.",
        url: "/docs/workspaces/invites",
      },
      {
        title: "Reset a project environment",
        snippet: "Clean caches and restart the environment safely.",
        url: "/docs/projects/reset",
      },
      {
        title: "Export a usage report",
        snippet: "Generate CSV exports for internal reviews.",
        url: "/docs/analytics/export",
      },
    ];

    return base.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  },
  createTicket: async (input) => {
    console.log("Support ticket created", input);
    return { ticketId: `TCK-${Math.floor(1000 + Math.random() * 9000)}` };
  },
  listKeyFeatures: async () => {
    return [
      "Unified agent registry with plugin toggles",
      "Typed tool calls scoped to host APIs",
      "Per-agent session panels with history",
      "UI dock configurable on any edge",
    ];
  },
  openTutorial: async (id) => {
    console.log("Opening tutorial", id);
  },
  getPageContext: async () => {
    return {
      pageName: "Workspace Overview",
      hints: ["active users", "recent changes", "launch notes"],
    };
  },
  suggestCopy: async (area) => {
    if (area.toLowerCase().includes("hero")) {
      return "Run agent workflows directly in your product interface, with zero context switching.";
    }
    return "Guide users with contextual agent plugins that learn your platform language.";
  },
};

const apiSchema: HostApiSchema = {
  searchFaq: {
    description: "Search internal help docs.",
    input: "query: string",
    output: "FAQ[]",
  },
  createTicket: {
    description: "Create a support ticket.",
    input: "{ subject, body, userId? }",
    output: "{ ticketId }",
  },
  listKeyFeatures: {
    description: "List the primary product features.",
    output: "string[]",
  },
  openTutorial: {
    description: "Open a tutorial by id.",
    input: "id: string",
  },
  getPageContext: {
    description: "Return page metadata and hints.",
    output: "{ pageName, hints }",
  },
  suggestCopy: {
    description: "Generate copy for a specific area.",
    input: "area: string",
    output: "string",
  },
};

const quickstart = `import { AgentBar } from "@agentbar/react";
import { createProxyProvider } from "@agentbar/runtime";

const llmProvider = createProxyProvider({
  endpoint: "https://your-deploy-url/api/chat",
  siteUrl: window.location.origin,
});

<AgentBar
  apiSchema={apiSchema}
  hostApi={hostApi}
  enabledAgents={["support", "onboarding", "content"]}
  position="right"
  llmProvider={llmProvider}
/>`;

const hostApiSnippet = `export interface HostApi {
  searchFaq(query: string): Promise<FAQ[]>;
  createTicket(input: { subject: string; body: string; userId?: string }): Promise<{ ticketId: string }>;
  listKeyFeatures(): Promise<string[]>;
  openTutorial(id: string): Promise<void>;
  getPageContext(): Promise<{ pageName: string; hints: string[] }>;
  suggestCopy(area: string): Promise<string>;
}`;

const embedSnippet = `<script\n  src=\"https://your-deploy-url/agentbar.js\"\n  data-site=\"https://your-site.com\"\n  data-api=\"https://your-deploy-url\"\n  data-depth=\"2\"\n  data-max-pages=\"25\"\n  data-site-key=\"your-site-key\"\n></script>`;

const cliSnippet = `npm install -g @agentbar/cli\nagentbar init\nagentbar snippet`;

export default function App() {
  const [statusItems, setStatusItems] = useState<
    Array<{ key: string; url: string; pages: Array<{ url: string; title: string }> }>
  >([]);
  const [statusError, setStatusError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const loadStatus = async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      const response = await fetch(`${apiBaseDisplay}/api/status`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load status");
      }
      setStatusItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusError(message);
    } finally {
      setStatusLoading(false);
    }
  };

  const reindexCurrent = async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      const response = await fetch(`${apiBaseDisplay}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: window.location.origin,
          depth: 2,
          maxPages: 25,
          force: true,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to reindex");
      }
      await loadStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusError(message);
      setStatusLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(16,185,129,0.08), transparent 55%), radial-gradient(circle at 75% 10%, rgba(15,23,42,0.05), transparent 50%), linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(248,250,252,0.7) 35%, rgba(241,245,249,1) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }} />

        <header className="relative border-b border-slate-200/70 bg-white/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">
                Agent Plugin Bar
              </p>
              <p className="text-sm font-semibold text-slate-900">Agent dock for product teams</p>
            </div>
            <nav className="hidden items-center gap-6 text-xs text-slate-500 md:flex">
              <a href="#install" className="transition hover:text-slate-800">Install</a>
              <a href="#usage" className="transition hover:text-slate-800">Usage</a>
              <a href="#embed" className="transition hover:text-slate-800">Embed</a>
              <a href="#api" className="transition hover:text-slate-800">API</a>
              <a href="#admin" className="transition hover:text-slate-800">Admin</a>
              <a href="#security" className="transition hover:text-slate-800">Security</a>
              <button className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-1 text-xs text-emerald-700 transition hover:bg-emerald-600/20 active:translate-y-[1px]">
                Get the package
              </button>
            </nav>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div
                className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-500"
                style={{ animationDelay: "40ms" }}
              >
                {apiBase ? "Groq proxy connected" : "AI provider in mock mode"}
              </div>
              <h1
                className="animate-fade-up text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl"
                style={{ animationDelay: "120ms" }}
              >
                Add an agent dock to your product in one component.
              </h1>
              <p
                className="animate-fade-up max-w-[60ch] text-base text-slate-600"
                style={{ animationDelay: "200ms" }}
              >
                Agent Plugin Bar is a drop-in system for support, onboarding, and content agents.
                Each plugin has its own prompt, tools, and UI surface while safely calling your
                HostApi functions.
              </p>
              <div className="animate-fade-up flex flex-wrap gap-3" style={{ animationDelay: "280ms" }}>
                <button className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-5 py-2 text-sm text-emerald-700 transition hover:bg-emerald-600/20 active:translate-y-[1px]">
                  Install package
                </button>
                <a
                  href="#usage"
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm text-slate-700 transition hover:bg-slate-100 active:translate-y-[1px]"
                >
                  View quickstart
                </a>
              </div>
              <div
                className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-4"
                style={{ animationDelay: "360ms" }}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quickstart</p>
                <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-700">{quickstart}</pre>
              </div>
              <p className="animate-fade-up text-xs text-slate-500" style={{ animationDelay: "440ms" }}>
                Set <span className="text-slate-700">VITE_AGENTBAR_API_BASE</span> to point at your
                deployed API. Without it, the runtime uses local fallback behavior.
              </p>
            </div>

            <div className="space-y-4">
              <div
                className="animate-fade-up rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_70px_-55px_rgba(15,23,42,0.3)]"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Agent Dock Preview</span>
                  <span className="animate-shimmer rounded-full border border-emerald-600/30 bg-gradient-to-r from-emerald-600/10 via-emerald-500/20 to-emerald-600/10 px-2 py-[2px] text-[10px] text-emerald-700">
                    Live
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    Support Desk: find the reset steps for the environment.
                  </div>
                  <div className="rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-3 py-2 text-xs text-emerald-700">
                    Found two guides. Want a ticket opened as well?
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                    Tool used: searchFaq
                  </div>
                </div>
              </div>

              <div
                className="animate-fade-up rounded-[28px] border border-slate-200 bg-white p-6"
                style={{ animationDelay: "280ms" }}
              >
                <p className="text-sm font-semibold text-slate-900">Runtime flow</p>
                <div className="mt-4 space-y-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>User request</span>
                    <span className="text-emerald-700">Agent plugin</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>Tool call</span>
                    <span className="text-emerald-700">Host API</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>Response</span>
                    <span className="text-emerald-700">User UI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section id="install" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-2 text-xs text-slate-500 lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700">Docs</p>
            <a href="#install" className="block text-slate-700">Install</a>
            <a href="#usage" className="block transition hover:text-slate-700">Usage</a>
            <a href="#embed" className="block transition hover:text-slate-700">Embed</a>
            <a href="#api" className="block transition hover:text-slate-700">API</a>
            <a href="#agents" className="block transition hover:text-slate-700">Default agents</a>
            <a href="#ai" className="block transition hover:text-slate-700">AI providers</a>
            <a href="#admin" className="block transition hover:text-slate-700">Admin</a>
            <a href="#security" className="block transition hover:text-slate-700">Security model</a>
            <a href="#styling" className="block transition hover:text-slate-700">Styling</a>
            <a href="#faq" className="block transition hover:text-slate-700">FAQ</a>
          </aside>

          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-slate-900">Install</h2>
              <p className="text-sm text-slate-600">
                Install the widget and runtime packages. React is a peer dependency.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <pre>npm install @agentbar/react @agentbar/runtime</pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">CLI</p>
                <pre className="mt-2 whitespace-pre-wrap">{cliSnippet}</pre>
              </div>
            </div>

            <div id="usage" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">Usage</h3>
              <p className="text-sm text-slate-600">
                Add a single component and pass the agents you want to enable.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <pre className="whitespace-pre-wrap">{quickstart}</pre>
              </div>
            </div>

            <div id="embed" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">One-line embed</h3>
              <p className="text-sm text-slate-600">
                Drop this script tag into any site. It auto-scrapes the page and calls the Groq
                powered chat endpoint you deploy with this repo.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <pre className="whitespace-pre-wrap">{embedSnippet}</pre>
              </div>
              <div className="grid gap-2 text-xs text-slate-500">
                <span>data-depth: crawl depth (default 1).</span>
                <span>data-max-pages: maximum pages to index (default 15).</span>
                <span>data-site-key: host multiple sites on one backend.</span>
                <span>data-theme-color: brand color.</span>
                <span>data-position: left, right, or bottom.</span>
              </div>
              <p className="text-xs text-slate-500">
                Deploy this repo to Vercel, set GROQ_API_KEY, and the widget will use /api/chat and
                /api/ingest automatically. data-site-key lets you host multiple sites on one
                backend.
              </p>
            </div>

            <div id="api" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">AgentBar props</h3>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-800">apiSchema</span> - describes the host
                  API surface for future tooling and UI.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-800">hostApi</span> - functions that tools
                  can call.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-800">enabledAgents</span> - string ids for
                  enabled plugins.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-800">agents</span> - optional custom
                  AgentPlugin definitions.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-800">position</span> - dock placement on
                  left, right, or bottom.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-800">llmProvider</span> - optional live AI
                  provider for responses.
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">HostApi interface</h3>
              <p className="text-sm text-slate-600">
                Agents call these methods instead of arbitrary fetch requests.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <pre className="whitespace-pre-wrap">{hostApiSnippet}</pre>
              </div>
            </div>

            <div id="agents" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">Default agents</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-800">Support Desk</p>
                  <p>Tools: searchFaq, createTicket.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-800">Onboarding Guide</p>
                  <p>Tools: listKeyFeatures, openTutorial.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-800">Content Studio</p>
                  <p>Tools: getPageContext, suggestCopy.</p>
                </div>
              </div>
            </div>

            <div id="ai" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">AI providers</h3>
              <p className="text-sm text-slate-600">
                Use the Groq proxy provider when you are ready. The runtime falls back to a local
                heuristic when no provider is supplied.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <pre className="whitespace-pre-wrap">{`import { createProxyProvider } from "@agentbar/runtime";

const llmProvider = createProxyProvider({
  endpoint: "https://your-deploy-url/api/chat",
  siteUrl: window.location.origin,
});`}</pre>
              </div>
            </div>

            <div id="admin" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">Indexing console</h3>
              <p className="text-sm text-slate-600">
                View indexed sites and trigger a re-index. This uses the in-memory store, so data
                resets on cold starts unless you add persistence.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadStatus}
                  className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs text-emerald-700 transition hover:bg-emerald-600/20"
                >
                  {statusLoading ? "Loading..." : "Load status"}
                </button>
                <button
                  type="button"
                  onClick={reindexCurrent}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 transition hover:bg-slate-100"
                >
                  Reindex current site
                </button>
              </div>
              {statusError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                  {statusError}
                </div>
              ) : null}
              <div className="space-y-3">
                {statusItems.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                    No indexed sites yet. Click \"Load status\" to check again.
                  </div>
                ) : (
                  statusItems.map((item) => (
                    <div key={item.key} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold text-slate-800">{item.key}</p>
                      <p className="text-xs text-slate-500">{item.url}</p>
                      <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                        {item.pages.slice(0, 4).map((page) => (
                          <div key={page.url}>{page.title || page.url}</div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div id="security" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">Security model</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  Tools are scoped to the plugin definition and can only call HostApi methods.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  Each agent runs in its own session with isolated prompts and history.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  Tool input schemas provide a typed contract for host-side validation.
                </div>
              </div>
            </div>

            <div id="styling" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">Styling</h3>
              <p className="text-sm text-slate-600">
                The widget uses Tailwind classes. Add the package output to your Tailwind content
                list.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <pre>{`content: [
  "./src/**/*.{ts,tsx}",
  "./node_modules/@agentbar/react/dist/**/*.{js,ts,jsx,tsx}",
]`}</pre>
              </div>
            </div>

            <div id="faq" className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-900">FAQ</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-800">Can I add custom agents?</p>
                  <p>Yes. Pass a custom AgentPlugin array to the agents prop.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-800">Does it require a live LLM?</p>
                  <p>No. The runtime includes a fallback that uses simple routing rules.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-800">Can I place the dock on any edge?</p>
                  <p>Yes. Use the position prop with left, right, or bottom.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>Agent Plugin Bar documentation</span>
          <span>Built for support, onboarding, and content workflows.</span>
        </div>
      </footer>

      <AgentBar
        apiSchema={apiSchema}
        hostApi={hostApi}
        enabledAgents={["support", "onboarding", "content"]}
        position="right"
        llmProvider={llmProvider}
      />
    </div>
  );
}
