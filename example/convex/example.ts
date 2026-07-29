import { v } from "convex/values";
import { action } from "./_generated/server.js";
import {
  extractPages as runExtract,
  researchTopic as runResearch,
  searchWeb as runSearch,
} from "./tavily.js";

export const searchWeb = action({
  args: {
    query: v.string(),
    maxResults: v.optional(v.number()),
    includeDomains: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await runSearch(ctx, args);
  },
});

export const extractPages = action({
  args: {
    urls: v.array(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await runExtract(ctx, args);
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
    return await runResearch(ctx, args);
  },
});
