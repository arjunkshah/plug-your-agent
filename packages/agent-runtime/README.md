# @agentbar/runtime

Agent runtime and tool system for Agent Plugin Bar.

## Install

```bash
npm install @agentbar/runtime
```

## Usage

```ts
import { createAgentSession, createProxyProvider } from "@agentbar/runtime";

const llmProvider = createProxyProvider({
  endpoint: "https://your-deploy-url/api/chat",
  siteUrl: "https://your-site.com",
});

const session = createAgentSession(plugin, hostApi, { llmProvider });
const steps = await session.sendMessage("search faq for reset steps");
```
