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
      getResearch: FunctionReference<
        "action",
        "internal",
        { requestId: string },
        {
          content?: string;
          createdAt?: string;
          error?: string;
          requestId: string;
          responseTime?: number;
          sources: Array<{ favicon?: string; title?: string; url: string }>;
          status:
            | "pending"
            | "in_progress"
            | "processing"
            | "completed"
            | "failed";
        },
        Name
      >;
      research: FunctionReference<
        "action",
        "internal",
        {
          citationFormat?: "numbered" | "mla" | "apa" | "chicago";
          excludeDomains?: Array<string>;
          includeDomains?: Array<string>;
          input: string;
          model?: "mini" | "pro" | "auto";
          outputLength?: "short" | "standard" | "long";
        },
        {
          createdAt?: string;
          input?: string;
          model?: string;
          requestId: string;
          responseTime?: number;
          status:
            | "pending"
            | "in_progress"
            | "processing"
            | "completed"
            | "failed";
        },
        Name
      >;
      researchStream: FunctionReference<
        "action",
        "internal",
        {
          citationFormat?: "numbered" | "mla" | "apa" | "chicago";
          excludeDomains?: Array<string>;
          includeDomains?: Array<string>;
          input: string;
          model?: "mini" | "pro" | "auto";
          outputLength?: "short" | "standard" | "long";
        },
        {
          content?: string;
          events: Array<{
            arguments?: string;
            content?: string;
            error?: string;
            id?: string;
            name?: string;
            queries?: Array<string>;
            sources?: Array<{ favicon?: string; title?: string; url: string }>;
            type:
              | "tool_call"
              | "tool_response"
              | "content"
              | "sources"
              | "error";
          }>;
          model?: string;
          requestId?: string;
          sources: Array<{ favicon?: string; title?: string; url: string }>;
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
