import { Agent, stepCountIs } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api.js";
import { extractPages, webSearch } from "./tools.js";

/**
 * Demo research assistant backed by Tavily search/extract tools.
 * Requires OPENAI_API_KEY on the Convex deployment (process.env).
 */
export const researchAgent = new Agent(components.agent, {
  name: "Tavily Research Assistant",
  languageModel: openai.chat("gpt-5.6-terra"),
  instructions: [
    "Today's date is " + new Date().toISOString().split('T')[0],
    "You are a research assistant powered by Tavily web search.",
    "When the user asks about current events, docs, products, or anything time-sensitive, use webSearch.",
    "When you have specific URLs and need deeper content, use extractPages.",
    "Always cite sources with titles and links from your tools.",
    "Be concise and grounded — do not invent URLs or facts.",
  ].join(" "),
  tools: { webSearch, extractPages },
  stopWhen: stepCountIs(6),
});
