import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Expose CONVEX_URL from example/.env.local (written by `npx convex dev`).
  envPrefix: ["VITE_", "CONVEX_"],
  server: {
    port: 5173,
  },
});
