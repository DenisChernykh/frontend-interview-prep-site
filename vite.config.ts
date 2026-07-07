import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: "./vitest.setup.ts",
  },
});