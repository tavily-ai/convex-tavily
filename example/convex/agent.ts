import { Agent, stepCountIs } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api.js";
import { deepResearch, extractPages, webSearch } from "./tools.js";

/**
 * Demo research assistant backed by Tavily search/extract/research tools.
 * Requires OPENAI_API_KEY on the Convex deployment (process.env).
 */
export const researchAgent = new Agent(components.agent, {
  name: "Tavily Research Assistant",
  languageModel: openai.chat("gpt-5.6-terra"),
  instructions: [
    "Today's date is " + new Date().toISOString().split("T")[0] + ".",
    "You are a research assistant powered by Tavily.",
    "Use webSearch for quick facts, news, docs lookups, or anything time-sensitive.",
    "Use extractPages when you already have URLs and need fuller page content.",
    "Use deepResearch for in-depth, multi-source reports or competitive/landscape analysis — it runs Tavily Research and returns a synthesized report with sources.",
    "Prefer webSearch for simple questions; reserve deepResearch for broad or multi-step briefs.",
    "Always cite sources with titles and links from your tools.",
    "Be concise and grounded — do not invent URLs or facts.",
  ].join(" "),
  tools: { webSearch, extractPages, deepResearch },
  stopWhen: stepCountIs(8),
});
