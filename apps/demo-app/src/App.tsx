import { useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChartLineUp,
  Command,
  Pulse,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  TerminalWindow,
} from "@phosphor-icons/react";
import { AgentBar } from "@arjun-shah/agentbar-react";
import { createProxyProvider } from "@arjun-shah/agentbar-runtime";
import type { HostApi, HostApiSchema } from "@arjun-shah/agentbar-runtime";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
};

const navItems = [
  { href: "#overview", label: "overview" },
  { href: "#api", label: "api" },
  { href: "#console", label: "console" },
];

const proofStats = [
  { label: "median first reply", value: "47.2s" },
  { label: "pages indexed this week", value: "26.4k" },
  { label: "tickets routed without leaving page", value: "83.6%" },
];

const systemRows = [
  {
    icon: ShieldCheck,
    label: "typed calls only",
    body: "agents only reach the methods you expose in your HostApi, so the runtime stays narrow, readable, and easy to audit.",
    note: "scoped runtime",
  },
  {
    icon: SquaresFour,
    label: "hosted tuning",
    body: "greeting, suggestions, dock side, and color can change centrally instead of getting frozen into the build.",
    note: "single control plane",
  },
  {
    icon: ChartLineUp,
    label: "page-aware answers",
    body: "doc ingest and page snapshots keep replies grounded in the exact surface a user is already looking at.",
    note: "context kept local",
  },
];

const schemaLines = [
  "searchFaq(query: string): Promise<FAQ[]>;",
  "createTicket(input: TicketInput): Promise<{ ticketId: string }>;",
  "getPageContext(): Promise<{ pageName: string; hints: string[] }>;",
  "suggestCopy(area: string): Promise<string>;",
];

type ActionButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "solid" | "soft";
  className?: string;
};

const LogoMark = ({ className = "" }: { className?: string }) => (
  <div className={`relative h-11 w-11 ${className}`}>
    <div className="absolute inset-0 rounded-[1.4rem] border border-[rgba(22,20,18,0.1)] bg-white/80 shadow-[0_18px_45px_-34px_rgba(22,20,18,0.45)] backdrop-blur-md" />
    <div className="absolute inset-[7px] rounded-[1rem] border border-[rgba(var(--accent),0.18)] bg-[rgba(var(--accent),0.08)]" />
    <div className="absolute inset-[15px] rounded-full bg-[rgba(var(--accent),0.78)]" />
  </div>
);

