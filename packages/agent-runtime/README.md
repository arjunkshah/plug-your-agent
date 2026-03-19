# @arjun-shah/agentbar-runtime

Agent runtime and tool system for Agent Plugin Bar.

## Install

```bash
npm install @arjun-shah/agentbar-runtime
```

## Usage

```ts
import { createAgentSession, createProxyProvider } from "@arjun-shah/agentbar-runtime";

const llmProvider = createProxyProvider({
  endpoint: "https://your-deploy-url/api/chat",
  siteUrl: "https://your-site.com",
});

const session = createAgentSession(plugin, hostApi, { llmProvider });
const steps = await session.sendMessage("search faq for reset steps");
```
