# Agent Plugin Bar

Drop-in agent plugin system for your app or site. Add a single React component, enable the agents you want, and let them call your internal APIs through a typed interface.

## Quickstart

Install the packages:

```bash
npm install @arjun-shah/agentbar-react @arjun-shah/agentbar-runtime
```

## CLI setup

Install the CLI and generate your snippet:

```bash
npm install -g agentbar-cli
agentbar init
```

This writes `agentbar.config.json` in your project so you can always update values:

```bash
agentbar set siteUrl https://your-site.com
agentbar snippet
```

```tsx
import { AgentBar } from "@arjun-shah/agentbar-react";
import { createProxyProvider } from "@arjun-shah/agentbar-runtime";
import type { HostApi, HostApiSchema } from "@arjun-shah/agentbar-runtime";

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
  data-depth="2"
  data-max-pages="25"
  data-site-key="your-site-key"
></script>
```

The embed script calls `/api/ingest` to crawl your site (uses `sitemap.xml` if present) and
`/api/chat` to run Groq inference. Responses stream in real time.

You can generate the snippet with the CLI:

```bash
agentbar init
agentbar snippet
```

### Embed options

- `data-site` - base URL to crawl.
- `data-api` - deployment URL hosting the API routes.
- `data-site-key` - custom key for multi-site deployments.
- `data-depth` - crawl depth (default: 1).
- `data-max-pages` - max pages to index (default: 15).
- `data-theme-color` - brand color (hex).
- `data-font-family` - font stack for the widget.
- `data-panel-background` - panel background color.
- `data-text-color` - primary text color.
- `data-muted-text-color` - muted text color.
- `data-border-color` - border color.
- `data-button-background` - launcher background color.
- `data-button-text-color` - launcher text/icon color.
- `data-panel-width` - panel width (e.g. `360px`).
- `data-panel-max-height` - panel max height (e.g. `70vh`).
- `data-panel-radius` - panel corner radius (e.g. `18px`).
- `data-button-radius` - launcher corner radius (e.g. `999px`).
- `data-offset-x` - horizontal offset in px.
- `data-offset-y` - vertical offset in px.
- `data-title` - widget title.
- `data-subtitle` - widget subtitle.
- `data-button-label` - optional launcher label (defaults to icon only).
- `data-position` - `left`, `right`, or `bottom`.
- `data-open` - `true` to open on load.
- `data-auto-ingest` - `true` to auto-index on load.
- `data-close-on-outside-click` - `true` to close when clicking outside.

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
import type { AgentPlugin, HostApi } from "@arjun-shah/agentbar-runtime";

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
import { createProxyProvider } from "@arjun-shah/agentbar-runtime";

const llmProvider = createProxyProvider({
  endpoint: "https://your-deploy-url/api/chat",
  siteUrl: window.location.origin,
});
```

## Groq API

The one-line embed uses Groq via the `/api/chat` route. Set this in your Vercel project:

```
GROQ_API_KEY=your-key
GROQ_MODEL=llama-3.1-8b-instant
```

## Admin endpoints

- `POST /api/ingest` with `{ url, depth, maxPages, siteKey?, force? }`
- `POST /api/chat` with `{ siteUrl, siteKey?, messages, stream? }`
- `GET /api/status` to list indexed sites and pages

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
  "./node_modules/@arjun-shah/agentbar-react/dist/**/*.{js,ts,jsx,tsx}",
];
```
