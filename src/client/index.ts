import type { GenericActionCtx, GenericDataModel } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

export type SearchDepth = "basic" | "advanced";
export type SearchTopic = "general" | "news" | "finance";
export type TimeRange = "day" | "week" | "month" | "year";
export type AnswerMode = boolean | "basic" | "advanced";
export type RawContentMode = boolean | "markdown" | "text";
export type ExtractDepth = "basic" | "advanced";
export type ExtractFormat = "markdown" | "text";
export type ResearchModel = "mini" | "pro" | "auto";
export type CitationFormat = "numbered" | "mla" | "apa" | "chicago";
export type OutputLength = "short" | "standard" | "long";
export type ResearchStatus =
  | "pending"
  | "in_progress"
  | "processing"
  | "completed"
  | "failed";

export interface SearchArgs {
  query: string;
  searchDepth?: SearchDepth;
  topic?: SearchTopic;
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: AnswerMode;
  includeRawContent?: RawContentMode;
  includeDomains?: string[];
  excludeDomains?: string[];
  timeRange?: TimeRange;
  includeFavicon?: boolean;
  includeUsage?: boolean;
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

export interface ResearchArgs {
  input: string;
  model?: ResearchModel;
  citationFormat?: CitationFormat;
  includeDomains?: string[];
  excludeDomains?: string[];
  outputLength?: OutputLength;
}

export interface ResearchSource {
  url: string;
  title?: string;
  favicon?: string;
}

export interface ResearchJobResponse {
  requestId: string;
  createdAt?: string;
  status: ResearchStatus;
  input?: string;
  model?: string;
  responseTime?: number;
}

export interface ResearchGetResponse {
  requestId: string;
  createdAt?: string;
  status: ResearchStatus;
  content?: string;
  sources: ResearchSource[];
  responseTime?: number;
  error?: string;
}

export interface ResearchStreamEvent {
  type: "tool_call" | "tool_response" | "content" | "sources" | "error";
  name?: string;
  id?: string;
  arguments?: string;
  queries?: string[];
  sources?: ResearchSource[];
  content?: string;
  error?: string;
}

export interface ResearchStreamResponse {
  content?: string;
  sources: ResearchSource[];
  events: ResearchStreamEvent[];
  model?: string;
  requestId?: string;
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

  /** Start a research task; poll with getResearch. */
  async research(
    ctx: ActionCtx,
    args: ResearchArgs,
  ): Promise<ResearchJobResponse> {
    return await ctx.runAction(this.component.lib.research, args);
  }

  async getResearch(
    ctx: ActionCtx,
    args: { requestId: string },
  ): Promise<ResearchGetResponse> {
    return await ctx.runAction(this.component.lib.getResearch, args);
  }

  /**
   * Consume Tavily's research SSE stream inside the action and return progress
   * events plus the final report.
   */
  async researchStream(
    ctx: ActionCtx,
    args: ResearchArgs,
  ): Promise<ResearchStreamResponse> {
    return await ctx.runAction(this.component.lib.researchStream, args);
  }
}
