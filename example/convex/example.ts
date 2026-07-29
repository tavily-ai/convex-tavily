import { v } from "convex/values";
import { TavilyClient } from "@tavily/convex-tavily";
import { components } from "./_generated/api.js";
import { action } from "./_generated/server.js";

const tavily = new TavilyClient(components.tavily);

export const searchWeb = action({
  args: {
    query: v.string(),
    maxResults: v.optional(v.number()),
    includeDomains: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await tavily.search(ctx, {
      query: args.query,
      searchDepth: "advanced",
      maxResults: args.maxResults ?? 5,
      includeDomains: args.includeDomains,
      includeAnswer: false,
      includeFavicon: true,
    });
  },
});

export const extractPages = action({
  args: {
    urls: v.array(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await tavily.extract(ctx, {
      urls: args.urls,
      query: args.query,
      chunksPerSource: args.query ? 3 : undefined,
      extractDepth: "advanced",
      format: "markdown",
    });
  },
});

export const researchTopic = action({
  args: {
    input: v.string(),
    model: v.optional(
      v.union(v.literal("mini"), v.literal("pro"), v.literal("auto")),
    ),
  },
  handler: async (ctx, args) => {
    return await tavily.researchStream(ctx, {
      input: args.input,
      model: args.model ?? "mini",
      citationFormat: "numbered",
    });
  },
});
