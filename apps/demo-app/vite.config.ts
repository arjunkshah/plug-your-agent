import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, open: false },
  resolve: {
    alias: {
      "@arjun-shah/agentbar-react": path.resolve(rootDir, "../../packages/react-widget/src"),
      "@arjun-shah/agentbar-runtime": path.resolve(rootDir, "../../packages/agent-runtime/src"),
    },
  },
});
