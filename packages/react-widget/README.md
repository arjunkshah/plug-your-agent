# @arjun-shah/agentbar-react

React widget for Agent Plugin Bar.

## Install

```bash
npm install @arjun-shah/agentbar-react @arjun-shah/agentbar-runtime
```

## Usage

```tsx
import { AgentBar } from "@arjun-shah/agentbar-react";

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
  "./node_modules/@arjun-shah/agentbar-react/dist/**/*.{js,ts,jsx,tsx}",
]
```
