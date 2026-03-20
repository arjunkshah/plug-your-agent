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
    userBubbleBackground: "rgba(14,165,233,0.12)",
    userBubbleText: "#0f172a",
    assistantBubbleBackground: "#f8fafc",
    assistantBubbleText: "#0f172a",
    panelShadow: "0 30px 70px -50px rgba(15,23,42,0.35)",
    dockShadow: "0 20px 50px -40px rgba(15,23,42,0.25)",
  }}
  openOnLoad={true}
  closeOnOutsideClick={true}
  inputPlaceholder="Ask about this page"
  suggestions={["Search pricing", "Summarize docs", "Draft marketing copy"]}
  greeting="Welcome back. How can I help?"
  showReset={true}
  persist={true}
  badgeLabel="AI"
  closeOnEscape={true}
  showMinimize={true}
  autoScroll={true}
  autoScrollThreshold={24}
  messageMaxWidth="85%"
  showScrollButton={true}
  scrollLabel="Scroll"
  launcherTooltip="Open assistant"
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
