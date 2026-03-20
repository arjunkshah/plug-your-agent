export type AgentRole = "user" | "assistant" | "tool";

export interface AgentStep {
  role: AgentRole;
  content: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
}

export interface HostApi {
  searchFaq(query: string): Promise<{ title: string; snippet: string; url: string }[]>;
  createTicket(input: {
    subject: string;
    body: string;
    userId?: string;
  }): Promise<{ ticketId: string }>;
  listKeyFeatures(): Promise<string[]>;
  openTutorial(id: string): Promise<void>;
  getPageContext(): Promise<{ pageName: string; hints: string[] }>;
  suggestCopy(area: string): Promise<string>;
}

export type HostApiSchema = Record<
  string,
  {
    description: string;
    input?: string;
    output?: string;
  }
>;

export interface ToolDefinition<Input = any, Output = any> {
  name: string;
  description: string;
  inputSchema?: unknown;
  handler: (input: Input, hostApi: HostApi) => Promise<Output>;
}

export interface AgentPlugin {
  id: string;
  name: string;
  icon?: string;
  description: string;
  systemPrompt: string;
  tools: ToolDefinition<any, any>[];
}

export interface AgentSession {
  sendMessage: (
    userMessage: string,
    options?: { onToken?: (token: string) => void }
  ) => Promise<AgentStep[]>;
}

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMProvider {
  generate: (input: {
    messages: LLMMessage[];
    tools: ToolDefinition[];
    plugin: AgentPlugin;
  }) => Promise<string>;
  generateStream?: (input: {
    messages: LLMMessage[];
    tools: ToolDefinition[];
    plugin: AgentPlugin;
  }) => AsyncIterable<string>;
}

export interface CreateAgentSessionOptions {
  llmProvider?: LLMProvider;
}

export interface OpenAIProviderOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface ProxyProviderOptions {
  endpoint: string;
  siteUrl?: string;
  headers?: Record<string, string>;
}

export const createOpenAIProvider = ({
  apiKey,
  model = "gpt-4o-mini",
  baseUrl = "https://api.openai.com/v1",
}: OpenAIProviderOptions): LLMProvider => {
  return {
    generate: async ({ messages }) => {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`OpenAI error: ${response.status} ${detail}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return data.choices?.[0]?.message?.content?.trim() ?? "";
    },
  };
};

export const createProxyProvider = ({
  endpoint,
  siteUrl,
  headers,
}: ProxyProviderOptions): LLMProvider => {
  return {
    generate: async ({ messages }) => {
      const resolvedSiteUrl =
        siteUrl ?? (typeof window !== "undefined" ? window.location.origin : undefined);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(headers ?? {}),
        },
        body: JSON.stringify({
          siteUrl: resolvedSiteUrl,
          messages,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Proxy error: ${response.status} ${detail}`);
      }

      const data = (await response.json()) as { content?: string };
      return data.content?.trim() ?? "";
    },
    generateStream: async function* ({ messages }) {
      const resolvedSiteUrl =
        siteUrl ?? (typeof window !== "undefined" ? window.location.origin : undefined);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(headers ?? {}),
        },
        body: JSON.stringify({
          siteUrl: resolvedSiteUrl,
          stream: true,
          messages,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Proxy error: ${response.status} ${detail}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const data = (await response.json()) as { content?: string };
        if (data.content) {
          yield data.content;
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) {
            continue;
          }
          const payload = trimmed.replace(/^data:\s*/, "");
          if (payload === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(payload) as {
              token?: string;
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = parsed.token ?? parsed.choices?.[0]?.delta?.content;
            if (token) {
              yield token;
            }
          } catch (_error) {
            // Ignore parse errors.
          }
        }
      }
    },
  };
};

const toLower = (value: string) => value.trim().toLowerCase();

const extractAfter = (text: string, needle: string) => {
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index === -1) {
    return "";
  }
  return text.slice(index + needle.length).trim();
};

const resolveTool = (plugin: AgentPlugin, message: string) => {
  const content = toLower(message);
  const hasTool = (name: string) => plugin.tools.some((tool) => tool.name === name);

  if ((content.includes("create ticket") || content.includes("open ticket")) && hasTool("createTicket")) {
    return "createTicket";
  }
  if ((content.includes("faq") || content.includes("search")) && hasTool("searchFaq")) {
    return "searchFaq";
  }
  if (content.includes("feature") && hasTool("listKeyFeatures")) {
    return "listKeyFeatures";
  }
  if ((content.includes("tutorial") || content.includes("onboarding")) && hasTool("openTutorial")) {
    return "openTutorial";
  }
  if ((content.includes("page context") || content.includes("context")) && hasTool("getPageContext")) {
    return "getPageContext";
  }
  if (
    (content.includes("copy") || content.includes("headline") || content.includes("tagline")) &&
    hasTool("suggestCopy")
  ) {
    return "suggestCopy";
  }

  return null;
};

