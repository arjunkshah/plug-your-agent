# Agent Plugin Bar

Drop-in agent plugin system for your app or site. Add a single React component, enable the agents you want, and let them call your internal APIs through a typed interface.

## Quickstart

Install the packages:

```bash
npm install @agentbar/react @agentbar/runtime
```

```tsx
import { AgentBar } from "@agentbar/react";
import { createProxyProvider } from "@agentbar/runtime";
import type { HostApi, HostApiSchema } from "@agentbar/runtime";

const hostApi: HostApi = {
  searchFaq: async (query) => [],
  createTicket: async (input) => ({ ticketId: "TCK-1001" }),
  listKeyFeatures: async () => [],
  openTutorial: async (id) => {},
  getPageContext: async () => ({ pageName: "Home", hints: [] }),
  suggestCopy: async (area) => "",
};

const apiSchema: HostApiSchema = {
  searchFaq: { description: "Search internal help docs." },
  createTicket: { description: "Create a support ticket." },
  listKeyFeatures: { description: "List the primary product features." },
  openTutorial: { description: "Open a tutorial by id." },
  getPageContext: { description: "Return page metadata and hints." },
  suggestCopy: { description: "Generate copy for a specific area." },
};

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
/>;
```

## One-line embed

Deploy this repo to Vercel, set `GROQ_API_KEY`, and embed the widget with one script tag:

```html
<script
  src="https://your-deploy-url/agentbar.js"
  data-site="https://your-site.com"
  data-api="https://your-deploy-url"
></script>
```

The embed script calls `/api/ingest` to scrape your site and `/api/chat` to run Groq inference.

## Documentation Site

The demo app doubles as the documentation site. Run it locally and use it as a reference implementation:

```bash
npm run dev
```

If you want the demo widget to call your deployed Groq proxy, set:

```
VITE_AGENTBAR_API_BASE=https://your-deploy-url
```

## Built-in Agents

- Support Desk (`support`) uses `searchFaq` and `createTicket`.
- Onboarding Guide (`onboarding`) uses `listKeyFeatures` and `openTutorial`.
- Content Studio (`content`) uses `getPageContext` and `suggestCopy`.

## Add Custom Agents

Provide your own `AgentPlugin[]` to the `agents` prop. Each agent defines its system prompt and a list of tools that map to your host API functions.

```ts
import type { AgentPlugin, HostApi } from "@agentbar/runtime";

interface AnalyticsHostApi extends HostApi {
  getUsageTrends(range: string): Promise<string[]>;
}

const customAgents: AgentPlugin[] = [
  {
    id: "analytics",
    name: "Analytics Pulse",
    description: "Surface live usage trends for product owners.",
    systemPrompt: "Keep insights concise and cite the host metrics.",
    tools: [
      {
        name: "getUsageTrends",
        description: "Fetch trend data from the host app.",
        inputSchema: { range: "string" },
        handler: async (input, hostApi) =>
          (hostApi as AnalyticsHostApi).getUsageTrends(input.range),
      },
    ],
  },
];
```

## Host API Interface

Agents never call arbitrary fetch requests. They only call the functions you expose in `HostApi`:

```ts
export interface HostApi {
  searchFaq(query: string): Promise<{ title: string; snippet: string; url: string }[]>;
  createTicket(input: { subject: string; body: string; userId?: string }): Promise<{ ticketId: string }>;
  listKeyFeatures(): Promise<string[]>;
  openTutorial(id: string): Promise<void>;
  getPageContext(): Promise<{ pageName: string; hints: string[] }>;
  suggestCopy(area: string): Promise<string>;
}
```

## AI Providers

The runtime ships with a mocked LLM fallback, and you can plug in a proxy provider when you are ready:

```ts
import { createProxyProvider } from "@agentbar/runtime";

const llmProvider = createProxyProvider({
  endpoint: "https://your-deploy-url/api/chat",
  siteUrl: window.location.origin,
});
```

## Groq API

The one-line embed uses Groq via the `/api/chat` route. Set this in your Vercel project:

```
GROQ_API_KEY=your-key
```

## Publishing

Build the packages before publishing:

```bash
npm run build
```

## Development

- Install dependencies: `npm install`
- Run the demo app: `npm run dev`
- Build packages and demo app: `npm run build`

## Tailwind Setup

The widget uses Tailwind classes. Ensure your Tailwind `content` includes the package output, for example:

```ts
content: [
  "./src/**/*.{ts,tsx}",
  "./node_modules/@agentbar/react/dist/**/*.{js,ts,jsx,tsx}",
];
```
