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
```

The CLI writes `agentbar.config.json` in your project directory.

## Customization

You can update appearance and behavior with `agentbar set`:

```bash
agentbar set themeColor "#0ea5e9"
agentbar set fontFamily "Satoshi, ui-sans-serif"
agentbar set position right
agentbar set offsetY 24
agentbar set openOnLoad false
agentbar set autoIngest true
```
