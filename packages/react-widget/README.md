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
  theme={{
    accent: "#0ea5e9",
    background: "rgba(255,255,255,0.96)",
    text: "#0f172a",
    muted: "#64748b",
    border: "rgba(226,232,240,0.8)",
    panelRadius: "18px",
    dockRadius: "16px",
    fontFamily: "Satoshi, ui-sans-serif",
  }}
  openOnLoad={true}
  closeOnOutsideClick={true}
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