const buildToolInput = (toolName: string, message: string) => {
  switch (toolName) {
    case "createTicket": {
      const topic = extractAfter(message, "about") || extractAfter(message, "for");
      const subject = topic ? `Support request: ${topic}` : "Support request";
      return {
        subject,
        body: message,
      };
    }
    case "searchFaq": {
      const query = extractAfter(message, "faq") || extractAfter(message, "search") || message;
      return { query };
    }
    case "openTutorial": {
      const id = extractAfter(message, "tutorial") || "getting-started";
      return { id };
    }
    case "suggestCopy": {
      const area = extractAfter(message, "for") || "homepage";
      return { area };
    }
    case "listKeyFeatures":
    case "getPageContext":
      return undefined;
    default:
      return undefined;
  }
};

const formatAssistantReply = (toolName: string, result: unknown) => {
  switch (toolName) {
    case "searchFaq": {
      const items = Array.isArray(result) ? result : [];
      if (!items.length) {
        return "I did not find a close match in the FAQ. Want to open a ticket instead?";
      }
      const top = items.slice(0, 2).map((item: any) => `- ${item.title}`);
      return `Here are a few FAQ matches:\n${top.join("\n")}`;
    }
    case "createTicket": {
      const ticketId = (result as { ticketId?: string })?.ticketId ?? "pending";
      return `Ticket created. Reference: ${ticketId}. I can add more details if needed.`;
    }
    case "listKeyFeatures": {
      const features = Array.isArray(result) ? result : [];
      if (!features.length) {
        return "No feature list is available yet. Want me to request one from the host app?";
      }
      return `Key features:\n${features.map((item: string) => `- ${item}`).join("\n")}`;
    }
    case "openTutorial": {
      return "Tutorial opened. Let me know where you want to pause or review.";
    }
    case "getPageContext": {
      const context = result as { pageName?: string; hints?: string[] };
      const hints = context?.hints ?? [];
      const hintLine = hints.length ? `Hints: ${hints.join(", ")}.` : "";
      return `Page context loaded for ${context?.pageName ?? "this page"}. ${hintLine}`.trim();
    }
    case "suggestCopy": {
      if (typeof result === "string") {
        return `Here is a copy suggestion:\n${result}`;
      }
      return "Copy suggestion is ready.";
    }
    default:
      return "I can help with that. Tell me more about the task.";
  }
};

const toolCallRule =
  "When you need a tool, respond with: TOOL: toolName {\"arg\":\"value\"}.";

const buildSystemPrompt = (plugin: AgentPlugin, options?: { disableTools?: boolean }) => {
  const lines = [plugin.systemPrompt.trim()];

  if (plugin.tools.length) {
    if (options?.disableTools) {
      lines.push("Do not call tools. Provide the final response only.");
    } else {
      lines.push(toolCallRule);
      lines.push("Available tools:");
      lines.push(
        plugin.tools
          .map((tool) => `- ${tool.name}: ${tool.description}`)
          .join("\n")
      );
    }
  }

  return lines.filter(Boolean).join("\n\n");
};

