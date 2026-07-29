/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 * Regenerate with `npx convex codegen --component-dir ./src/component`.
 */

import type { FunctionReference } from "convex/server";

type SearchDepth = "ultra-fast" | "fast" | "basic" | "advanced";
type SearchTopic = "general" | "news" | "finance";
type TimeRange = "day" | "week" | "month" | "year";

type SearchArgs = {
  query: string;
  searchDepth?: SearchDepth;
  topic?: SearchTopic;
  days?: number;
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean | "basic" | "advanced";
  includeRawContent?: boolean | "markdown" | "text";
  includeDomains?: Array<string>;
  excludeDomains?: Array<string>;
  timeRange?: TimeRange;
  chunksPerSource?: number;
  country?: string;
  startDate?: string;
  endDate?: string;
  autoParameters?: boolean;
  includeFavicon?: boolean;
  includeUsage?: boolean;
  exactMatch?: boolean;
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
  autoParameters?: {
    includeDomains?: Array<string>;
    excludeDomains?: Array<string>;
    topic?: SearchTopic;
    timeRange?: TimeRange;
    searchDepth?: SearchDepth;
  };
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
  };
};
