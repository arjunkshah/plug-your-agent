import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChartLineUp,
  Compass,
  CaretDown,
  CaretUp,
  Lifebuoy,
  PaperPlaneRight,
  PencilLine,
  RocketLaunch,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import type { AgentPlugin, AgentStep, HostApi, HostApiSchema, LLMProvider } from "@arjun-shah/agentbar-runtime";
import { createAgentSession } from "@arjun-shah/agentbar-runtime";
import { defaultPlugins } from "./defaultPlugins";

export type AgentBarProps = {
  apiSchema: HostApiSchema;
  hostApi: HostApi;
  enabledAgents: string[];
  agents?: AgentPlugin[];
  position?: "left" | "right" | "bottom";
  llmProvider?: LLMProvider;
  openOnLoad?: boolean;
  closeOnOutsideClick?: boolean;
  inputPlaceholder?: string;
  sendLabel?: string;
  suggestions?: string[];
  greeting?: string;
  showReset?: boolean;
  persist?: boolean;
  storageKey?: string;
  badgeLabel?: string;
  closeOnEscape?: boolean;
  showMinimize?: boolean;
  minimizedOnLoad?: boolean;
  autoScroll?: boolean;
  autoScrollThreshold?: number;
  messageMaxWidth?: string;
  showScrollButton?: boolean;
  scrollLabel?: string;
  launcherTooltip?: string;
  theme?: {
    accent?: string;
    background?: string;
    text?: string;
    muted?: string;
    border?: string;
    panelRadius?: string;
    dockRadius?: string;
    fontFamily?: string;
    userBubbleBackground?: string;
    userBubbleText?: string;
    userBubbleBorder?: string;
    assistantBubbleBackground?: string;
    assistantBubbleText?: string;
    assistantBubbleBorder?: string;
    dockShadow?: string;
    panelShadow?: string;
  };
};

type AgentState = Record<string, AgentStep[]>;

type AgentStatus = Record<
  string,
  {
    sending: boolean;
    error: string | null;
  }
>;

const iconMap = {
  lifebuoy: Lifebuoy,
  rocket: RocketLaunch,
  pencil: PencilLine,
  compass: Compass,
  chart: ChartLineUp,
  sparkle: Sparkle,
} as const;

const getIcon = (plugin: AgentPlugin) => {
  const mapped = plugin.icon ? iconMap[plugin.icon as keyof typeof iconMap] : undefined;
  return mapped ?? iconMap[plugin.id as keyof typeof iconMap] ?? Sparkle;
};

