import type { GenericActionCtx, GenericDataModel } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

export type SearchDepth = "ultra-fast" | "fast" | "basic" | "advanced";
export type SearchTopic = "general" | "news" | "finance";
export type TimeRange = "day" | "week" | "month" | "year";
export type AnswerMode = boolean | "basic" | "advanced";
export type RawContentMode = boolean | "markdown" | "text";
export type ExtractDepth = "basic" | "advanced";
export type ExtractFormat = "markdown" | "text";

export interface SearchArgs {
  query: string;
  searchDepth?: SearchDepth;
  topic?: SearchTopic;
  days?: number;
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: AnswerMode;
  includeRawContent?: RawContentMode;
  includeDomains?: string[];
  excludeDomains?: string[];
  timeRange?: TimeRange;
  chunksPerSource?: number;
  country?: string;
  startDate?: string;
  endDate?: string;
  autoParameters?: boolean;
  includeFavicon?: boolean;
  includeUsage?: boolean;
  exactMatch?: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  rawContent?: string;
  publishedDate?: string;
  favicon?: string;
}

export interface SearchImage {
  url: string;
  description?: string;
}

export interface Usage {
  credits: number;
}

export interface SearchResponse {
  query: string;
  answer?: string;
  images: SearchImage[];
  results: SearchResult[];
  responseTime?: number;
  requestId?: string;
  usage?: Usage;
  autoParameters?: {
    includeDomains?: string[];
    excludeDomains?: string[];
    topic?: SearchTopic;
    timeRange?: TimeRange;
    searchDepth?: SearchDepth;
  };
}

export interface ExtractArgs {
  urls: string[];
  query?: string;
  chunksPerSource?: number;
  extractDepth?: ExtractDepth;
  format?: ExtractFormat;
  includeImages?: boolean;
  includeFavicon?: boolean;
  includeUsage?: boolean;
  timeout?: number;
}

export interface ExtractResult {
  url: string;
  title?: string;
  rawContent: string;
  images: string[];
  favicon?: string;
}

export interface ExtractFailure {
  url: string;
  error: string;
}

export interface ExtractResponse {
  results: ExtractResult[];
  failedResults: ExtractFailure[];
  responseTime?: number;
  requestId?: string;
  usage?: Usage;
}

export type ActionCtx = Pick<GenericActionCtx<GenericDataModel>, "runAction">;

/** Server-side client for the Tavily Convex component. */
export class TavilyClient {
  constructor(private readonly component: ComponentApi) {}

  async search(ctx: ActionCtx, args: SearchArgs): Promise<SearchResponse> {
    return await ctx.runAction(this.component.lib.search, args);
  }

  async extract(ctx: ActionCtx, args: ExtractArgs): Promise<ExtractResponse> {
    return await ctx.runAction(this.component.lib.extract, args);
  }
}
