# @arjun-shah/agentbar-cli

CLI helper to generate and manage the Agent Plugin Bar embed snippet.

## Install

```bash
npm install -g agentbar-cli
```

If you prefer the scoped package directly:

```bash
npm install -g @arjun-shah/agentbar-cli
```

## Usage

```bash
agentbar init
agentbar snippet
agentbar set siteUrl https://your-site.com
agentbar stats
```

The CLI writes `agentbar.config.json` in your project directory. `agentbar init` only asks
for your site URL.

## Customization

You can update appearance and behavior with `agentbar set`:

```bash
agentbar set themeColor "#0ea5e9"
agentbar set accentTextColor "#0f172a"
agentbar set userBubbleBackground "rgba(14,165,233,0.12)"
agentbar set assistantBubbleBackground "#f8fafc"
agentbar set fontFamily "Satoshi, ui-sans-serif"
agentbar set position right
agentbar set offsetY 24
agentbar set draggable true
agentbar set persistPosition true
agentbar set dragOffset 0
agentbar set inputPlaceholder "Ask about this page"
agentbar set sendLabel "Send"
agentbar set suggestions "Search pricing | Summarize docs | Draft copy"
agentbar set badgeLabel "AI"
agentbar set greeting "Welcome back. How can I help?"
agentbar set persist true
agentbar set showReset true
agentbar set showExport true
agentbar set exportLabel "Copy"
agentbar set showScrollButton true
agentbar set scrollLabel "Scroll"
agentbar set showMinimize true
agentbar set minimizedOnLoad false
agentbar set minimizeLabel "Minimize"
agentbar set expandLabel "Expand"
agentbar set showTimestamps true
agentbar set timestampLocale "en-US"
agentbar set autoScroll true
agentbar set autoScrollThreshold 24
agentbar set messageMaxWidth "85%"
agentbar set launcherTooltip "Open assistant"
agentbar set openOnLoad false
agentbar set autoIngest true
```