const ActionButton = ({ children, href, onClick, tone = "soft", className = "" }: ActionButtonProps) => {
  const baseClass =
    tone === "solid"
      ? "border border-[rgba(var(--accent),0.2)] bg-[rgba(var(--accent),0.9)] text-white shadow-[0_18px_45px_-30px_rgba(47,107,90,0.75)]"
      : "border border-[rgba(22,20,18,0.1)] bg-white/72 text-stone-900";

  const sharedProps = {
    whileHover: { y: -2 },
    whileTap: { scale: 0.985 },
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
    className: `inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm lowercase tracking-[-0.01em] backdrop-blur-md ${baseClass} ${className}`,
  };

  if (href) {
    return (
      <motion.a href={href} {...sharedProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} {...sharedProps}>
      {children}
    </motion.button>
  );
};

const CodePanel = ({ label, code }: { label: string; code: string }) => (
  <div className="overflow-hidden rounded-[1.75rem] border border-[rgba(22,20,18,0.12)] bg-[#161512] text-stone-100 shadow-[0_30px_70px_-44px_rgba(22,20,18,0.8)]">
    <div className="border-b border-white/10 px-5 py-3 text-[11px] lowercase tracking-[0.24em] text-stone-400">{label}</div>
    <pre className="overflow-x-auto px-5 py-5 text-[13px] leading-7 text-stone-200">
      <code>{code}</code>
    </pre>
  </div>
);

const ProductStage = ({ accentColor }: { accentColor: string }) => {
  const previewSuggestions = ["search limits", "open billing tutorial", "draft hero copy"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      className="relative lg:translate-y-10"
    >
      <div className="surface-panel overflow-hidden rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-[rgba(22,20,18,0.08)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--accent),0.1)] text-[rgb(var(--accent))]">
              <Sparkle className="h-5 w-5" weight="regular" />
            </div>
            <div>
              <p className="text-sm lowercase text-stone-900">docked assistant</p>
              <p className="text-xs lowercase text-stone-500">workspace overview</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,20,18,0.08)] bg-white/72 px-3 py-1 text-xs lowercase text-stone-500">
            <span className="signal-dot h-2 w-2 rounded-full bg-[rgb(var(--accent))]" />
            live
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-[rgba(22,20,18,0.08)] p-6 lg:border-b-0 lg:border-r">
            <div className="space-y-3">
              <div className="max-w-[82%] rounded-[1.4rem] border border-[rgba(22,20,18,0.08)] bg-white/82 px-4 py-3 text-sm leading-7 text-stone-600">
                i can explain a feature, pull page context, or route a ticket without pushing someone into another tab.
              </div>
              <div className="ml-auto max-w-[80%] rounded-[1.4rem] border border-[rgba(var(--accent),0.14)] bg-[rgba(var(--accent),0.08)] px-4 py-3 text-sm leading-7 text-stone-800">
                show the new billing flow and write a short answer for support.
              </div>
            </div>

            <div className="mt-7 rounded-[1.4rem] border border-[rgba(22,20,18,0.08)] bg-[rgba(255,255,255,0.58)] px-4 py-4">
              <div className="flex items-center justify-between text-xs lowercase text-stone-500">
                <span className="inline-flex items-center gap-2">
                  <Command className="h-4 w-4 text-[rgb(var(--accent))]" weight="regular" />
                  prompt line
                </span>
                <span>host api attached</span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm lowercase text-stone-700">
                <span>ask about pricing limits</span>
                <span className="inline-block h-4 w-px bg-[rgba(22,20,18,0.3)] animate-pulse" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {previewSuggestions.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[rgba(22,20,18,0.08)] bg-white/75 px-3 py-1.5 text-xs lowercase text-stone-500"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid divide-y divide-[rgba(22,20,18,0.08)]">
            <div className="p-6">
              <p className="text-xs lowercase tracking-[0.22em] text-stone-400">runtime notes</p>
              <div className="mt-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm lowercase text-stone-900">typed host calls</p>
                    <p className="mt-1 text-sm leading-7 text-stone-500">searchFaq, createTicket, getPageContext</p>
                  </div>
                  <ShieldCheck className="mt-1 h-4 w-4 text-[rgb(var(--accent))]" weight="regular" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm lowercase text-stone-900">theme stays in sync</p>
                    <p className="mt-1 text-sm leading-7 text-stone-500">greeting, color, and dock side update centrally</p>
                  </div>
                  <SquaresFour className="mt-1 h-4 w-4 text-[rgb(var(--accent))]" weight="regular" />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs lowercase tracking-[0.22em] text-stone-400">live signal</p>
                <Pulse className="h-4 w-4 text-[rgb(var(--accent))]" weight="regular" />
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-2xl font-light tracking-[-0.04em] text-stone-900">47.2s</p>
                  <p className="mt-2 text-xs lowercase text-stone-500">median first reply</p>
                </div>
                <div>
                  <p className="text-2xl font-light tracking-[-0.04em] text-stone-900">19</p>
                  <p className="mt-2 text-xs lowercase text-stone-500">sites already indexed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6.2, ease: "easeInOut", repeat: Infinity }}
        className="drift-slow absolute -left-6 bottom-8 hidden w-[220px] rounded-[1.35rem] border border-[rgba(22,20,18,0.08)] bg-white/82 p-4 shadow-[0_20px_50px_-34px_rgba(22,20,18,0.35)] backdrop-blur-md xl:block"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: accentColor }}
          >
            <TerminalWindow className="h-5 w-5" weight="regular" />
          </div>
          <div>
            <p className="text-sm lowercase text-stone-900">ticket routed</p>
            <p className="text-xs lowercase text-stone-500">tck-7824 · 2m ago</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
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
          title: "invite teammates to a workspace",
          snippet: "add collaborators from settings and assign roles there.",
          url: "/docs/workspaces/invites",
        },
        {
          title: "reset a project environment",
          snippet: "clear caches and restart the environment safely.",
          url: "/docs/projects/reset",
        },
        {
          title: "export a usage report",
          snippet: "generate csv exports for internal reviews.",
          url: "/docs/analytics/export",
        },
      ];
      return base.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
    },
    createTicket: async (input) => {
      console.log("support ticket created", input);
      return { ticketId: `TCK-${Math.floor(1000 + Math.random() * 9000)}` };
    },
    listKeyFeatures: async () => [
      "docked assistant with edge placement",
      "typed tool calls scoped to HostApi",
      "hosted settings with live sync",
      "per-agent session panels with history",
    ],
    openTutorial: async (id) => console.log("opening tutorial", id),
    getPageContext: async () => ({
      pageName: "workspace overview",
      hints: ["active users", "recent changes", "launch notes"],
    }),
    suggestCopy: async (area) => {
      if (area.toLowerCase().includes("hero")) {
        return "dock a site assistant that answers product questions without leaving the page.";
      }
      return "guide users with contextual plugins that understand your product language.";
    },
  };

  const apiSchema: HostApiSchema = {
    searchFaq: { description: "search internal help docs.", input: "query: string", output: "FAQ[]" },
    createTicket: { description: "create a support ticket.", input: "{ subject, body, userId? }", output: "{ ticketId }" },
    listKeyFeatures: { description: "list the primary product features.", output: "string[]" },
    openTutorial: { description: "open a tutorial by id.", input: "id: string" },
    getPageContext: { description: "return page metadata and hints.", output: "{ pageName, hints }" },
    suggestCopy: { description: "generate copy for a specific area.", input: "area: string", output: "string" },
  };

  const [configForm, setConfigForm] = useState({
    siteUrl: window.location.origin,
    themeColor: "#2f6b5a",
    position: "right",
    greeting: "welcome back. what can i help with?",
    suggestions: "search docs | explain a feature | draft homepage copy",
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [statusItems, setStatusItems] = useState<Array<{ key: string; url: string; pages: Array<{ url: string; title: string }> }>>([]);
  const [statusError, setStatusError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const normalizeUrl = (value: string) => {
    try {
      if (!value) return "";
      if (value.startsWith("http://") || value.startsWith("https://")) return new URL(value).toString();
      return new URL(`https://${value}`).toString();
    } catch {
      return "";
    }
  };

  const resolveSiteKey = (value: string) => {
    const normalized = normalizeUrl(value);
    if (!normalized) return "";
    try {
      return new URL(normalized).hostname;
    } catch {
      return "";
    }
  };

  const toRgba = (hex: string, alpha: number) => {
    if (!hex) return `rgba(47, 107, 90, ${alpha})`;
    const cleaned = hex.replace("#", "");
    const normalized = cleaned.length === 3 ? cleaned.split("").map((char) => `${char}${char}`).join("") : cleaned;
    if (normalized.length !== 6) return `rgba(47, 107, 90, ${alpha})`;
    const value = parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const toRgbChannels = (hex: string) => {
    if (!hex) return "47 107 90";
    const cleaned = hex.replace("#", "");
    const normalized = cleaned.length === 3 ? cleaned.split("").map((char) => `${char}${char}`).join("") : cleaned;
    if (normalized.length !== 6) return "47 107 90";
    const value = parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `${r} ${g} ${b}`;
  };

  const loadStatus = async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      const response = await fetch(`${apiBaseDisplay}/api/status`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "failed to load status");
      setStatusItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "unknown error");
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
        body: JSON.stringify({ url: window.location.origin, depth: 2, maxPages: 25, force: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "failed to reindex");
      }
      await loadStatus();
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "unknown error");
      setStatusLoading(false);
    }
  };

  const hostedSiteUrl = normalizeUrl(configForm.siteUrl) || window.location.origin;
  const hostedSiteKey = resolveSiteKey(hostedSiteUrl);
  const hostedSnippet = `<script src="${apiBaseDisplay}/agentbar.js" data-site-key="${hostedSiteKey || "your-site-key"}"></script>`;

  const saveHostedConfig = async () => {
    setConfigSaving(true);
    setConfigStatus(null);
    if (!hostedSiteKey) {
      setConfigStatus({ tone: "error", message: "enter a valid site url." });
      setConfigSaving(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseDisplay}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteKey: hostedSiteKey,
          config: {
            siteUrl: hostedSiteUrl,
            themeColor: configForm.themeColor,
            position: configForm.position,
            greeting: configForm.greeting,
            suggestions: configForm.suggestions.split("|").map((item) => item.trim()).filter(Boolean),
            apiBase: apiBaseDisplay,
          },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "failed to save settings.");
      }
      setConfigStatus({ tone: "success", message: "settings saved." });
    } catch (error) {
      setConfigStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "failed to save settings.",
      });
    } finally {
      setConfigSaving(false);
    }
  };

  const copyHostedSnippet = async () => {
    try {
      await navigator.clipboard.writeText(hostedSnippet);
      setConfigStatus({ tone: "success", message: "snippet copied." });
    } catch {
      setConfigStatus({ tone: "error", message: "copy failed. select the snippet manually." });
    }
  };

  const accentChannels = toRgbChannels(configForm.themeColor);
  const suggestionList = configForm.suggestions.split("|").map((item) => item.trim()).filter(Boolean);

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden text-stone-950"
      style={{ "--accent": accentChannels } as CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-14%] top-[-10%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(var(--accent),0.13),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(var(--accent),0.08),transparent_72%)] blur-3xl" />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 border-b border-[rgba(22,20,18,0.08)] bg-[rgba(245,241,234,0.78)] backdrop-blur-xl">
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-8">
          <a href="#" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-sm lowercase tracking-[-0.02em] text-stone-950">agent plugin bar</p>
              <p className="text-xs lowercase text-stone-500">docked assistant runtime</p>
            </div>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm lowercase text-stone-500 transition hover:text-stone-950">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ActionButton href="#api">install</ActionButton>
            <ActionButton href="#console" tone="solid">
              open console
              <ArrowUpRight className="h-4 w-4" weight="regular" />
            </ActionButton>
          </div>
        </nav>
      </header>

      <main className="relative pt-24">
        <section className="mx-auto grid min-h-[100dvh] max-w-[1400px] items-start gap-20 px-5 pb-24 pt-16 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between lg:min-h-[calc(100dvh-8rem)] lg:py-6"
          >
            <div>
              <p className="text-xs lowercase tracking-[0.28em] text-stone-400">minimal runtime for product teams</p>
              <h1 className="mt-7 max-w-[10ch] text-[clamp(3.4rem,9vw,6.6rem)] font-light lowercase leading-[0.92] tracking-[-0.08em] text-stone-950">
                a site assistant that feels built in.
              </h1>
              <p className="mt-8 max-w-[34rem] text-[1.05rem] lowercase leading-8 text-stone-600">
                drop a calm, typed agent into the edge of your app. it answers product questions, routes work, and
                stays inside your interface instead of hijacking the experience.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <ActionButton href="#console" tone="solid">
                  tune the live dock
                  <ArrowUpRight className="h-4 w-4" weight="regular" />
                </ActionButton>
                <ActionButton href="#overview">see how it lands</ActionButton>
              </div>
            </div>

            <div className="mt-16 border-t border-[rgba(22,20,18,0.1)] pt-8">
              <div className="grid gap-8 md:grid-cols-3">
                {proofStats.map((item) => (
                  <div key={item.label}>
                    <p className="text-[2rem] font-light tracking-[-0.05em] text-stone-950">{item.value}</p>
                    <p className="mt-2 text-xs lowercase leading-6 text-stone-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <ProductStage accentColor={configForm.themeColor} />
        </section>

        <motion.section {...reveal} id="overview" className="border-t border-[rgba(22,20,18,0.08)] py-24 md:py-32">
          <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-xs lowercase tracking-[0.28em] text-stone-400">overview</p>
              <h2 className="mt-6 max-w-[12ch] text-4xl font-light lowercase leading-tight tracking-[-0.06em] text-stone-950 md:text-5xl">
                the page stays calm. the agent does the work.
              </h2>
              <p className="mt-6 max-w-[30rem] text-base lowercase leading-8 text-stone-600">
                the structure is simple on purpose: one runtime, one hosted control surface, and a dock that picks up
                context where the user already is.
              </p>
            </div>

            <div className="border-y border-[rgba(22,20,18,0.08)]">
              {systemRows.map((item) => (
                <div key={item.label} className="grid gap-5 border-b border-[rgba(22,20,18,0.08)] py-8 last:border-b-0 md:grid-cols-[auto_1fr_auto] md:items-start">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/76 text-[rgb(var(--accent))] shadow-[0_12px_30px_-24px_rgba(22,20,18,0.32)]">
                    <item.icon className="h-5 w-5" weight="regular" />
                  </div>
                  <div>
                    <p className="text-lg lowercase tracking-[-0.03em] text-stone-950">{item.label}</p>
                    <p className="mt-3 max-w-[42rem] text-sm lowercase leading-7 text-stone-600">{item.body}</p>
                  </div>
                  <p className="text-xs lowercase tracking-[0.22em] text-stone-400 md:pt-1">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...reveal} id="api" className="border-t border-[rgba(22,20,18,0.08)] py-24 md:py-32">
          <div className="mx-auto grid max-w-[1400px] gap-16 px-5 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
            <div className="space-y-6">
              <p className="text-xs lowercase tracking-[0.28em] text-stone-400">api surface</p>
              <h2 className="max-w-[12ch] text-4xl font-light lowercase leading-tight tracking-[-0.06em] text-stone-950 md:text-5xl">
                expose the shape once. let the agent stay inside it.
              </h2>
              <p className="max-w-[34rem] text-base lowercase leading-8 text-stone-600">
                the runtime is persuasive when it is narrow. keep the tool surface explicit, keep the embed short, and
                let the rest of the page remain mostly whitespace.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <CodePanel label="install" code="npm install @arjun-shah/agentbar-react @arjun-shah/agentbar-runtime" />
                <CodePanel
                  label="react"
                  code={`<AgentBar\n  apiSchema={schema}\n  hostApi={api}\n  position="right"\n/>`}
                />
              </div>
            </div>

            <div className="surface-panel rounded-[2rem] p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-[rgba(22,20,18,0.08)] pb-5">
                <div>
                  <p className="text-sm lowercase text-stone-950">host api</p>
                  <p className="mt-1 text-sm lowercase text-stone-500">only the methods below can be touched.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,20,18,0.08)] bg-white/75 px-3 py-1 text-xs lowercase text-stone-500">
                  <ShieldCheck className="h-4 w-4 text-[rgb(var(--accent))]" weight="regular" />
                  typed
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {schemaLines.map((line) => (
                  <div key={line} className="flex items-start justify-between gap-4 border-b border-[rgba(22,20,18,0.08)] pb-4 last:border-b-0 last:pb-0">
                    <code className="text-sm text-stone-800">{line}</code>
                    <span className="text-xs lowercase tracking-[0.22em] text-stone-400">method</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...reveal} id="console" className="border-t border-[rgba(22,20,18,0.08)] py-24 md:py-32">
          <div className="mx-auto max-w-[1400px] px-5 md:px-8">
            <div className="max-w-[42rem]">
              <p className="text-xs lowercase tracking-[0.28em] text-stone-400">hosted console</p>
              <h2 className="mt-6 text-4xl font-light lowercase leading-tight tracking-[-0.06em] text-stone-950 md:text-5xl">
                tune the dock without disturbing the page.
              </h2>
              <p className="mt-6 text-base lowercase leading-8 text-stone-600">
                this stays functional, but the surface is quieter now: labels above fields, clear helper text, visible
                empty and loading states, and a single framed area instead of a stack of dashboard cards.
              </p>
            </div>

            <div className="surface-panel mt-14 overflow-hidden rounded-[2.25rem]">
              <div className="grid divide-y divide-[rgba(22,20,18,0.08)] lg:grid-cols-[1.08fr_0.92fr] lg:divide-x lg:divide-y-0">
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm lowercase text-stone-950">site configuration</p>
                      <p className="mt-1 text-sm lowercase text-stone-500">edit the hosted settings for a single site key.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,20,18,0.08)] bg-white/75 px-3 py-1 text-xs lowercase text-stone-500">
                      <Sparkle className="h-4 w-4 text-[rgb(var(--accent))]" weight="regular" />
                      live sync
                    </div>
                  </div>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs lowercase tracking-[0.18em] text-stone-400">site url</span>
                      <input
                        value={configForm.siteUrl}
                        onChange={(event) => setConfigForm((prev) => ({ ...prev, siteUrl: event.target.value }))}
                        className="w-full rounded-[1.2rem] border border-[rgba(22,20,18,0.1)] bg-white/78 px-4 py-3 text-sm lowercase text-stone-900 outline-none transition focus:border-[rgba(var(--accent),0.35)]"
                        placeholder="https://your-site.com"
                      />
                      <span className="text-xs lowercase leading-6 text-stone-500">used to derive the hosted site key.</span>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs lowercase tracking-[0.18em] text-stone-400">theme color</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={configForm.themeColor}
                          onChange={(event) => setConfigForm((prev) => ({ ...prev, themeColor: event.target.value }))}
                          className="h-12 w-12 rounded-[1rem] border border-[rgba(22,20,18,0.1)] bg-transparent"
                        />
                        <input
                          value={configForm.themeColor}
                          onChange={(event) => setConfigForm((prev) => ({ ...prev, themeColor: event.target.value }))}
                          className="flex-1 rounded-[1.2rem] border border-[rgba(22,20,18,0.1)] bg-white/78 px-4 py-3 text-sm lowercase text-stone-900 outline-none transition focus:border-[rgba(var(--accent),0.35)]"
                          placeholder="#2f6b5a"
                        />
                      </div>
                      <span className="text-xs lowercase leading-6 text-stone-500">used by the dock launcher and reply accents.</span>
                    </label>

                    <label className="grid gap-2 md:col-span-2">
                      <span className="text-xs lowercase tracking-[0.18em] text-stone-400">greeting</span>
                      <input
                        value={configForm.greeting}
                        onChange={(event) => setConfigForm((prev) => ({ ...prev, greeting: event.target.value }))}
                        className="w-full rounded-[1.2rem] border border-[rgba(22,20,18,0.1)] bg-white/78 px-4 py-3 text-sm lowercase text-stone-900 outline-none transition focus:border-[rgba(var(--accent),0.35)]"
                        placeholder="welcome back. what can i help with?"
                      />
                      <span className="text-xs lowercase leading-6 text-stone-500">shown as the first line inside the dock.</span>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs lowercase tracking-[0.18em] text-stone-400">dock position</span>
                      <select
                        value={configForm.position}
                        onChange={(event) => setConfigForm((prev) => ({ ...prev, position: event.target.value }))}
                        className="w-full rounded-[1.2rem] border border-[rgba(22,20,18,0.1)] bg-white/78 px-4 py-3 text-sm lowercase text-stone-900 outline-none transition focus:border-[rgba(var(--accent),0.35)]"
                      >
                        <option value="right">right</option>
                        <option value="left">left</option>
                        <option value="bottom">bottom</option>
                      </select>
                      <span className="text-xs lowercase leading-6 text-stone-500">choose the dock placement per page.</span>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs lowercase tracking-[0.18em] text-stone-400">suggestions</span>
                      <input
                        value={configForm.suggestions}
                        onChange={(event) => setConfigForm((prev) => ({ ...prev, suggestions: event.target.value }))}
                        className="w-full rounded-[1.2rem] border border-[rgba(22,20,18,0.1)] bg-white/78 px-4 py-3 text-sm lowercase text-stone-900 outline-none transition focus:border-[rgba(var(--accent),0.35)]"
                        placeholder="search docs | explain a feature | draft copy"
                      />
                      <span className="text-xs lowercase leading-6 text-stone-500">separate suggestion chips with a vertical bar.</span>
                    </label>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <ActionButton onClick={saveHostedConfig} tone="solid">
                      {configSaving ? "saving..." : "save settings"}
                    </ActionButton>
                    <ActionButton onClick={copyHostedSnippet}>copy snippet</ActionButton>
                  </div>

                  {configStatus && (
                    <p className={`mt-5 text-sm lowercase ${configStatus.tone === "error" ? "text-rose-700" : "text-[rgb(var(--accent))]"}`}>
                      {configStatus.message}
                    </p>
                  )}
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm lowercase text-stone-950">embed + indexing</p>
                      <p className="mt-1 text-sm lowercase text-stone-500">copy the script, then inspect what has already been ingested.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,20,18,0.08)] bg-white/75 px-3 py-1 text-xs lowercase text-stone-500">
                      <ChartLineUp className="h-4 w-4 text-[rgb(var(--accent))]" weight="regular" />
                      status view
                    </div>
                  </div>

                  <div className="mt-8 rounded-[1.5rem] border border-[rgba(22,20,18,0.1)] bg-[rgba(22,20,18,0.96)]">
                    <div className="border-b border-white/10 px-4 py-3 text-[11px] lowercase tracking-[0.22em] text-stone-500">embed snippet</div>
                    <pre className="whitespace-pre-wrap px-4 py-4 text-xs leading-7 text-stone-200">{hostedSnippet}</pre>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <ActionButton onClick={loadStatus}>{statusLoading ? "loading..." : "load status"}</ActionButton>
                    <ActionButton onClick={reindexCurrent}>reindex site</ActionButton>
                  </div>

                  {statusError && (
                    <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm lowercase text-rose-700">
                      {statusError}
                    </div>
                  )}

                  <div className="mt-6">
                    {statusLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((item) => (
                          <div key={item} className="shimmer-block rounded-[1.35rem] border border-[rgba(22,20,18,0.08)] bg-white/75 p-4">
                            <div className="h-4 w-32 rounded-full bg-stone-200/80" />
                            <div className="mt-3 h-3 w-48 rounded-full bg-stone-200/60" />
                          </div>
                        ))}
                      </div>
                    ) : statusItems.length === 0 ? (
                      <div className="rounded-[1.35rem] border border-[rgba(22,20,18,0.08)] bg-white/76 px-4 py-4 text-sm lowercase leading-7 text-stone-500">
                        no indexed sites yet. use “load status” when the api is running.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {statusItems.map((item) => (
                          <div key={item.key} className="rounded-[1.35rem] border border-[rgba(22,20,18,0.08)] bg-white/76 px-4 py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm lowercase text-stone-900">{item.key}</p>
                                <p className="mt-1 text-xs lowercase text-stone-500">{item.url}</p>
                              </div>
                              <span className="text-xs lowercase tracking-[0.22em] text-stone-400">{item.pages.length} pages</span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {item.pages.slice(0, 3).map((page) => (
                                <span
                                  key={`${item.key}-${page.url}`}
                                  className="rounded-full border border-[rgba(22,20,18,0.08)] bg-white px-3 py-1.5 text-[11px] lowercase text-stone-500"
                                >
                                  {page.title || page.url}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...reveal} className="border-t border-[rgba(22,20,18,0.08)] py-20 md:py-24">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs lowercase tracking-[0.28em] text-stone-400">close</p>
              <h2 className="mt-6 max-w-[11ch] text-4xl font-light lowercase leading-tight tracking-[-0.06em] text-stone-950 md:text-5xl">
                the assistant can stay subtle until someone needs it.
              </h2>
              <p className="mt-6 max-w-[34rem] text-base lowercase leading-8 text-stone-600">
                the page is cleaner now, but the functional pieces are still here. open the dock, change the hosted
                settings, and use the landing page as the product demo instead of a marketing template.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionButton href="#console" tone="solid">
                open console
                <ArrowUpRight className="h-4 w-4" weight="regular" />
              </ActionButton>
              <ActionButton href="#api">read api</ActionButton>
            </div>
          </div>
        </motion.section>

        <footer className="border-t border-[rgba(22,20,18,0.08)] py-8">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 md:px-8">
            <div className="flex items-center gap-3">
              <LogoMark className="scale-[0.88]" />
              <div>
                <p className="text-sm lowercase text-stone-950">agent plugin bar</p>
                <p className="text-xs lowercase text-stone-500">mit licensed runtime for product teams</p>
              </div>
            </div>
            <p className="text-xs lowercase tracking-[0.18em] text-stone-400">clean surface · typed actions · hosted control</p>
          </div>
        </footer>
      </main>

      <AgentBar
        apiSchema={apiSchema}
        hostApi={hostApi}
        enabledAgents={["support", "onboarding", "content"]}
        position={configForm.position as "left" | "right" | "bottom"}
        llmProvider={llmProvider}
        theme={{
          accent: configForm.themeColor,
          background: "rgba(245, 241, 234, 0.96)",
          text: "#161412",
          muted: "#6e675f",
          border: "rgba(22, 20, 18, 0.12)",
          panelRadius: "20px",
          dockRadius: "16px",
          fontFamily: "Geist, Satoshi, ui-sans-serif",
          userBubbleBackground: toRgba(configForm.themeColor, 0.14),
          userBubbleText: "#161412",
          assistantBubbleBackground: "rgba(255, 255, 255, 0.92)",
          assistantBubbleText: "#161412",
          panelShadow: "0 34px 64px -42px rgba(22, 20, 18, 0.42)",
          dockShadow: "0 22px 40px -30px rgba(22, 20, 18, 0.32)",
        }}
        inputPlaceholder="ask about this page"
        suggestions={suggestionList}
        greeting={configForm.greeting}
        showReset={true}
        showScrollButton={true}
        scrollLabel="scroll"
        showMinimize={true}
        launcherTooltip="open assistant"
      />
    </div>
  );
}
