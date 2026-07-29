import { v } from "convex/values";
import { action } from "./_generated/server.js";
import {
  extractPages as runExtract,
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
