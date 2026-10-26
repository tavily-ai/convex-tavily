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
    urls: z.array(z.string()).min(1).max(5).describe("URLs to extract (max 5)"),
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

// Model-facing discovery controls. Application wrappers may set stricter budgets.
const traversal = {
  url: z.string(),
  instructions: z.string().optional(),
  maxDepth: z.number().int().min(1).max(5).optional(),
  maxBreadth: z.number().int().min(1).max(500).optional(),
  limit: z.number().int().min(1).optional(),
  selectPaths: z.array(z.string()).optional(),
  selectDomains: z.array(z.string()).optional(),
  excludePaths: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
  allowExternal: z.boolean().optional(),
  timeout: z.number().min(10).max(150).optional(),
  includeUsage: z.boolean().optional(),
};

export const mapWebsite = createTool({
  description:
    "Discover URLs on a website. Use before choosing pages to extract; use path/domain controls and a small limit to focus the discovery.",
  inputSchema: z.object(traversal),
  execute: async (ctx, args) => tavily.map(ctx, args),
});

export const crawlWebsite = createTool({
  description:
    "Discover and extract website pages. Prefer a small limit to keep content within the context window; the tool returns complete content and metadata.",
  inputSchema: z.object({
    ...traversal,
    chunksPerSource: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe("Requires instructions"),
    extractDepth: z.enum(["basic", "advanced"]).optional(),
    format: z.enum(["markdown", "text"]).optional(),
    includeImages: z.boolean().optional(),
    includeFavicon: z.boolean().optional(),
  }),
  execute: async (ctx, args) => tavily.crawl(ctx, args),
});

export const startResearch = createTool({
  description:
    "Submit a new paid Research task for a question requiring a report and citations. Save requestId and use readResearch later; do not submit again to check progress.",
  inputSchema: z.object({
    input: z.string(),
    model: z.enum(["mini", "pro", "auto"]).optional(),
    includeDomains: z.array(z.string()).max(20).optional(),
    excludeDomains: z.array(z.string()).max(20).optional(),
    outputLength: z.enum(["short", "standard", "long"]).optional(),
    citationFormat: z.enum(["numbered", "mla", "apa", "chicago"]).optional(),
    outputSchema: z.record(z.unknown()).optional(),
    files: z
      .array(
        z.object({
          name: z.string(),
          data: z.string(),
          type: z.literal("base64").optional(),
        }),
      )
      .max(5)
      .optional()
      .describe(
        "Only use base64 file contents already supplied by the user or application",
      ),
  }),
  execute: async (ctx, args) => tavily.research(ctx, args),
});

export const readResearch = createTool({
  description:
    "Read a previously submitted Research task. Returns pending/in_progress, or the full completed report and sources, or failed. If still pending, report that and stop rather than polling repeatedly in one turn.",
  inputSchema: z.object({
    requestId: z.string(),
    includeUsage: z.boolean().optional(),
  }),
  execute: async (ctx, args) => tavily.getResearch(ctx, args),
});
