import type { AgentPlugin, HostApi, ToolDefinition } from "@arjun-shah/agentbar-runtime";

const defineTool = <Input, Output>(tool: ToolDefinition<Input, Output>) => tool;

export const defaultPlugins: AgentPlugin[] = [
  {
    id: "support",
    name: "Support Desk",
    icon: "lifebuoy",
    description: "Resolve questions and log support tickets with the host team.",
    systemPrompt:
      "You are the Support Desk agent. Answer clearly, search FAQs first, and create tickets when needed.",
    tools: [
      defineTool<{ query: string }, Awaited<ReturnType<HostApi["searchFaq"]>>>(
        {
          name: "searchFaq",
          description: "Search the product FAQ and return relevant entries.",
          inputSchema: { query: "string" },
          handler: async (input, hostApi) => hostApi.searchFaq(input.query),
        }
      ),
      defineTool<
        { subject: string; body: string; userId?: string },
        Awaited<ReturnType<HostApi["createTicket"]>>
      >({
        name: "createTicket",
        description: "Create a support ticket with the host system.",
        inputSchema: {
          subject: "string",
          body: "string",
          userId: "string | undefined",
        },
        handler: async (input, hostApi) => hostApi.createTicket(input),
      }),
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding Guide",
    icon: "rocket",
    description: "Explain key features and open guided walkthroughs.",
    systemPrompt:
      "You are the Onboarding Guide. Offer crisp explanations and open tutorials when asked.",
    tools: [
      defineTool<undefined, Awaited<ReturnType<HostApi["listKeyFeatures"]>>>(
        {
          name: "listKeyFeatures",
          description: "List the core product features for a new user.",
          inputSchema: undefined,
          handler: async (_input, hostApi) => hostApi.listKeyFeatures(),
        }
      ),
      defineTool<{ id: string }, Awaited<ReturnType<HostApi["openTutorial"]>>>(
        {
          name: "openTutorial",
          description: "Open a product tutorial for the user.",
          inputSchema: { id: "string" },
          handler: async (input, hostApi) => hostApi.openTutorial(input.id),
        }
      ),
    ],
  },
  {
    id: "content",
    name: "Content Studio",
    icon: "pencil",
    description: "Draft copy suggestions based on the current page context.",
    systemPrompt:
      "You are the Content Studio agent. Keep copy concise, specific, and aligned to the page intent.",
    tools: [
      defineTool<undefined, Awaited<ReturnType<HostApi["getPageContext"]>>>(
        {
          name: "getPageContext",
          description: "Fetch the current page name and contextual hints.",
          inputSchema: undefined,
          handler: async (_input, hostApi) => hostApi.getPageContext(),
        }
      ),
      defineTool<{ area: string }, Awaited<ReturnType<HostApi["suggestCopy"]>>>(
        {
          name: "suggestCopy",
          description: "Suggest copy for a specific area of the app.",
          inputSchema: { area: "string" },
          handler: async (input, hostApi) => hostApi.suggestCopy(input.area),
        }
      ),
    ],
  },
];
