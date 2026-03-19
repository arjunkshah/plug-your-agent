import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChartLineUp,
  Compass,
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

export const AgentBar: React.FC<AgentBarProps> = ({
  apiSchema,
  hostApi,
  enabledAgents,
  agents,
  position = "right",
  llmProvider,
}) => {
  const enabledPlugins = useMemo(() => {
    const source = agents ?? defaultPlugins;
    return source.filter((plugin) => enabledAgents.includes(plugin.id));
  }, [agents, enabledAgents]);

  const [activeAgentId, setActiveAgentId] = useState<string | null>(
    enabledPlugins[0]?.id ?? null
  );
  const [isOpen, setIsOpen] = useState(enabledPlugins.length > 0);
  const [messages, setMessages] = useState<AgentState>({});
  const [status, setStatus] = useState<AgentStatus>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [panelOffsetY, setPanelOffsetY] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
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
    setPanelOffsetY(0);
  }, [position]);

  const getSession = (plugin: AgentPlugin) => {
    if (!sessionMap.current.has(plugin.id)) {
      sessionMap.current.set(plugin.id, createAgentSession(plugin, hostApi, { llmProvider }));
    }
    return sessionMap.current.get(plugin.id)!;
  };

  const activeAgent = enabledPlugins.find((plugin) => plugin.id === activeAgentId) ?? null;
  const inputId = activeAgent ? `agent-input-${activeAgent.id}` : "agent-input";
  const panelBaseTop = 32;

  const dockPosition =
    position === "left"
      ? "left-4 top-1/2 -translate-y-1/2"
      : position === "right"
        ? "right-4 top-1/2 -translate-y-1/2"
        : "left-1/2 -translate-x-1/2 bottom-4";

  const dockLayout = position === "bottom" ? "flex-row" : "flex-col";

  const panelPosition =
    position === "left"
      ? "left-20"
      : position === "right"
        ? "right-20"
        : "left-1/2 -translate-x-1/2 bottom-20";

  const panelStyle =
    position === "bottom"
      ? undefined
      : {
          top: panelBaseTop + panelOffsetY,
        };

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

  const handleSend = async () => {
    if (!activeAgent) {
      return;
    }

    const currentInput = inputs[activeAgent.id]?.trim() ?? "";
    if (!currentInput) {
      return;
    }

    setInputs((prev) => ({ ...prev, [activeAgent.id]: "" }));
    setStatus((prev) => ({
      ...prev,
      [activeAgent.id]: {
        sending: true,
        error: null,
      },
    }));

    try {
      const steps = await getSession(activeAgent).sendMessage(currentInput);
      setMessages((prev) => ({
        ...prev,
        [activeAgent.id]: [...(prev[activeAgent.id] ?? []), ...steps],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus((prev) => ({
        ...prev,
        [activeAgent.id]: {
          sending: false,
          error: message,
        },
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      [activeAgent.id]: {
        sending: false,
        error: null,
      },
    }));
  };

  if (!enabledPlugins.length) {
    return null;
  }

  const handleAgentClick = (pluginId: string) => {
    setActiveAgentId((current) => {
      if (current === pluginId) {
        setIsOpen((open) => !open);
        return current;
      }
      setIsOpen(true);
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
      <div className={`fixed ${dockPosition} z-30 pointer-events-none`}>
        <div
          className={`pointer-events-auto flex ${dockLayout} items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-2 py-3 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] backdrop-blur`}
        >
          {enabledPlugins.map((plugin) => {
            const Icon = getIcon(plugin);
            const isActive = plugin.id === activeAgentId && isOpen;
            return (
              <button
                key={plugin.id}
                type="button"
                aria-pressed={isActive}
                aria-label={`${plugin.name} agent`}
                onClick={() => handleAgentClick(plugin.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-600 transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                  isActive
                    ? "bg-emerald-600/10 text-emerald-700"
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
          style={panelStyle}
          className={`fixed ${panelPosition} z-20 w-[92vw] max-w-[380px] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_35px_70px_-50px_rgba(15,23,42,0.35)] backdrop-blur sm:w-[380px]`}
        >
          <div
            onPointerDown={handleDragStart}
            className="flex cursor-grab items-start justify-between gap-3 border-b border-slate-200 pb-3 active:cursor-grabbing"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{activeAgent.name}</p>
              <p className="text-xs text-slate-500">{activeAgent.description}</p>
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

          <div className="mt-3 flex max-h-[52vh] flex-col gap-3 overflow-y-auto pr-1">
            {(messages[activeAgent.id] ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-xs text-slate-500">
                Start with a question or a task for this agent. Try searching FAQs or asking for copy.
              </div>
            ) : (
              (messages[activeAgent.id] ?? []).map((step, index) => (
                <div key={`${activeAgent.id}-${index}`}>
                  {step.role === "tool" ? (
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700/70">
                      {step.content}
                    </p>
                  ) : (
                    <div
                      className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        step.role === "user"
                          ? "border border-emerald-600/20 bg-emerald-600/10 text-emerald-700"
                          : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans">{step.content}</pre>
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

          <div className="mt-4 border-t border-slate-200 pt-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500" htmlFor={inputId}>
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
                placeholder={`Ask ${activeAgent.name}...`}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={status[activeAgent.id]?.sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 transition hover:bg-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[1px]"
              >
                <PaperPlaneRight size={18} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Connected to host API schema with {Object.keys(apiSchema ?? {}).length} endpoints.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
};
