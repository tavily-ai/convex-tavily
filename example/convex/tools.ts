import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import {
  tavily,
  extractPages as runExtract,
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

// Keep traversal budgets in application code, not model arguments.
const discoveryInputs = z.object({
  url: z.string().describe("Website to explore"),
  instructions: z.string().optional().describe("What pages or content to find"),
});

export const mapWebsite = createTool({
  description: "Discover up to 10 URLs on a website to choose pages for extraction.",
  inputSchema: discoveryInputs,
  execute: async (ctx, { url, instructions }) => tavily.map(ctx, {
    url, instructions, maxDepth: 1, limit: 10, allowExternal: false,
  }),
});

export const crawlWebsite = createTool({
  description: "Discover and extract up to 3 pages from a website.",
  inputSchema: discoveryInputs,
  execute: async (ctx, { url, instructions }) => tavily.crawl(ctx, {
    url, instructions, maxDepth: 1, limit: 3, allowExternal: false,
  }),
});