const toRgba = (hex: string, alpha: number) => {
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
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return `rgba(5, 150, 105, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const AgentBar: React.FC<AgentBarProps> = ({
  apiSchema,
  hostApi,
  enabledAgents,
  agents,
  position = "right",
  llmProvider,
  openOnLoad,
  closeOnOutsideClick = true,
  inputPlaceholder,
  sendLabel = "Send message",
  suggestions,
  greeting,
  showReset = false,
  persist = false,
  storageKey,
  badgeLabel,
  closeOnEscape = true,
  showMinimize = false,
  minimizedOnLoad = false,
  autoScroll = true,
  autoScrollThreshold = 40,
  messageMaxWidth = "85%",
  showScrollButton = true,
  scrollLabel = "Scroll",
  launcherTooltip,
  theme,
}) => {
  const enabledPlugins = useMemo(() => {
    const source = agents ?? defaultPlugins;
    return source.filter((plugin) => enabledAgents.includes(plugin.id));
  }, [agents, enabledAgents]);

  const [activeAgentId, setActiveAgentId] = useState<string | null>(
    enabledPlugins[0]?.id ?? null
  );
  const [isOpen, setIsOpen] = useState(openOnLoad ?? enabledPlugins.length > 0);
  const [messages, setMessages] = useState<AgentState>({});
  const [status, setStatus] = useState<AgentStatus>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [panelOffsetY, setPanelOffsetY] = useState(0);
  const [isMinimized, setIsMinimized] = useState(minimizedOnLoad);
  const [scrollVisible, setScrollVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const hydratedRef = useRef(false);
  const greetedRef = useRef(new Set<string>());
  const dragState = useRef<{ startY: number; startOffset: number } | null>(null);

  const sessionMap = useRef(new Map<string, ReturnType<typeof createAgentSession>>());

  useEffect(() => {
    if (!enabledPlugins.length) {
      setActiveAgentId(null);
      setIsOpen(false);
      return;
    }
    if (!activeAgentId || !enabledPlugins.some((plugin) => plugin.id === activeAgentId)) {
      setActiveAgentId(enabledPlugins[0].id);
    }
  }, [activeAgentId, enabledPlugins]);

  useEffect(() => {
    sessionMap.current.clear();
  }, [hostApi, llmProvider]);

  useEffect(() => {
    if (!persist || hydratedRef.current || typeof window === "undefined") {
      return;
    }
    const key = storageKey ?? `agentbar:${window.location.host}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        hydratedRef.current = true;
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.messages && typeof parsed.messages === "object") {
        setMessages(parsed.messages);
      }
      if (typeof parsed.open === "boolean") {
        setIsOpen(parsed.open);
      }
      if (typeof parsed.minimized === "boolean") {
        setIsMinimized(parsed.minimized);
      }
    } catch (_error) {
      // ignore
    } finally {
      hydratedRef.current = true;
    }
  }, [persist, storageKey]);

  useEffect(() => {
    if (!persist || !hydratedRef.current || typeof window === "undefined") {
      return;
    }
    const key = storageKey ?? `agentbar:${window.location.host}`;
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({ messages, open: isOpen, minimized: isMinimized })
      );
    } catch (_error) {
      // ignore
    }
  }, [persist, storageKey, messages, isOpen, isMinimized]);

  useEffect(() => {
    setPanelOffsetY(0);
  }, [position]);

  useEffect(() => {
    if (!closeOnOutsideClick) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (panelRef.current?.contains(target) || dockRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [closeOnOutsideClick]);

  useEffect(() => {
    if (!closeOnEscape) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [closeOnEscape]);

  const contextCache = useRef<{ value: string; timestamp: number } | null>(null);

  const buildPageContext = useCallback(() => {
    if (typeof document === "undefined") {
      return null;
    }
    const now = Date.now();
    if (contextCache.current && now - contextCache.current.timestamp < 5000) {
      return contextCache.current.value;
    }

    const title = document.title || "Untitled page";
    const description =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const headings = Array.from(document.querySelectorAll("h1, h2"))
      .map((heading) => heading.textContent?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 8);
    const html = document.documentElement?.outerHTML ?? "";
    const maxLength = 12000;
    const htmlSnapshot = html.length > maxLength ? `${html.slice(0, maxLength)}...` : html;

    const contextParts = [
      `Page title: ${title}`,
      description ? `Meta description: ${description}` : "",
      headings.length ? `Headings: ${headings.join(" | ")}` : "",
      htmlSnapshot ? `HTML snapshot (truncated): ${htmlSnapshot}` : "",
    ].filter(Boolean);

    const context = contextParts.join("\n");
    contextCache.current = { value: context, timestamp: now };
    return context;
  }, []);

  const getSession = (plugin: AgentPlugin) => {
    if (!sessionMap.current.has(plugin.id)) {
      sessionMap.current.set(
        plugin.id,
        createAgentSession(plugin, hostApi, { llmProvider, contextProvider: buildPageContext })
      );
    }
    return sessionMap.current.get(plugin.id)!;
  };

  const activeAgent = enabledPlugins.find((plugin) => plugin.id === activeAgentId) ?? null;
  const inputId = activeAgent ? `agent-input-${activeAgent.id}` : "agent-input";
  const panelBaseTop = 96;
  const hostEndpoints = useMemo(() => {
    const schemaKeys = Object.keys(apiSchema ?? {});
    if (schemaKeys.length > 0) {
      return schemaKeys;
    }
    return Object.keys(hostApi ?? {});
  }, [apiSchema, hostApi]);

  const dockPosition =
    position === "left"
      ? "left-6 top-24"
      : position === "right"
        ? "right-6 top-24"
        : "left-1/2 -translate-x-1/2 bottom-4";

  const dockLayout = position === "bottom" ? "flex-row" : "flex-col";

  const panelPosition =
    position === "left"
      ? "left-24"
      : position === "right"
        ? "right-24"
        : "left-1/2 -translate-x-1/2 bottom-20";

  const panelStyle =
    position === "bottom"
      ? undefined
      : {
          top: panelBaseTop + panelOffsetY,
        };

  const themeVars = useMemo(
    () => {
      const accent = theme?.accent ?? "#059669";
      const userBg = theme?.userBubbleBackground ?? toRgba(accent, 0.12);
      const userText = theme?.userBubbleText ?? accent;
      const userBorder = theme?.userBubbleBorder ?? toRgba(accent, 0.3);
      const assistantBg = theme?.assistantBubbleBackground ?? "#f8fafc";
      const assistantText = theme?.assistantBubbleText ?? (theme?.text ?? "#0f172a");
      const assistantBorder = theme?.assistantBubbleBorder ?? (theme?.border ?? "rgba(226,232,240,0.8)");
      return {
        "--agentbar-accent": accent,
        "--agentbar-accent-soft": toRgba(accent, 0.12),
        "--agentbar-accent-strong": toRgba(accent, 0.2),
        "--agentbar-accent-border": toRgba(accent, 0.3),
        "--agentbar-panel-bg": theme?.background ?? "rgba(255,255,255,0.95)",
        "--agentbar-text": theme?.text ?? "#0f172a",
        "--agentbar-muted": theme?.muted ?? "#64748b",
        "--agentbar-border": theme?.border ?? "rgba(226,232,240,0.8)",
        "--agentbar-panel-radius": theme?.panelRadius ?? "16px",
        "--agentbar-dock-radius": theme?.dockRadius ?? "16px",
        "--agentbar-user-bg": userBg,
        "--agentbar-user-text": userText,
        "--agentbar-user-border": userBorder,
        "--agentbar-assistant-bg": assistantBg,
        "--agentbar-assistant-text": assistantText,
        "--agentbar-assistant-border": assistantBorder,
        fontFamily: theme?.fontFamily ?? "inherit",
      };
    },
    [theme]
  ) as React.CSSProperties;

  const dockStyle = theme?.dockShadow ? { ...themeVars, boxShadow: theme.dockShadow } : themeVars;

  const updateScrollState = useCallback(() => {
    if (!bodyRef.current) {
      return;
    }
    const threshold = autoScrollThreshold;
    const distance =
      bodyRef.current.scrollHeight - bodyRef.current.scrollTop - bodyRef.current.clientHeight;
    const nearBottom = distance < threshold;
    nearBottomRef.current = nearBottom;
    if (showScrollButton) {
      setScrollVisible(!nearBottom);
    }
  }, [autoScrollThreshold, showScrollButton]);

  useEffect(() => {
    updateScrollState();
  }, [messages, activeAgentId, updateScrollState]);

  useEffect(() => {
    if (!autoScroll || !nearBottomRef.current || !bodyRef.current) {
      return;
    }
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, activeAgentId, autoScroll]);

  const stopDrag = useCallback(() => {
    dragState.current = null;
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragState.current || position === "bottom") {
        return;
      }
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const maxTop = Math.max(16, window.innerHeight - panelHeight - 16);
      const nextTop = dragState.current.startOffset + (event.clientY - dragState.current.startY);
      const clampedOffset = Math.min(
        Math.max(nextTop, 16 - panelBaseTop),
        maxTop - panelBaseTop
      );
      setPanelOffsetY(clampedOffset);
    },
    [panelBaseTop, position]
  );

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDrag);
    };
  }, [handlePointerMove, stopDrag]);

  const handleSend = async (overrideMessage?: string) => {
    if (!activeAgent) {
      return;
    }

    const currentInput = overrideMessage ?? inputs[activeAgent.id]?.trim() ?? "";
    if (!currentInput) {
      return;
    }

    const agentId = activeAgent.id;
    setInputs((prev) => ({ ...prev, [agentId]: "" }));
    setMessages((prev) => ({
      ...prev,
      [agentId]: [...(prev[agentId] ?? []), { role: "user", content: currentInput }],
    }));
    setStatus((prev) => ({
      ...prev,
      [agentId]: {
        sending: true,
        error: null,
      },
    }));

    let streamingIndex: number | null = null;
    const handleToken = (token: string) => {
      if (!token) {
        return;
      }
      setMessages((prev) => {
        const current = [...(prev[agentId] ?? [])];
        if (streamingIndex === null) {
          streamingIndex = current.length;
          current.push({ role: "assistant", content: token });
        } else {
          const existing = current[streamingIndex];
          current[streamingIndex] = {
            ...existing,
            content: `${existing?.content ?? ""}${token}`,
          };
        }
        return { ...prev, [agentId]: current };
      });
    };

    try {
      const steps = await getSession(activeAgent).sendMessage(currentInput, {
        onToken: handleToken,
      });
      setMessages((prev) => ({
        ...prev,
        [agentId]: [
          ...(() => {
            const current = [...(prev[agentId] ?? [])];
            if (streamingIndex !== null && current[streamingIndex]?.role === "assistant") {
              current.splice(streamingIndex, 1);
            }
            return current;
          })(),
          ...steps.filter((step, index) => !(index === 0 && step.role === "user")),
        ],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const index = streamingIndex;
      if (index !== null) {
        setMessages((prev) => {
          const current = [...(prev[agentId] ?? [])];
          if (current[index]?.role === "assistant") {
            current.splice(index, 1);
          }
          return { ...prev, [agentId]: current };
        });
      }
      setStatus((prev) => ({
        ...prev,
        [agentId]: {
          sending: false,
          error: message,
        },
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      [agentId]: {
        sending: false,
        error: null,
      },
    }));
  };

  useEffect(() => {
    if (!greeting || !activeAgent || !isOpen) {
      return;
    }
    if (isMinimized) {
      return;
    }
    if (greetedRef.current.has(activeAgent.id)) {
      return;
    }
    if ((messages[activeAgent.id] ?? []).length > 0) {
      return;
    }
    greetedRef.current.add(activeAgent.id);
    setMessages((prev) => ({
      ...prev,
      [activeAgent.id]: [
        ...(prev[activeAgent.id] ?? []),
        { role: "assistant", content: greeting },
      ],
    }));
  }, [activeAgent, greeting, isOpen, isMinimized, messages]);

  useEffect(() => {
    if (isMinimized) {
      setScrollVisible(false);
    }
  }, [isMinimized]);

  if (!enabledPlugins.length) {
    return null;
  }

  const suggestionItems =
    suggestions && suggestions.length > 0
      ? suggestions
      : ["Search FAQs", "Draft copy", "Open a ticket"];

  const handleAgentClick = (pluginId: string) => {
    setActiveAgentId((current) => {
      if (current === pluginId) {
        setIsOpen((open) => !open);
        return current;
      }
      setIsOpen(true);
      setIsMinimized(false);
      return pluginId;
    });
  };

  const handleDragStart = (event: React.PointerEvent) => {
    if (position === "bottom") {
      return;
    }
    dragState.current = {
      startY: event.clientY,
      startOffset: panelOffsetY,
    };
  };

  return (
    <>
      <div ref={dockRef} className={`fixed ${dockPosition} z-30 pointer-events-none`}>
        <div
          style={dockStyle}
          className={`pointer-events-auto relative flex ${dockLayout} items-center gap-2 rounded-[var(--agentbar-dock-radius)] border border-[color:var(--agentbar-border)] bg-[color:var(--agentbar-panel-bg)] px-2 py-3 text-[color:var(--agentbar-text)] shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] backdrop-blur`}
        >
          {badgeLabel ? (
            <span className="pointer-events-none absolute -top-2 -right-2 rounded-full border border-white/40 bg-[color:var(--agentbar-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
              {badgeLabel}
            </span>
          ) : null}
          {enabledPlugins.map((plugin) => {
            const Icon = getIcon(plugin);
            const isActive = plugin.id === activeAgentId && isOpen;
            return (
              <button
                key={plugin.id}
                type="button"
                aria-pressed={isActive}
                aria-label={`${plugin.name} agent`}
                title={launcherTooltip ?? plugin.name}
                onClick={() => handleAgentClick(plugin.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[color:var(--agentbar-muted)] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--agentbar-accent-border)] ${
                  isActive
                    ? "bg-[color:var(--agentbar-accent-soft)] text-[color:var(--agentbar-accent)]"
                    : "bg-slate-100 hover:bg-slate-200/80"
                } active:translate-y-[1px]`}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} />
              </button>
            );
          })}
        </div>
      </div>

      {activeAgent && isOpen ? (
        <div
          ref={panelRef}
          style={{
            ...panelStyle,
            ...themeVars,
            boxShadow: theme?.panelShadow,
          }}
          className={`fixed ${panelPosition} z-20 w-[92vw] max-w-[400px] rounded-[var(--agentbar-panel-radius)] border border-[color:var(--agentbar-border)] bg-[color:var(--agentbar-panel-bg)] p-4 text-[color:var(--agentbar-text)] shadow-[0_35px_70px_-50px_rgba(15,23,42,0.35)] backdrop-blur sm:w-[400px] relative`}
        >
          <div
            onPointerDown={handleDragStart}
            className="flex cursor-grab flex-col gap-3 border-b border-[color:var(--agentbar-border)] pb-4 active:cursor-grabbing"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--agentbar-border)] bg-slate-50 text-[color:var(--agentbar-text)]">
                  {(() => {
                    const Icon = getIcon(activeAgent);
                    return <Icon size={20} weight="fill" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--agentbar-text)]">
                    {activeAgent.name}
                  </p>
                  <p className="text-xs text-[color:var(--agentbar-muted)]">{activeAgent.description}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close agent panel"
                onClick={() => setIsOpen(false)}
                onPointerDown={(event) => event.stopPropagation()}
                className="rounded-lg border border-slate-200 bg-slate-100 p-1 text-slate-500 transition hover:bg-slate-200/70 active:translate-y-[1px]"
              >
                <X size={16} />
              </button>
            </div>
            {showMinimize ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-label={isMinimized ? "Expand panel" : "Minimize panel"}
                  onClick={() => setIsMinimized((value) => !value)}
                  className="rounded-full border border-[color:var(--agentbar-border)] bg-white px-3 py-1 text-[11px] text-[color:var(--agentbar-text)] transition hover:bg-slate-100 active:translate-y-[1px]"
                >
                  {isMinimized ? <CaretUp size={12} /> : <CaretDown size={12} />}
                </button>
              </div>
            ) : null}
            {showReset ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!activeAgent) {
                      return;
                    }
                    setMessages((prev) => ({ ...prev, [activeAgent.id]: [] }));
                  }}
                  className="rounded-full border border-[color:var(--agentbar-border)] bg-white px-3 py-1 text-[11px] text-[color:var(--agentbar-text)] transition hover:bg-slate-100 active:translate-y-[1px]"
                >
                  Reset
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[color:var(--agentbar-muted)]">
              <span className="rounded-full border border-[color:var(--agentbar-border)] bg-slate-50 px-2 py-1">
                Tools {activeAgent.tools.length}
              </span>
              <span className="rounded-full border border-[color:var(--agentbar-border)] bg-slate-50 px-2 py-1">
                Host API {hostEndpoints.length}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-600">
            {activeAgent.tools.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeAgent.tools.map((tool) => (
                  <span
                    key={tool.name}
                    className="rounded-full border border-[color:var(--agentbar-accent-border)] bg-[color:var(--agentbar-accent-soft)] px-3 py-1 text-[color:var(--agentbar-accent)]"
                  >
                    {tool.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[color:var(--agentbar-border)] bg-slate-50 px-3 py-2 text-[color:var(--agentbar-muted)]">
                No tools are configured for this agent yet.
              </p>
            )}
            {hostEndpoints.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-[11px] text-[color:var(--agentbar-muted)]">
                {hostEndpoints.slice(0, 6).map((endpoint) => (
                  <span
                    key={endpoint}
                    className="rounded-full border border-[color:var(--agentbar-border)] px-2 py-1"
                  >
                    {endpoint}
                  </span>
                ))}
                {hostEndpoints.length > 6 ? (
                  <span className="rounded-full border border-[color:var(--agentbar-border)] px-2 py-1 text-slate-400">
                    +{hostEndpoints.length - 6} more
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[color:var(--agentbar-border)] bg-slate-50 px-3 py-2 text-[color:var(--agentbar-muted)]">
                No host API endpoints connected. Provide functions on the hostApi prop to enable tool
                calls.
              </p>
            )}
          </div>

          {!isMinimized ? (
            <div
              ref={bodyRef}
              onScroll={updateScrollState}
              className="mt-3 flex max-h-[52vh] flex-col gap-3 overflow-y-auto pr-1"
            >
            {(messages[activeAgent.id] ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--agentbar-border)] bg-slate-50 px-4 py-6 text-xs text-[color:var(--agentbar-muted)]">
                <p className="font-semibold text-[color:var(--agentbar-text)]">Start a new thread</p>
                <p className="mt-1 text-[color:var(--agentbar-muted)]">
                  Ask for help, request a task, or explore what this agent can do.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  {suggestionItems.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSend(suggestion)}
                      className="rounded-full border border-[color:var(--agentbar-border)] bg-white px-3 py-1 text-[color:var(--agentbar-text)] transition hover:bg-slate-100 active:translate-y-[1px]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              (messages[activeAgent.id] ?? []).map((step, index) => (
                <div key={`${activeAgent.id}-${index}`}>
                  {step.role === "tool" ? (
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700/70">
                      {step.content}
                    </p>
                  ) : (
                    <div className={`flex ${step.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      style={{ maxWidth: messageMaxWidth }}
                      className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        step.role === "user"
                          ? "border border-[color:var(--agentbar-user-border)] bg-[color:var(--agentbar-user-bg)] text-[color:var(--agentbar-user-text)]"
                          : "border border-[color:var(--agentbar-assistant-border)] bg-[color:var(--agentbar-assistant-bg)] text-[color:var(--agentbar-assistant-text)]"
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans">{step.content}</pre>
                    </div>
                  </div>
                  )}
                </div>
              ))
            )}

            {status[activeAgent.id]?.sending ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 animate-pulse">
                Agent is working on the request.
              </div>
            ) : null}

            {status[activeAgent.id]?.error ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Agent error: {status[activeAgent.id]?.error}
              </div>
            ) : null}
          </div>
          ) : null}

          {!isMinimized ? (
          <div className="mt-4 border-t border-[color:var(--agentbar-border)] pt-3">
            <label
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--agentbar-muted)]"
              htmlFor={inputId}
            >
              Message
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id={inputId}
                type="text"
                value={inputs[activeAgent.id] ?? ""}
                onChange={(event) =>
                  setInputs((prev) => ({ ...prev, [activeAgent.id]: event.target.value }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                aria-label={inputPlaceholder ?? `Message ${activeAgent.name}`}
                placeholder={inputPlaceholder ?? `Ask ${activeAgent.name}...`}
                className="w-full rounded-xl border border-[color:var(--agentbar-border)] bg-white px-3 py-2 text-sm text-[color:var(--agentbar-text)] placeholder:text-slate-400 focus:border-[color:var(--agentbar-accent-border)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={status[activeAgent.id]?.sending}
                aria-label={sendLabel}
                title={sendLabel}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--agentbar-accent-border)] bg-[color:var(--agentbar-accent-soft)] text-[color:var(--agentbar-accent)] transition hover:bg-[color:var(--agentbar-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[1px]"
              >
                <PaperPlaneRight size={18} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {hostEndpoints.length > 0
                ? `Connected to ${hostEndpoints.length} host API endpoints.`
                : "Connect host API endpoints to enable tool calls."}
            </p>
          </div>
          ) : null}
          {showScrollButton && scrollVisible && !isMinimized ? (
            <button
              type="button"
              onClick={() => {
                if (!bodyRef.current) {
                  return;
                }
                bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
                updateScrollState();
              }}
              className="absolute bottom-4 right-4 rounded-full border border-[color:var(--agentbar-border)] bg-white px-3 py-1 text-[11px] text-[color:var(--agentbar-text)] shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]"
            >
              {scrollLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
};
