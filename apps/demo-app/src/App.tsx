import { useState, useEffect } from "react";
import { AgentBar } from "@arjun-shah/agentbar-react";
import { createProxyProvider } from "@arjun-shah/agentbar-runtime";
import type { HostApi, HostApiSchema } from "@arjun-shah/agentbar-runtime";

// Logo component - Linear-style gradient sphere
const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div
      className="w-8 h-8 rounded-full"
      style={{
        background: "#0ea5e9",
        boxShadow: "0 4px 18px -8px rgba(14, 165, 233, 0.45)"
      }}
    />
    <div 
      className="absolute inset-0 rounded-full opacity-30"
      style={{
        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)"
      }}
    />
  </div>
);

// Gradient orb background component
const BackgroundOrbs = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div 
      className="absolute -left-[20%] -top-[10%] h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
      style={{
        background: "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)"
      }}
    />
    <div 
      className="absolute right-[10%] top-[20%] h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
      style={{
        background: "radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)"
      }}
    />
    <div 
      className="absolute left-[30%] bottom-[10%] h-[300px] w-[300px] rounded-full opacity-10 blur-[80px]"
      style={{
        background: "radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)"
      }}
    />
  </div>
);

// Grid pattern background
const GridPattern = () => (
  <div 
    className="pointer-events-none absolute inset-0 opacity-[0.4]"
    style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      backgroundSize: "48px 48px"
    }}
  />
);

// Code block component - Linear style
const CodeBlock = ({ code, label }: { code: string; label?: string }) => (
  <div className="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#0c0e12]">
    {label && (
      <div className="border-b border-white/[0.06] px-4 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      </div>
    )}
    <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-white/70">
      <code>{code}</code>
    </pre>
    <button
      onClick={() => navigator.clipboard.writeText(code)}
      className="absolute right-3 top-3 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-white/40 opacity-0 transition-all hover:bg-white/[0.08] hover:text-white/60 group-hover:opacity-100"
    >
      Copy
    </button>
  </div>
);

// Feature card component
const FeatureCard = ({ 
  title, 
  description, 
  icon,
  delay = 0 
}: { 
  title: string; 
  description: string; 
  icon?: React.ReactNode;
  delay?: number;
}) => (
  <div 
    className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
    style={{ animationDelay: `${delay}ms` }}
  >
    {icon && <div className="mb-3 text-white/60">{icon}</div>}
    <h3 className="mb-1.5 text-[15px] font-semibold text-white">{title}</h3>
    <p className="text-[13px] leading-relaxed text-white/50">{description}</p>
  </div>
);

// Button components - Linear style
const ButtonPrimary = ({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-all hover:bg-white/90 active:scale-[0.98] ${className}`}
  >
    {children}
  </button>
);

const ButtonSecondary = ({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden rounded-full border border-white/[0.15] bg-white/[0.03] px-5 py-2.5 text-[14px] font-medium text-white transition-all hover:bg-white/[0.08] hover:border-white/[0.25] active:scale-[0.98] ${className}`}
  >
    {children}
  </button>
);

