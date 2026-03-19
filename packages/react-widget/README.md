# @agentbar/react

React widget for Agent Plugin Bar.

## Install

```bash
npm install @agentbar/react @agentbar/runtime
```

## Usage

```tsx
import { AgentBar } from "@agentbar/react";

<AgentBar
  apiSchema={apiSchema}
  hostApi={hostApi}
  enabledAgents={["support", "onboarding", "content"]}
  position="right"
/>;
```

## Tailwind

Include the package output in your Tailwind content list:

```ts
content: [
  "./src/**/*.{ts,tsx}",
  "./node_modules/@agentbar/react/dist/**/*.{js,ts,jsx,tsx}",
]
```
