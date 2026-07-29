import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import {
  extractPages as runExtract,
  researchTopic as runResearch,
  searchWeb as runSearch,
} from "./tavily.js";

/** Web search via the Tavily Convex component. */
export const webSearch = createTool({
  description:
    "Search the live web for current information. Use for news, facts, docs, or anything beyond your training data. Returns titles, URLs, and snippets.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("How many results to return (default 5)"),
  }),
  execute: async (ctx, { query, maxResults }) => {
    const response = await runSearch(ctx, { query, maxResults });
    return {
      query: response.query,
      results: response.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
    };
  },
});

/** Extract page content via the Tavily Convex component. */
export const extractPages = createTool({
  description:
    "Extract clean markdown content from one or more known URLs. Use after webSearch when you need the full page, not just a snippet.",
  inputSchema: z.object({
    urls: z
      .array(z.string())
      .min(1)
      .max(5)
      .describe("URLs to extract (max 5)"),
    query: z
      .string()
      .optional()
      .describe("Optional focus query to chunk relevant passages"),
  }),
  execute: async (ctx, { urls, query }) => {
    const response = await runExtract(ctx, { urls, query });
    return {
      results: response.results.map((r) => ({
        url: r.url,
        title: r.title,
        // Cap payload size for the LLM context window.
        rawContent: r.rawContent.slice(0, 10000),
      })),
      failedResults: response.failedResults,
    };
  },
});

/**
 * End-to-end Tavily Research via the component's researchStream action.
 * Consumes Tavily SSE inside Convex and returns the final report + sources.
 */
export const deepResearch = createTool({
  description:
    "Run a comprehensive multi-source research report. Prefer this over webSearch when the user wants an in-depth analysis, competitive landscape, literature-style brief, or a synthesized report with citations. Slower and more thorough than a single search.",
  inputSchema: z.object({
    input: z
      .string()
      .describe(
        "A clear research brief: goal, known context, constraints, and desired output",
      ),
    model: z
      .enum(["mini", "pro", "auto"])
      .optional()
      .describe(
        "mini = focused/narrow, pro = broad multi-topic, auto = let Tavily choose (default mini)",
      ),
  }),
  execute: async (ctx, { input, model }) => {
    const response = await runResearch(ctx, {
      input,
      model: model ?? "mini",
    });
    const steps = response.events
      .filter((e) => e.type === "tool_call" && e.name)
      .map((e) => e.name as string);

    return {
      content: response.content?.slice(0, 50000) ?? "",
      sources: response.sources.slice(0, 40).map((s) => ({
        url: s.url,
        title: s.title,
      })),
      model: response.model,
      steps,
    };
  },
});
