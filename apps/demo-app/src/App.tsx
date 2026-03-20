import { useState } from "react";
import { AgentBar } from "@arjun-shah/agentbar-react";
import { createProxyProvider } from "@arjun-shah/agentbar-runtime";
import type { HostApi, HostApiSchema } from "@arjun-shah/agentbar-runtime";

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

    return base.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
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

const quickstart = `import { AgentBar } from "@arjun-shah/agentbar-react";
import { createProxyProvider } from "@arjun-shah/agentbar-runtime";

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

const embedSnippet = `<script src="https://agent-pug.vercel.app/agentbar.js" data-site-key="your-site-key"></script>`;

const cliSnippet = `npm install -g agentbar-cli\nagentbar init\nagentbar snippet`;

const normalizeUrl = (value: string) => {
  try {
    if (!value) {
      return "";
    }
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return new URL(value).toString();
    }
    return new URL(`https://${value}`).toString();
  } catch (_error) {
    return "";
  }
};

const resolveSiteKey = (value: string) => {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    return "";
  }
  try {
    return new URL(normalized).hostname;
  } catch {
    return "";
  }
};

export default function App() {
  const [configForm, setConfigForm] = useState({
    siteUrl: window.location.origin,
    themeColor: "#0f766e",
    position: "right",
    greeting: "Welcome back. How can I help?",
    suggestions: "Search pricing | Explain a feature | Draft homepage copy",
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState("");
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

  const hostedSiteUrl = normalizeUrl(configForm.siteUrl) || window.location.origin;
  const hostedSiteKey = resolveSiteKey(hostedSiteUrl);
  const hostedSnippet = `<script src="${apiBaseDisplay}/agentbar.js" data-site-key="${
    hostedSiteKey || "your-site-key"
  }"></script>`;

  const saveHostedConfig = async () => {
    setConfigSaving(true);
    setConfigStatus("");
    const siteKey = hostedSiteKey;
    if (!siteKey) {
      setConfigStatus("Enter a valid site URL.");
      setConfigSaving(false);
      return;
    }
    const suggestions = configForm.suggestions
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`${apiBaseDisplay}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteKey,
          config: {
            siteUrl: hostedSiteUrl,
            themeColor: configForm.themeColor,
            position: configForm.position,
            greeting: configForm.greeting,
            suggestions,
            apiBase: apiBaseDisplay,
          },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save settings.");
      }
      setConfigStatus("Settings saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings.";
      setConfigStatus(message);
    } finally {
      setConfigSaving(false);
    }
  };

  const copyHostedSnippet = async () => {
    try {
      await navigator.clipboard.writeText(hostedSnippet);
      setConfigStatus("Snippet copied.");
    } catch (_error) {
      setConfigStatus("Copy failed. Select the snippet manually.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-emerald-200/30 blur-[120px]" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-slate-200/50 blur-[140px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />

        <header className="relative border-b border-slate-200/70 bg-white/70 backdrop-blur">
          <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl border border-emerald-200/70 bg-emerald-100/60" />
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-700">
                  Agent Plugin Bar
                </p>
                <p className="text-sm font-semibold text-slate-900">Docked agents for product teams</p>
              </div>
            </div>
            <div className="hidden items-center gap-6 text-sm text-slate-600 lg:flex">
              <a className="transition hover:text-slate-900" href="#how">
                Workflow
              </a>
              <a className="transition hover:text-slate-900" href="#embed">
                One-line embed
              </a>
              <a className="transition hover:text-slate-900" href="#runtime">
                Runtime
              </a>
              <a className="transition hover:text-slate-900" href="#admin">
                Admin
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#embed"
                className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 active:translate-y-[1px]"
              >
                Get snippet
              </a>
              <a
                href="#admin"
                className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 active:translate-y-[1px]"
              >
                Open console
              </a>
            </div>
          </nav>
        </header>

        <main className="relative mx-auto max-w-[1400px] px-6 pb-20 pt-16 lg:pt-20">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-xs text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                Hosted settings are live
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
                  Launch an agent dock on any site with a single script.
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-[60ch]">
                  Agent Plugin Bar gives you a configurable assistant surface for support, onboarding,
                  content, and analytics. Settings live in a hosted dashboard, while the widget
                  auto-indexes your pages and answers with streaming responses.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#embed"
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_-30px_rgba(15,118,110,0.6)] transition hover:-translate-y-[1px] active:translate-y-[1px]"
                >
                  Copy one-line embed
                </a>
                <a
                  href="#runtime"
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:translate-y-[1px]"
                >
                  View runtime
                </a>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Setup</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">One script, hosted settings</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Update colors, greeting, and position from the dashboard without re-deploying.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Runtime</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">Typed tools only</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Agents can only call your HostApi methods, not arbitrary network requests.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="animate-fade-up rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.4)]">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Live dock preview</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[2px] text-[10px] text-emerald-700">
                    Active
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    Ask: summarize the latest release notes.
                  </div>
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                    Pulled two notes from /changelog. Want a draft email?
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-500">
                    Tool used: searchFaq
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="animate-float-slow rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_25px_60px_-50px_rgba(15,23,42,0.35)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Runtime loop</p>
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>User message</span>
                      <span className="text-emerald-700">Input</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Agent decision</span>
                      <span className="text-emerald-700">Tool call</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Host response</span>
                      <span className="text-emerald-700">Answer</span>
                    </div>
                  </div>
                </div>
                <div className="animate-float-slow rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-xs text-slate-100 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.55)]">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Streaming</p>
                  <p className="mt-3 text-sm font-semibold">
                    Tokens render instantly in the dock, no refresh needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section id="how" className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Workflow</p>
            <h2 className="text-3xl font-semibold text-slate-900">From embed to answered in minutes.</h2>
            <p className="text-sm text-slate-600">
              Host the assistant once, then drop a single line of code on any site. The widget
              snapshots the current page for instant context and crawls the rest of your site in the
              background.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <pre className="whitespace-pre-wrap">{cliSnippet}</pre>
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "1. Register the site",
                body: "Run the CLI once to sync your site URL and receive the hosted snippet.",
              },
              {
                title: "2. Drop the embed",
                body: "Paste one script tag and the dock appears on the page with your settings.",
              },
              {
                title: "3. Update from the dashboard",
                body: "Adjust greeting, tone, colors, and position without touching code.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="animate-fade-up rounded-2xl border border-slate-200 bg-white px-5 py-4"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-2 text-xs text-slate-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="embed" className="mx-auto max-w-[1400px] px-6 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">One-line embed</p>
            <h2 className="text-3xl font-semibold text-slate-900">Keep the embed short. Store the rest.</h2>
            <p className="text-sm text-slate-600">
              Settings are pulled from the hosted dashboard. All you need is the script tag and your
              site key.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-700">
              <pre className="whitespace-pre-wrap">{embedSnippet}</pre>
            </div>
            <p className="text-xs text-slate-500">
              Deploy this repo to Vercel, set GROQ_API_KEY, and the widget will auto-ingest your
              content. Each site gets its own key for isolation.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quickstart</p>
              <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-700">{quickstart}</pre>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-xs text-slate-100">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Console</p>
              <p className="mt-3 text-sm font-semibold">Edit settings in one place.</p>
              <p className="mt-2 text-xs text-slate-400">
                Use the Admin dashboard below or the CLI to sync new defaults instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="runtime" className="mx-auto max-w-[1400px] px-6 pb-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Runtime</p>
            <h2 className="text-3xl font-semibold text-slate-900">Typed tools, predictable calls.</h2>
            <p className="text-sm text-slate-600">
              Each agent gets a system prompt, tools, and UI surface. Tools can only call the HostApi
              methods you provide.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-700">
              <pre className="whitespace-pre-wrap">{hostApiSnippet}</pre>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              {
                title: "Support Desk",
                body: "Answers questions, runs searchFaq, logs createTicket.",
              },
              {
                title: "Onboarding Guide",
                body: "Shows listKeyFeatures and triggers openTutorial flows.",
              },
              {
                title: "Content Studio",
                body: "Reads getPageContext and suggests copy variants.",
              },
            ].map((agent, index) => (
              <div
                key={agent.title}
                className="animate-fade-up rounded-2xl border border-slate-200 bg-white px-5 py-4"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-sm font-semibold text-slate-900">{agent.title}</p>
                <p className="mt-2 text-xs text-slate-500">{agent.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="admin" className="mx-auto max-w-[1400px] px-6 pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Admin</p>
            <h2 className="text-3xl font-semibold text-slate-900">Hosted dashboard for every site.</h2>
            <p className="text-sm text-slate-600">
              Save settings to the hosted config store and keep the embed snippet short. Changes take
              effect without code deploys.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-xs text-slate-600">
                  <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">Site URL</span>
                  <input
                    value={configForm.siteUrl}
                    onChange={(event) =>
                      setConfigForm((prev) => ({ ...prev, siteUrl: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    placeholder="https://your-site.com"
                  />
                </label>
                <label className="space-y-2 text-xs text-slate-600">
                  <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">
                    Theme color
                  </span>
                  <input
                    value={configForm.themeColor}
                    onChange={(event) =>
                      setConfigForm((prev) => ({ ...prev, themeColor: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    placeholder="#0f766e"
                  />
                </label>
                <label className="space-y-2 text-xs text-slate-600">
                  <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">Position</span>
                  <select
                    value={configForm.position}
                    onChange={(event) =>
                      setConfigForm((prev) => ({ ...prev, position: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </label>
                <label className="space-y-2 text-xs text-slate-600">
                  <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">Greeting</span>
                  <input
                    value={configForm.greeting}
                    onChange={(event) =>
                      setConfigForm((prev) => ({ ...prev, greeting: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    placeholder="Welcome back. How can I help?"
                  />
                </label>
              </div>
              <label className="mt-4 block space-y-2 text-xs text-slate-600">
                <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">
                  Suggestions (use | to separate)
                </span>
                <input
                  value={configForm.suggestions}
                  onChange={(event) =>
                    setConfigForm((prev) => ({ ...prev, suggestions: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  placeholder="Search pricing | Explain a feature"
                />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveHostedConfig}
                  className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs text-emerald-700 transition hover:bg-emerald-600/20 active:translate-y-[1px]"
                >
                  {configSaving ? "Saving..." : "Save settings"}
                </button>
                <button
                  type="button"
                  onClick={copyHostedSnippet}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 transition hover:bg-slate-100 active:translate-y-[1px]"
                >
                  Copy snippet
                </button>
                {configStatus ? <span className="text-xs text-slate-500">{configStatus}</span> : null}
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <pre className="whitespace-pre-wrap">{hostedSnippet}</pre>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Indexing console</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadStatus}
                className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs text-emerald-700 transition hover:bg-emerald-600/20 active:translate-y-[1px]"
              >
                {statusLoading ? "Loading..." : "Load status"}
              </button>
              <button
                type="button"
                onClick={reindexCurrent}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 transition hover:bg-slate-100 active:translate-y-[1px]"
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
              {statusLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse-soft" />
                  <div className="mt-3 h-3 w-40 rounded-full bg-slate-200 animate-pulse-soft" />
                  <div className="mt-4 h-2 w-full rounded-full bg-slate-100 animate-pulse-soft" />
                  <div className="mt-2 h-2 w-5/6 rounded-full bg-slate-100 animate-pulse-soft" />
                </div>
              ) : statusItems.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  No indexed sites yet. Click "Load status" to check again.
                </div>
              ) : (
                statusItems.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
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
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-slate-500">
          <p>Agent Plugin Bar. Hosted assistants for modern product teams.</p>
          <div className="flex items-center gap-4">
            <a className="transition hover:text-slate-700" href="#embed">
              Embed
            </a>
            <a className="transition hover:text-slate-700" href="#runtime">
              Runtime
            </a>
            <a className="transition hover:text-slate-700" href="#admin">
              Admin
            </a>
          </div>
        </div>
      </footer>

      <AgentBar
        apiSchema={apiSchema}
        hostApi={hostApi}
        enabledAgents={["support", "onboarding", "content"]}
        position="right"
        llmProvider={llmProvider}
        theme={{
          accent: "#0f766e",
          background: "rgba(255,255,255,0.98)",
          text: "#0f172a",
          muted: "#64748b",
          border: "rgba(226,232,240,0.9)",
          panelRadius: "20px",
          dockRadius: "18px",
          fontFamily: "Geist, Satoshi, ui-sans-serif",
          userBubbleBackground: "rgba(15,118,110,0.12)",
          userBubbleText: "#0f172a",
          assistantBubbleBackground: "#f8fafc",
          assistantBubbleText: "#0f172a",
          panelShadow: "0 30px 70px -50px rgba(15,23,42,0.35)",
          dockShadow: "0 20px 50px -40px rgba(15,23,42,0.2)",
        }}
        inputPlaceholder="Ask about this page"
        suggestions={["Search pricing", "Summarize docs", "Draft marketing copy"]}
        greeting="Welcome back. How can I help?"
        showReset={true}
        showScrollButton={true}
        scrollLabel="Scroll"
        showMinimize={true}
        launcherTooltip="Open assistant"
      />
    </div>
  );
}