// Section component
const Section = ({ 
  id, 
  children, 
  className = "" 
}: { 
  id?: string; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <section id={id} className={`relative py-24 ${className}`}>
    {children}
  </section>
);

// Animated gradient border component
const GradientBorderCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-6 ${className}`}>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent" />
    {children}
  </div>
);

// Main App
export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        { title: "Invite teammates to a workspace", snippet: "Add collaborators from the Settings panel and assign roles.", url: "/docs/workspaces/invites" },
        { title: "Reset a project environment", snippet: "Clean caches and restart the environment safely.", url: "/docs/projects/reset" },
        { title: "Export a usage report", snippet: "Generate CSV exports for internal reviews.", url: "/docs/analytics/export" },
      ];
      return base.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
    },
    createTicket: async (input) => {
      console.log("Support ticket created", input);
      return { ticketId: `TCK-${Math.floor(1000 + Math.random() * 9000)}` };
    },
    listKeyFeatures: async () => [
      "Unified agent registry with plugin toggles",
      "Typed tool calls scoped to host APIs",
      "Per-agent session panels with history",
      "UI dock configurable on any edge",
    ],
    openTutorial: async (id) => console.log("Opening tutorial", id),
    getPageContext: async () => ({ pageName: "Workspace Overview", hints: ["active users", "recent changes", "launch notes"] }),
    suggestCopy: async (area) => {
      if (area.toLowerCase().includes("hero")) {
        return "Run agent workflows directly in your product interface, with zero context switching.";
      }
      return "Guide users with contextual agent plugins that learn your platform language.";
    },
  };

  const apiSchema: HostApiSchema = {
    searchFaq: { description: "Search internal help docs.", input: "query: string", output: "FAQ[]" },
    createTicket: { description: "Create a support ticket.", input: "{ subject, body, userId? }", output: "{ ticketId }" },
    listKeyFeatures: { description: "List the primary product features.", output: "string[]" },
    openTutorial: { description: "Open a tutorial by id.", input: "id: string" },
    getPageContext: { description: "Return page metadata and hints.", output: "{ pageName, hints }" },
    suggestCopy: { description: "Generate copy for a specific area.", input: "area: string", output: "string" },
  };

  const [configForm, setConfigForm] = useState({
    siteUrl: window.location.origin,
    themeColor: "#0ea5e9",
    position: "right",
    greeting: "Welcome back. How can I help?",
    suggestions: "Search docs | Explain a feature | Draft homepage copy",
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState("");
  const [statusItems, setStatusItems] = useState<Array<{ key: string; url: string; pages: Array<{ url: string; title: string }> }>>([]);
  const [statusError, setStatusError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const loadStatus = async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      const response = await fetch(`${apiBaseDisplay}/api/status`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load status");
      setStatusItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unknown error");
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
        const data = await response.json();
        throw new Error(data?.error || "Failed to reindex");
      }
      await loadStatus();
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unknown error");
      setStatusLoading(false);
    }
  };

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

  const hostedSiteUrl = normalizeUrl(configForm.siteUrl) || window.location.origin;
  const hostedSiteKey = resolveSiteKey(hostedSiteUrl);
  const hostedSnippet = `<script src="${apiBaseDisplay}/agentbar.js" data-site-key="${hostedSiteKey || "your-site-key"}"></script>`;

  const saveHostedConfig = async () => {
    setConfigSaving(true);
    setConfigStatus("");
    const siteKey = hostedSiteKey;
    if (!siteKey) {
      setConfigStatus("Enter a valid site URL.");
      setConfigSaving(false);
      return;
    }
    const suggestions = configForm.suggestions.split("|").map((item) => item.trim()).filter(Boolean);

    try {
      const response = await fetch(`${apiBaseDisplay}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteKey,
          config: { siteUrl: hostedSiteUrl, themeColor: configForm.themeColor, position: configForm.position, greeting: configForm.greeting, suggestions, apiBase: apiBaseDisplay },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save settings.");
      }
      setConfigStatus("Settings saved.");
    } catch (error) {
      setConfigStatus(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setConfigSaving(false);
    }
  };

  const copyHostedSnippet = async () => {
    try {
      await navigator.clipboard.writeText(hostedSnippet);
      setConfigStatus("Snippet copied.");
    } catch {
      setConfigStatus("Copy failed. Select the snippet manually.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0b0d12] text-white">
      {/* Background effects */}
      <BackgroundOrbs />
      <GridPattern />

      {/* Sticky header */}
      <header className={`fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#0b0d12]/80 backdrop-blur-xl transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <p className="text-xs font-medium tracking-widest text-white/60">AGENT PLUGIN BAR</p>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-[14px] text-white/50 lg:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#runtime" className="transition-colors hover:text-white">Runtime</a>
            <a href="#admin" className="transition-colors hover:text-white">Admin</a>
          </div>
          <div className="flex items-center gap-3">
            <ButtonSecondary>Docs</ButtonSecondary>
            <ButtonPrimary>Get snippet</ButtonPrimary>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <main className="relative pt-32">
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-12">
            {/* Left: Hero content */}
            <div className={`space-y-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
                <span>Hosted settings + streaming answers</span>
              </div>

              {/* Headline */}
              <h1 className="text-[42px] leading-[1.15] font-semibold tracking-tight text-white lg:text-[56px]">
                Build product assistants
                <br />
                <span className="text-[#0ea5e9]">that know your site</span>
              </h1>

              {/* Subheadline */}
              <p className="max-w-xl text-[16px] leading-relaxed text-white/50">
                Embed a Linear-grade AI assistant in your product. Configure agents, define tools, and ship contextual help in minutes—not months.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3">
                <ButtonPrimary>Start building →</ButtonPrimary>
                <ButtonSecondary>View demo</ButtonSecondary>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {["bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400"].map((color, i) => (
                    <div key={i} className={`h-8 w-8 rounded-full border-2 border-[#08090a] ${color}`} />
                  ))}
                </div>
                <span className="text-[13px] text-white/40">Trusted by 500+ teams</span>
              </div>
            </div>

            {/* Right: Hero visual */}
            <div className={`relative transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <GradientBorderCard className="h-full min-h-[400px]">
                <div className="space-y-4">
                  {/* Chat preview */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-6 w-6 rounded-md bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="h-4 w-1/2 rounded bg-white/5" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-6 w-6 rounded-md bg-[#0ea5e9]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full rounded bg-[#0ea5e9]/20" />
                      <div className="h-4 w-2/3 rounded bg-[#0ea5e9]/10" />
                    </div>
                  </div>
                  {/* Tool call indicator */}
                  <div className="ml-9 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div className="h-3 w-3 rounded-sm bg-[#0ea5e9]" />
                    <span className="text-[11px] text-white/40">searchFaq called</span>
                  </div>
                  {/* Input */}
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <span className="text-[13px] text-white/30">Ask about this page...</span>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -right-4 top-10 animate-float rounded-xl border border-white/[0.08] bg-[#0c0e12] p-3 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-[#0ea5e9]" />
                    <span className="text-[11px] text-white/60">Indexing complete</span>
                  </div>
                </div>
                <div className="absolute -left-4 bottom-20 animate-float animate-stagger-2 rounded-xl border border-white/[0.08] bg-[#0c0e12] p-3 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-[#0ea5e9]" />
                    <span className="text-[11px] text-white/60">3 agents active</span>
                  </div>
                </div>
              </GradientBorderCard>
            </div>
          </div>
        </div>

        {/* Features section */}
        <Section id="features" className="border-t border-white/[0.06] bg-[#0c0e12]/50">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-5">
                <p className="text-[12px] font-medium uppercase tracking-widest text-[#0ea5e9]">Features</p>
                <h2 className="text-[32px] font-semibold text-white">The end-state checklist.</h2>
                <p className="text-[15px] leading-relaxed text-white/50">
                  A production-ready assistant dock needs hosted config, safe tool calls, ingest, and
                  a UI that feels native to the product. Everything is listed below.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Embed + config",
                    items: [
                      "One-line embed with site key",
                      "Hosted dashboard for settings",
                      "CLI bootstrap and sync",
                      "Data-attribute overrides",
                    ],
                  },
                  {
                    title: "Ingest + context",
                    items: [
                      "Auto crawl via sitemap",
                      "Same-origin page discovery",
                      "Client-side page snapshot",
                      "Multi-site tenancy",
                    ],
                  },
                  {
                    title: "Agent runtime",
                    items: [
                      "Typed tool calls only",
                      "Built-in agent plugins",
                      "Custom agent definitions",
                      "Per-agent session history",
                    ],
                  },
                  {
                    title: "User experience",
                    items: [
                      "Dock placement controls",
                      "Draggable launcher",
                      "Session persistence",
                      "Transcript export",
                    ],
                  },
                  {
                    title: "Admin + ops",
                    items: [
                      "Status endpoint",
                      "Minimize and reset",
                      "Scroll helpers",
                      "Accessible UI defaults",
                    ],
                  },
                  {
                    title: "Deployment",
                    items: [
                      "Groq streaming responses",
                      "Safe heuristic fallback",
                      "Vercel-ready endpoints",
                      "MIT open source",
                    ],
                  },
                ].map((group) => (
                  <div key={group.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <p className="text-[13px] font-semibold text-white">{group.title}</p>
                    <div className="mt-3 space-y-2 text-[13px] text-white/45">
                      {group.items.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* How it works section */}
        <Section id="how" className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left: Description */}
              <div>
              <p className="mb-3 text-[12px] font-medium uppercase tracking-widest text-[#0ea5e9]">How it works</p>
                <h2 className="mb-5 text-[32px] font-semibold text-white">From embed to answered in minutes</h2>
                <p className="mb-8 text-[15px] leading-relaxed text-white/50">
                  Host the assistant once, then drop a single line of code on any site. 
                  The widget indexes page content for instant context.
                </p>
                <div className="space-y-3">
                  {[
                    { step: "01", title: "Initialize", description: "npm install and configure your first agent" },
                    { step: "02", title: "Embed", description: "Add the script tag to your site" },
                    { step: "03", title: "Deploy", description: "Ship and let users interact instantly" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[12px] font-medium text-white/30">{item.step}</span>
                      <div>
                        <p className="text-[14px] font-medium text-white">{item.title}</p>
                        <p className="text-[13px] text-white/40">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Code */}
              <div className="space-y-4">
                <CodeBlock 
                  label="Install" 
                  code="npm install @arjun-shah/agentbar-react" 
                />
                <CodeBlock 
                  label="Configure" 
                  code={`<AgentBar
  apiSchema={schema}
  hostApi={api}
  position="right"
/>`}
                />
                <CodeBlock 
                  label="Embed (optional)" 
                  code={`<script src="..." 
  data-site-key="your-key">
</script>`}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Runtime section */}
        <Section className="border-t border-white/[0.06] bg-[#0c0e12]/50">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left: Code */}
              <div className="order-2 lg:order-1">
                <CodeBlock 
                  label="TypeScript" 
                  code={`interface HostApi {
  searchFaq(query: string): Promise<FAQ[]>;
  createTicket(input: TicketInput): Promise<Ticket>;
  // Define your own methods
}`}
                />
              </div>

              {/* Right: Description */}
              <div className="order-1 lg:order-2">
                <p className="mb-3 text-[12px] font-medium uppercase tracking-widest text-[#0ea5e9]">Type-safe runtime</p>
                <h2 className="mb-5 text-[32px] font-semibold text-white">Tools your agents can call</h2>
                <p className="mb-6 text-[15px] leading-relaxed text-white/50">
                  Each agent gets a typed API to interact with your product. 
                  Agents can only call the methods you explicitly expose.
                </p>
                <div className="space-y-3">
                  <FeatureCard 
                    title="Support Agent" 
                    description="Answers questions using searchFaq and creates tickets."
                  />
                  <FeatureCard 
                    title="Onboarding Agent" 
                    description="Shows features and guides users through tutorials."
                  />
                  <FeatureCard 
                    title="Content Agent" 
                    description="Generates copy based on page context."
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Admin / Dashboard section */}
        <Section id="admin" className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12">
              <p className="mb-3 text-[12px] font-medium uppercase tracking-widest text-[#0ea5e9]">Dashboard</p>
              <h2 className="mb-5 text-[32px] font-semibold text-white">Configure from anywhere</h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-white/50">
                Update greeting, colors, and position from the hosted dashboard. 
                Changes take effect without code deploys.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Config form */}
              <GradientBorderCard>
                <div className="mb-6">
                  <h3 className="text-[15px] font-semibold text-white">Site configuration</h3>
                  <p className="mt-1 text-[13px] text-white/40">Update settings for your site</p>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Site URL</label>
                      <input
                        value={configForm.siteUrl}
                        onChange={(e) => setConfigForm((prev) => ({ ...prev, siteUrl: e.target.value }))}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-white placeholder:text-white/20 focus:border-[#0ea5e9] focus:outline-none"
                        placeholder="https://your-site.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Theme color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={configForm.themeColor}
                          onChange={(e) => setConfigForm((prev) => ({ ...prev, themeColor: e.target.value }))}
                          className="h-9 w-9 rounded-lg border border-white/[0.08] bg-transparent"
                        />
                        <input
                          value={configForm.themeColor}
                          onChange={(e) => setConfigForm((prev) => ({ ...prev, themeColor: e.target.value }))}
                          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-white focus:border-[#0ea5e9] focus:outline-none"
                          placeholder="#0ea5e9"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Greeting</label>
                    <input
                      value={configForm.greeting}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, greeting: e.target.value }))}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-white placeholder:text-white/20 focus:border-[#0ea5e9] focus:outline-none"
                      placeholder="Welcome back. How can I help?"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <ButtonPrimary onClick={saveHostedConfig}>
                      {configSaving ? "Saving..." : "Save settings"}
                    </ButtonPrimary>
                    <ButtonSecondary onClick={copyHostedSnippet}>Copy snippet</ButtonSecondary>
                  </div>
                  {configStatus && <p className="text-[13px] text-white/40">{configStatus}</p>}
                </div>
              </GradientBorderCard>

              {/* Indexing console */}
              <div>
                <div className="mb-6">
                  <h3 className="text-[15px] font-semibold text-white">Indexing console</h3>
                  <p className="mt-1 text-[13px] text-white/40">Monitor your site's content indexing</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <ButtonSecondary onClick={loadStatus}>
                    {statusLoading ? "Loading..." : "Load status"}
                  </ButtonSecondary>
                  <ButtonSecondary onClick={reindexCurrent}>Reindex site</ButtonSecondary>
                </div>

                {statusError && (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
                    {statusError}
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {statusLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                          <div className="h-4 w-32 rounded bg-white/10" />
                          <div className="mt-2 h-3 w-48 rounded bg-white/5" />
                        </div>
                      ))}
                    </div>
                  ) : statusItems.length === 0 ? (
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 text-[13px] text-white/40">
                      No indexed sites yet. Click "Load status" to check.
                    </div>
                  ) : (
                    statusItems.map((item) => (
                      <div key={item.key} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                        <p className="text-[14px] font-medium text-white">{item.key}</p>
                        <p className="mt-1 text-[12px] text-white/40">{item.url}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.pages.slice(0, 3).map((page, i) => (
                            <span key={i} className="rounded bg-white/[0.05] px-2 py-1 text-[11px] text-white/30">
                              {page.title || page.url}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* CTA section */}
        <Section className="border-t border-white/[0.06] bg-gradient-to-b from-transparent to-[#0ea5e9]/10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-[36px] font-semibold text-white">Ready to ship?</h2>
            <p className="mb-8 text-[16px] text-white/50">
              Launch the dock, connect your HostApi, and ship a hosted assistant in minutes.
            </p>
            <div className="flex justify-center gap-4">
              <ButtonPrimary>Open dashboard</ButtonPrimary>
              <ButtonSecondary>Install the CLI</ButtonSecondary>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-[#0c0e12]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
            <div className="flex items-center gap-3">
              <Logo className="scale-75" />
              <span className="text-[13px] text-white/40">Agent Plugin Bar</span>
            </div>
            <div className="flex items-center gap-6 text-[13px] text-white/40">
              <a href="#" className="transition-colors hover:text-white">GitHub</a>
              <a href="#" className="transition-colors hover:text-white">Twitter</a>
              <a href="#" className="transition-colors hover:text-white">Discord</a>
            </div>
            <p className="text-[12px] text-white/30">© 2024 All rights reserved.</p>
          </div>
        </footer>
      </main>

      {/* Agent Bar widget */}
      <AgentBar
        apiSchema={apiSchema}
        hostApi={hostApi}
        enabledAgents={["support", "onboarding", "content"]}
        position="right"
        llmProvider={llmProvider}
        theme={{
          accent: "#0ea5e9",
          background: "rgba(12, 14, 18, 0.96)",
          text: "#f7f8f8",
          muted: "#8a8f98",
          border: "rgba(255,255,255,0.08)",
          panelRadius: "16px",
          dockRadius: "14px",
          fontFamily: "Geist, Satoshi, ui-sans-serif",
          userBubbleBackground: "rgba(14, 165, 233, 0.15)",
          userBubbleText: "#f7f8f8",
          assistantBubbleBackground: "rgba(19, 22, 27, 0.95)",
          assistantBubbleText: "#f7f8f8",
          panelShadow: "0 25px 60px -40px rgba(0, 0, 0, 0.6)",
          dockShadow: "0 15px 40px -30px rgba(0, 0, 0, 0.5)",
        }}
        inputPlaceholder="Ask about this page"
        suggestions={["Search docs", "Summarize docs", "Draft marketing copy"]}
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
