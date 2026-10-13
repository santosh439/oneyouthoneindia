import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
// "npm run build" makes a normal production build for Vercel or Netlify.
// "npm run build:single" makes one self-contained HTML file (used for the Claude preview).
export default defineConfig(({ mode }) => ({ define: { __BUILD_ID__: JSON.stringify(new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")) }, plugins: mode === "artifact" ? [react(), viteSingleFile()] : [react()] }));
