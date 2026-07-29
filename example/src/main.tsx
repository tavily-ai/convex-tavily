import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { App } from "./App";
import "./index.css";

const url = import.meta.env.CONVEX_URL as string | undefined;
if (!url) {
  throw new Error(
    "Missing CONVEX_URL. Run `npx convex dev` in example/ (or npm run dev from the repo root) so .env.local is written.",
  );
}

const convex = new ConvexReactClient(url);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
