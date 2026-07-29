/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 * Regenerate with `npx convex codegen --component-dir ./src/component`.
 */

import type { FunctionReference } from "convex/server";

type SearchDepth = "basic" | "advanced";
type SearchTopic = "general" | "news" | "finance";
type TimeRange = "day" | "week" | "month" | "year";
type ResearchModel = "mini" | "pro" | "auto";
type CitationFormat = "numbered" | "mla" | "apa" | "chicago";
type OutputLength = "short" | "standard" | "long";
type ResearchStatus =
  | "pending"
  | "in_progress"
  | "processing"
  | "completed"
  | "failed";

type SearchArgs = {
  query: string;
  searchDepth?: SearchDepth;
  topic?: SearchTopic;
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean | "basic" | "advanced";
  includeRawContent?: boolean | "markdown" | "text";
  includeDomains?: Array<string>;
  excludeDomains?: Array<string>;
  timeRange?: TimeRange;
  includeFavicon?: boolean;
  includeUsage?: boolean;
};

type SearchResponse = {
  query: string;
  answer?: string;
  images: Array<{ url: string; description?: string }>;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    rawContent?: string;
    publishedDate?: string;
    favicon?: string;
  }>;
  responseTime?: number;
  requestId?: string;
  usage?: { credits: number };
};

type ExtractArgs = {
  urls: Array<string>;
  query?: string;
  chunksPerSource?: number;
  extractDepth?: "basic" | "advanced";
  format?: "markdown" | "text";
  includeImages?: boolean;
  includeFavicon?: boolean;
  includeUsage?: boolean;
  timeout?: number;
};

type ExtractResponse = {
  results: Array<{
    url: string;
    title?: string;
    rawContent: string;
    images: Array<string>;
    favicon?: string;
  }>;
  failedResults: Array<{ url: string; error: string }>;
  responseTime?: number;
  requestId?: string;
  usage?: { credits: number };
};

type ResearchArgs = {
  input: string;
  model?: ResearchModel;
  citationFormat?: CitationFormat;
  includeDomains?: Array<string>;
  excludeDomains?: Array<string>;
  outputLength?: OutputLength;
};

type ResearchSource = {
  url: string;
  title?: string;
  favicon?: string;
};

type ResearchJobResponse = {
  requestId: string;
  createdAt?: string;
  status: ResearchStatus;
  input?: string;
  model?: string;
  responseTime?: number;
};

type ResearchGetResponse = {
  requestId: string;
  createdAt?: string;
  status: ResearchStatus;
  content?: string;
  sources: Array<ResearchSource>;
  responseTime?: number;
  error?: string;
};

type ResearchStreamEvent = {
  type: "tool_call" | "tool_response" | "content" | "sources" | "error";
  name?: string;
  id?: string;
  arguments?: string;
  queries?: Array<string>;
  sources?: Array<ResearchSource>;
  content?: string;
  error?: string;
};

type ResearchStreamResponse = {
  content?: string;
  sources: Array<ResearchSource>;
  events: Array<ResearchStreamEvent>;
  model?: string;
  requestId?: string;
};

/** Typed references to the functions exposed by a mounted Tavily component. */
export type ComponentApi<Name extends string | undefined = string | undefined> = {
  lib: {
    search: FunctionReference<
      "action",
      "internal",
      SearchArgs,
      SearchResponse,
      Name
    >;
    extract: FunctionReference<
      "action",
      "internal",
      ExtractArgs,
      ExtractResponse,
      Name
    >;
    research: FunctionReference<
      "action",
      "internal",
      ResearchArgs,
      ResearchJobResponse,
      Name
    >;
    getResearch: FunctionReference<
      "action",
      "internal",
      { requestId: string },
      ResearchGetResponse,
      Name
    >;
    researchStream: FunctionReference<
      "action",
      "internal",
      ResearchArgs,
      ResearchStreamResponse,
      Name
    >;
  };
};
