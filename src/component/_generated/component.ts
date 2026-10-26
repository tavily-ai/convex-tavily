/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      crawl: FunctionReference<
        "action",
        "internal",
        {
          url: string;
          instructions?: string;
          maxDepth?: number;
          maxBreadth?: number;
          limit?: number;
          selectPaths?: Array<string>;
          selectDomains?: Array<string>;
          excludePaths?: Array<string>;
          excludeDomains?: Array<string>;
          allowExternal?: boolean;
          timeout?: number;
          includeUsage?: boolean;
          chunksPerSource?: number;
          extractDepth?: "basic" | "advanced";
          format?: "markdown" | "text";
          includeImages?: boolean;
          includeFavicon?: boolean;
        },
        {
          baseUrl: string;
          results: Array<{
            url: string;
            title?: string;
            rawContent: string;
            images: Array<string>;
            favicon?: string;
          }>;
          failedResults?: Array<{ url: string; error: string }>;
          responseTime?: number;
          requestId?: string;
          usage?: Record<string, any>;
        },
        Name
      >;
      extract: FunctionReference<
        "action",
        "internal",
        {
          urls: Array<string>;
          query?: string;
          chunksPerSource?: number;
          extractDepth?: "basic" | "advanced";
          format?: "markdown" | "text";
          includeImages?: boolean;
          includeFavicon?: boolean;
          includeUsage?: boolean;
          timeout?: number;
        },
        {
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
        },
        Name
      >;
      getResearch: FunctionReference<
        "action",
        "internal",
        { requestId: string },
        {
          responseTime?: number;
          requestId: string;
          usage?: Record<string, any>;
          status: "pending" | "in_progress" | "completed" | "failed";
          createdAt?: string;
          input?: string;
          model?: string;
          content?: string | Record<string, any>;
          sources?: Array<Record<string, any>>;
          error?: any;
        },
        Name
      >;
      map: FunctionReference<
        "action",
        "internal",
        {
          url: string;
          instructions?: string;
          maxDepth?: number;
          maxBreadth?: number;
          limit?: number;
          selectPaths?: Array<string>;
          selectDomains?: Array<string>;
          excludePaths?: Array<string>;
          excludeDomains?: Array<string>;
          allowExternal?: boolean;
          timeout?: number;
          includeUsage?: boolean;
        },
        {
          baseUrl: string;
          results: Array<string>;
          responseTime?: number;
          requestId?: string;
          usage?: Record<string, any>;
        },
        Name
      >;
      research: FunctionReference<
        "action",
        "internal",
        {
          input: string;
          model?: "mini" | "pro" | "auto";
          outputSchema?: Record<string, any>;
          citationFormat?: "numbered" | "mla" | "apa" | "chicago";
          includeDomains?: Array<string>;
          excludeDomains?: Array<string>;
          outputLength?: "short" | "standard" | "long";
          files?: Array<{ name: string; data: string; type?: "base64" }>;
        },
        {
          responseTime?: number;
          requestId: string;
          usage?: Record<string, any>;
          status: "pending" | "in_progress" | "completed" | "failed";
          createdAt?: string;
          input?: string;
          model?: string;
          content?: string | Record<string, any>;
          sources?: Array<Record<string, any>>;
          error?: any;
        },
        Name
      >;
      search: FunctionReference<
        "action",
        "internal",
        {
          query: string;
          searchDepth?: "basic" | "advanced" | "fast" | "ultra-fast";
          chunksPerSource?: number;
          topic?: "general" | "news" | "finance";
          maxResults?: number;
          includeImages?: boolean;
          includeImageDescriptions?: boolean;
          includeAnswer?: boolean | "basic" | "advanced";
          includeRawContent?: boolean | "markdown" | "text";
          includeDomains?: Array<string>;
          excludeDomains?: Array<string>;
          includeDomainsMode?: "restrict" | "prefer";
          timeRange?: "day" | "week" | "month" | "year" | "d" | "w" | "m" | "y";
          startDate?: string;
          endDate?: string;
          includePublishedDate?: boolean;
          filterByPublishedDate?: boolean;
          country?: string;
          language?: string;
          filterByLanguage?: boolean;
          autoParameters?: boolean;
          exactMatch?: boolean;
          safeSearch?: boolean;
          includeFavicon?: boolean;
          includeUsage?: boolean;
        },
        {
          query: string;
          answer?: string;
          images: Array<{ url: string; description?: string }>;
          results: Array<{
            title: string;
            url: string;
            content: string;
            score: number;
            rawContent?: string;
            publishedDate?: string | null;
            favicon?: string;
            images?: Array<{ url: string; description?: string }>;
          }>;
          responseTime?: number;
          requestId?: string;
          usage?: { credits: number };
          autoParameters?: Record<string, any>;
        },
        Name
      >;
    };
  };
