import { Agent, stepCountIs } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api.js";
import { extractPages, webSearch } from "./tools.js";

/**
 * Demo assistant backed by Tavily search/extract tools.
 * Requires OPENAI_API_KEY on the Convex deployment (process.env).
 */
export const researchAgent = new Agent(components.agent, {
  name: "Tavily Research Assistant",
  languageModel: openai.responses("gpt-5.6-terra"),
  providerOptions: {
    openai: {
      store: false,
      include: ["reasoning.encrypted_content"],
    },
  },
  instructions: [
    "Today's date is " + new Date().toISOString().split("T")[0] + ".",
    "You are a research assistant powered by Tavily.",
    "Use webSearch for facts, news, docs lookups, or anything time-sensitive.",
    "Use extractPages when you already have URLs and need fuller page content.",
    "Always cite sources with titles and links from your tools.",
    "Be concise and grounded — do not invent URLs or facts.",
  ].join(" "),
  tools: { webSearch, extractPages },
  stopWhen: stepCountIs(6),
});