const serializeToolResult = (result: unknown) => {
  if (typeof result === "string") {
    return result;
  }
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

const buildLLMMessages = (
  plugin: AgentPlugin,
  steps: AgentStep[],
  options?: { disableTools?: boolean; followupUserMessage?: string }
): LLMMessage[] => {
  const messages: LLMMessage[] = [
    { role: "system", content: buildSystemPrompt(plugin, { disableTools: options?.disableTools }) },
  ];

  steps.forEach((step) => {
    if (step.role === "user") {
      messages.push({ role: "user", content: step.content });
      return;
    }
    if (step.role === "assistant") {
      messages.push({ role: "assistant", content: step.content });
      return;
    }
    if (step.role === "tool") {
      const toolName = step.toolName ?? "tool";
      const toolResult = serializeToolResult(step.toolResult);
      messages.push({
        role: "assistant",
        content: `Tool ${toolName} result:\n${toolResult}`,
      });
    }
  });

  if (options?.followupUserMessage) {
    messages.push({ role: "user", content: options.followupUserMessage });
  }

  return messages;
};

const parseToolCall = (content: string) => {
  const match = content.match(/^\s*TOOL:\s*([a-zA-Z0-9_-]+)\s*(\{[\s\S]*\})?\s*$/);
  if (!match) {
    return null;
  }

  const name = match[1];
  const rawInput = match[2];
  if (!rawInput) {
    return { name, input: undefined };
  }

  try {
    return { name, input: JSON.parse(rawInput) };
  } catch {
    return null;
  }
};

export const createAgentSession = (
  plugin: AgentPlugin,
  hostApi: HostApi,
  options: CreateAgentSessionOptions = {}
): AgentSession => {
  const history: AgentStep[] = [];

  return {
    sendMessage: async (userMessage: string, sendOptions) => {
      const steps: AgentStep[] = [];
      const userStep: AgentStep = { role: "user", content: userMessage };
      steps.push(userStep);

      let llmReply: string | null = null;
      let parsedTool: { name: string; input: unknown } | null = null;
      const onToken = sendOptions?.onToken;
      const canStream = Boolean(onToken && options.llmProvider?.generateStream);

      const generateWithProvider = async (
        messages: LLMMessage[],
        streamCallback?: (token: string) => void
      ) => {
        if (!options.llmProvider) {
          return "";
        }
        if (streamCallback && options.llmProvider.generateStream) {
          let content = "";
          for await (const token of options.llmProvider.generateStream({
            messages,
            tools: plugin.tools,
            plugin,
          })) {
            content += token;
            streamCallback(token);
          }
          return content.trim();
        }

        const response = await options.llmProvider.generate({
          messages,
          tools: plugin.tools,
          plugin,
        });
        return response?.trim() ?? "";
      };

      if (options.llmProvider && !canStream) {
        try {
          llmReply = await options.llmProvider.generate({
            messages: buildLLMMessages(plugin, [...history, userStep]),
            tools: plugin.tools,
            plugin,
          });
          if (llmReply && !llmReply.trim()) {
            llmReply = null;
          }
          if (llmReply) {
            parsedTool = parseToolCall(llmReply);
          }
        } catch {
          llmReply = null;
          parsedTool = null;
        }
      }

      const toolName =
        parsedTool?.name && plugin.tools.some((tool) => tool.name === parsedTool?.name)
          ? parsedTool.name
          : options.llmProvider && llmReply
            ? null
            : resolveTool(plugin, userMessage);

      if (parsedTool && !toolName) {
        steps.push({
          role: "assistant",
          content: "That tool is not available in this agent.",
        });
        history.push(...steps);
        return steps;
      }

      if (!toolName) {
        let assistantContent = llmReply ?? "";
        if (!assistantContent && options.llmProvider) {
          try {
            assistantContent = await generateWithProvider(
              buildLLMMessages(plugin, [...history, userStep]),
              canStream ? onToken : undefined
            );
          } catch {
            assistantContent = "";
          }
        }
        if (!assistantContent) {
          assistantContent =
            "I can help with that. Try asking for a task like searching docs or drafting copy.";
        }
        steps.push({
          role: "assistant",
          content: assistantContent,
        });
        history.push(...steps);
        return steps;
      }

      const tool = plugin.tools.find((item) => item.name === toolName);
      if (!tool) {
        steps.push({
          role: "assistant",
          content: "That tool is not available in this agent.",
        });
        history.push(...steps);
        return steps;
      }

      const toolInput = parsedTool?.input ?? buildToolInput(toolName, userMessage);
      const toolStep: AgentStep = {
        role: "tool",
        content: `${plugin.name} used ${toolName}.`,
        toolName,
        toolInput,
      };
      steps.push(toolStep);

      try {
        const toolResult = await tool.handler(toolInput as never, hostApi);
        toolStep.toolResult = toolResult;

        let assistantContent = formatAssistantReply(toolName, toolResult);
        if (options.llmProvider) {
          try {
            const followup = await generateWithProvider(
              buildLLMMessages(plugin, [...history, userStep, toolStep], {
                disableTools: true,
                followupUserMessage:
                  "Summarize the tool result for the user with clear next steps. Do not call tools.",
              }),
              canStream ? onToken : undefined
            );

            if (followup) {
              assistantContent = followup;
            }
          } catch {
            // Keep formatted tool reply.
          }
        }

        steps.push({
          role: "assistant",
          content: assistantContent,
          toolName,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        steps.push({
          role: "assistant",
          content: `There was a problem running ${toolName}: ${message}.`,
          toolName,
        });
      }

      history.push(...steps);
      return steps;
    },
  };
};
