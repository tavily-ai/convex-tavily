import {
  TavilyClient,
  type ActionCtx,
} from "@tavily/convex-tavily";
import { components } from "./_generated/api.js";

export const tavily = new TavilyClient(components.tavily);

export async function searchWeb(
  ctx: ActionCtx,
  args: {
    query: string;
    maxResults?: number;
    includeDomains?: string[];
  },
) {
  return await tavily.search(ctx, {
    query: args.query,
    searchDepth: "advanced",
    maxResults: args.maxResults ?? 5,
    includeDomains: args.includeDomains,
    includeAnswer: false,
    includeFavicon: true,
  });
}

export async function extractPages(
  ctx: ActionCtx,
  args: {
    urls: string[];
    query?: string;
  },
) {
  return await tavily.extract(ctx, {
    urls: args.urls,
    query: args.query,
    chunksPerSource: args.query ? 3 : undefined,
    extractDepth: "advanced",
    format: "markdown",
  });
}
