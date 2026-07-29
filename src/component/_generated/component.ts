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
          excludeDomains?: Array<string>;
          includeAnswer?: boolean | "basic" | "advanced";
          includeDomains?: Array<string>;
          includeFavicon?: boolean;
          includeImageDescriptions?: boolean;
          includeImages?: boolean;
          includeRawContent?: boolean | "markdown" | "text";
          includeUsage?: boolean;
          maxResults?: number;
          query: string;
          searchDepth?: "basic" | "advanced";
          timeRange?: "day" | "week" | "month" | "year";
          topic?: "general" | "news" | "finance";
        },
        {
          answer?: string;
          images: Array<{ description?: string; url: string }>;
          query: string;
          requestId?: string;
          responseTime?: number;
          results: Array<{
            content: string;
            favicon?: string;
            publishedDate?: string;
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
