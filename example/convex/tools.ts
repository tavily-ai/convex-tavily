import { createTool } from "@convex-dev/agent";
import { TavilyClient } from "@tavily/convex-tavily";
import { z } from "zod";
import { components } from "./_generated/api.js";

const tavily = new TavilyClient(components.tavily);

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
    const response = await tavily.search(ctx, {
      query,
      searchDepth: "advanced",
      maxResults: maxResults ?? 5,
      includeFavicon: true,
    });
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
    const response = await tavily.extract(ctx, {
      urls,
      query,
      chunksPerSource: query ? 3 : undefined,
      extractDepth: "advanced",
      format: "markdown",
    });
    return {
      results: response.results.map((r) => ({
        url: r.url,
        title: r.title,
        // Cap payload size for the LLM context window.
        rawContent: r.rawContent.slice(0, 6000),
      })),
      failedResults: response.failedResults,
    };
  },
});
