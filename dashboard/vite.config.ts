import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { evalDataPlugin } from "./vite-plugin-eval-data.ts";

const dashboardDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), evalDataPlugin(dashboardDir)],
});
