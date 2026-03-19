# @agentbar/runtime

Agent runtime and tool system for Agent Plugin Bar.

## Install

```bash
npm install @agentbar/runtime
```

## Usage

```ts
import { createAgentSession } from "@agentbar/runtime";

const session = createAgentSession(plugin, hostApi);
const steps = await session.sendMessage("search faq for reset steps");
```
