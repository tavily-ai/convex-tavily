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
      extract: FunctionReference<
        "action",
        "internal",
        {
          chunksPerSource?: number;
          extractDepth?: "basic" | "advanced";
          format?: "markdown" | "text";
          includeFavicon?: boolean;
          includeImages?: boolean;
          includeUsage?: boolean;
          query?: string;
          timeout?: number;
          urls: Array<string>;
        },
        {
          failedResults: Array<{ error: string; url: string }>;
          requestId?: string;
          responseTime?: number;
          results: Array<{
            favicon?: string;
            images: Array<string>;
            rawContent: string;
            title?: string;
            url: string;
          }>;
          usage?: { credits: number };
        },
        Name
      >;
      search: FunctionReference<
        "action",
        "internal",
        {
          autoParameters?: boolean;
          chunksPerSource?: number;
          country?: string;
          endDate?: string;
          exactMatch?: boolean;
          excludeDomains?: Array<string>;
          filterByLanguage?: boolean;
          filterByPublishedDate?: boolean;
          includeAnswer?: boolean | "basic" | "advanced";
          includeDomains?: Array<string>;
          includeDomainsMode?: "restrict" | "prefer";
          includeFavicon?: boolean;
          includeImageDescriptions?: boolean;
          includeImages?: boolean;
          includePublishedDate?: boolean;
          includeRawContent?: boolean | "markdown" | "text";
          includeUsage?: boolean;
          language?: string;
          maxResults?: number;
          query: string;
          safeSearch?: boolean;
          searchDepth?: "basic" | "advanced" | "fast" | "ultra-fast";
          startDate?: string;
          timeRange?:
            | "day"
            | "week"
            | "month"
            | "year"
            | "d"
            | "w"
            | "m"
            | "y";
          topic?: "general" | "news" | "finance";
        },
        {
          answer?: string;
          autoParameters?: Record<string, any>;
          images: Array<{ description?: string; url: string }>;
          query: string;
          requestId?: string;
          responseTime?: number;
          results: Array<{
            content: string;
            favicon?: string;
            images?: Array<{ description?: string; url: string }>;
            publishedDate?: string | null;
            rawContent?: string;
            score: number;
            title: string;
            url: string;
          }>;
          usage?: { credits: number };
        },
        Name
      >;
    };
  };
