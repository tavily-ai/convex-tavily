import { v } from "convex/values";
import { action, env } from "./_generated/server.js";

const TAVILY_BASE_URL = "https://api.tavily.com";
const CLIENT_SOURCE = "convex-tavily";

const searchDepthValidator = v.union(v.literal("basic"), v.literal("advanced"));
const topicValidator = v.union(
  v.literal("general"),
  v.literal("news"),
  v.literal("finance"),
);
const timeRangeValidator = v.union(
  v.literal("day"),
  v.literal("week"),
  v.literal("month"),
  v.literal("year"),
);
const answerModeValidator = v.union(
  v.boolean(),
  v.literal("basic"),
  v.literal("advanced"),
);
const rawContentModeValidator = v.union(
  v.boolean(),
  v.literal("markdown"),
  v.literal("text"),
);
const extractDepthValidator = v.union(
  v.literal("basic"),
  v.literal("advanced"),
);
const formatValidator = v.union(v.literal("markdown"), v.literal("text"));

const usageValidator = v.object({ credits: v.number() });
const imageValidator = v.object({
  url: v.string(),
  description: v.optional(v.string()),
});
const searchResultValidator = v.object({
  title: v.string(),
  url: v.string(),
  content: v.string(),
  score: v.number(),
  rawContent: v.optional(v.string()),
  publishedDate: v.optional(v.string()),
  favicon: v.optional(v.string()),
});
const searchResponseValidator = v.object({
  query: v.string(),
  answer: v.optional(v.string()),
  images: v.array(imageValidator),
  results: v.array(searchResultValidator),
  responseTime: v.optional(v.number()),
  requestId: v.optional(v.string()),
  usage: v.optional(usageValidator),
});
const extractResultValidator = v.object({
  url: v.string(),
  title: v.optional(v.string()),
  rawContent: v.string(),
  images: v.array(v.string()),
  favicon: v.optional(v.string()),
});
const extractFailureValidator = v.object({
  url: v.string(),
  error: v.string(),
});
const extractResponseValidator = v.object({
  results: v.array(extractResultValidator),
  failedResults: v.array(extractFailureValidator),
  responseTime: v.optional(v.number()),
  requestId: v.optional(v.string()),
  usage: v.optional(usageValidator),
});

type SearchArgs = {
  query: string;
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean | "basic" | "advanced";
  includeRawContent?: boolean | "markdown" | "text";
  includeDomains?: string[];
  excludeDomains?: string[];
  timeRange?: "day" | "week" | "month" | "year";
  includeFavicon?: boolean;
  includeUsage?: boolean;
};

type ExtractArgs = {
  urls: string[];
  query?: string;
  chunksPerSource?: number;
  extractDepth?: "basic" | "advanced";
  format?: "markdown" | "text";
  includeImages?: boolean;
  includeFavicon?: boolean;
  includeUsage?: boolean;
  timeout?: number;
};

function compactRecord(entries: Array<[string, unknown]>) {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

function buildSearchBody(args: SearchArgs) {
  return compactRecord([
    ["query", args.query],
    ["search_depth", args.searchDepth],
    ["topic", args.topic],
    ["max_results", args.maxResults],
    ["include_images", args.includeImages],
    ["include_image_descriptions", args.includeImageDescriptions],
    ["include_answer", args.includeAnswer],
    ["include_raw_content", args.includeRawContent],
    ["include_domains", args.includeDomains],
    ["exclude_domains", args.excludeDomains],
    ["time_range", args.timeRange],
    ["include_favicon", args.includeFavicon],
    ["include_usage", args.includeUsage],
  ]);
}

function buildExtractBody(args: ExtractArgs) {
  return compactRecord([
    ["urls", args.urls],
    ["query", args.query],
    ["chunks_per_source", args.chunksPerSource],
    ["extract_depth", args.extractDepth],
    ["format", args.format],
    ["include_images", args.includeImages],
    ["include_favicon", args.includeFavicon],
    ["include_usage", args.includeUsage],
    ["timeout", args.timeout],
  ]);
}

function validateSearchArgs(args: SearchArgs) {
  const queryLength = args.query.trim().length;
  if (queryLength === 0 || queryLength > 400) {
    throw new Error(
      "Tavily search query must contain between 1 and 400 characters.",
    );
  }
  if (
    args.maxResults !== undefined &&
    (!Number.isInteger(args.maxResults) ||
      args.maxResults < 0 ||
      args.maxResults > 20)
  ) {
    throw new Error("maxResults must be an integer between 0 and 20.");
  }
}

function validateExtractArgs(args: ExtractArgs) {
  if (args.urls.length === 0 || args.urls.length > 20) {
    throw new Error("Tavily extract accepts between 1 and 20 URLs.");
  }
  if (args.chunksPerSource !== undefined && args.query === undefined) {
    throw new Error("Extract chunksPerSource requires query.");
  }
  if (
    args.chunksPerSource !== undefined &&
    (!Number.isInteger(args.chunksPerSource) ||
      args.chunksPerSource < 1 ||
      args.chunksPerSource > 5)
  ) {
    throw new Error(
      "Extract chunksPerSource must be an integer between 1 and 5.",
    );
  }
  if (
    args.timeout !== undefined &&
    (!Number.isFinite(args.timeout) || args.timeout < 1 || args.timeout > 60)
  ) {
    throw new Error("timeout must be between 1 and 60 seconds.");
  }
}

function buildHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Client-Source": CLIENT_SOURCE,
  };
}

async function callTavilyApi(
  endpoint: "/search" | "/extract",
  body: Record<string, unknown>,
  timeoutSeconds: number,
) {
  const response = await fetch(`${TAVILY_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(env.TAVILY_API_KEY),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutSeconds * 1_000),
  });

  const text = await response.text();
  const parsed = text.length > 0 ? tryParseJson(text) : null;
  if (!response.ok) {
    throw new Error(
      `Tavily ${endpoint} failed (${response.status}): ${readErrorMessage(parsed, text)}`,
    );
  }
  return parsed;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Tavily returned a non-JSON response.");
  }
}

function readErrorMessage(parsed: unknown, raw: string) {
  if (isRecord(parsed)) {
    if (typeof parsed.detail === "string") return parsed.detail;
    if (isRecord(parsed.detail) && typeof parsed.detail.error === "string") {
      return parsed.detail.error;
    }
    if (typeof parsed.error === "string") return parsed.error;
    if (isRecord(parsed.error) && typeof parsed.error.message === "string") {
      return parsed.error.message;
    }
  }
  return raw.slice(0, 300) || "Unknown Tavily API error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeUsage(value: unknown) {
  if (!isRecord(value) || typeof value.credits !== "number") return undefined;
  return { credits: value.credits };
}

function normalizeSearchResponse(value: unknown, query: string) {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    throw new Error("Tavily returned an invalid search response.");
  }

  const results = value.results.map((result) => {
    if (
      !isRecord(result) ||
      typeof result.title !== "string" ||
      typeof result.url !== "string" ||
      typeof result.content !== "string" ||
      typeof result.score !== "number"
    ) {
      throw new Error("Tavily returned an invalid search result.");
    }
    return {
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
      ...(optionalString(result.raw_content) && {
        rawContent: result.raw_content as string,
      }),
      ...(optionalString(result.published_date) && {
        publishedDate: result.published_date as string,
      }),
      ...(optionalString(result.favicon) && {
        favicon: result.favicon as string,
      }),
    };
  });

  const images = Array.isArray(value.images)
    ? value.images.flatMap((image) => {
        if (typeof image === "string") return [{ url: image }];
        if (isRecord(image) && typeof image.url === "string") {
          return [
            {
              url: image.url,
              ...(optionalString(image.description) && {
                description: image.description as string,
              }),
            },
          ];
        }
        return [];
      })
    : [];

  return {
    query: optionalString(value.query) ?? query,
    images,
    results,
    ...(optionalString(value.answer) && { answer: value.answer as string }),
    ...(optionalNumber(value.response_time) !== undefined && {
      responseTime: value.response_time as number,
    }),
    ...(optionalString(value.request_id) && {
      requestId: value.request_id as string,
    }),
    ...(normalizeUsage(value.usage) && { usage: normalizeUsage(value.usage) }),
  };
}

function normalizeExtractResponse(value: unknown) {
  if (
    !isRecord(value) ||
    !Array.isArray(value.results) ||
    !Array.isArray(value.failed_results)
  ) {
    throw new Error("Tavily returned an invalid extract response.");
  }

  const results = value.results.map((result) => {
    if (
      !isRecord(result) ||
      typeof result.url !== "string" ||
      typeof result.raw_content !== "string"
    ) {
      throw new Error("Tavily returned an invalid extract result.");
    }
    return {
      url: result.url,
      rawContent: result.raw_content,
      images: stringArray(result.images),
      ...(optionalString(result.title) && { title: result.title as string }),
      ...(optionalString(result.favicon) && {
        favicon: result.favicon as string,
      }),
    };
  });

  const failedResults = value.failed_results.map((failure) => {
    if (
      !isRecord(failure) ||
      typeof failure.url !== "string" ||
      typeof failure.error !== "string"
    ) {
      throw new Error("Tavily returned an invalid extract failure.");
    }
    return { url: failure.url, error: failure.error };
  });

  return {
    results,
    failedResults,
    ...(optionalNumber(value.response_time) !== undefined && {
      responseTime: value.response_time as number,
    }),
    ...(optionalString(value.request_id) && {
      requestId: value.request_id as string,
    }),
    ...(normalizeUsage(value.usage) && { usage: normalizeUsage(value.usage) }),
  };
}

export const search = action({
  args: {
    query: v.string(),
    searchDepth: v.optional(searchDepthValidator),
    topic: v.optional(topicValidator),
    maxResults: v.optional(v.number()),
    includeImages: v.optional(v.boolean()),
    includeImageDescriptions: v.optional(v.boolean()),
    includeAnswer: v.optional(answerModeValidator),
    includeRawContent: v.optional(rawContentModeValidator),
    includeDomains: v.optional(v.array(v.string())),
    excludeDomains: v.optional(v.array(v.string())),
    timeRange: v.optional(timeRangeValidator),
    includeFavicon: v.optional(v.boolean()),
    includeUsage: v.optional(v.boolean()),
  },
  returns: searchResponseValidator,
  handler: async (_ctx, args) => {
    validateSearchArgs(args);
    const response = await callTavilyApi("/search", buildSearchBody(args), 60);
    return normalizeSearchResponse(response, args.query);
  },
});

export const extract = action({
  args: {
    urls: v.array(v.string()),
    query: v.optional(v.string()),
    chunksPerSource: v.optional(v.number()),
    extractDepth: v.optional(extractDepthValidator),
    format: v.optional(formatValidator),
    includeImages: v.optional(v.boolean()),
    includeFavicon: v.optional(v.boolean()),
    includeUsage: v.optional(v.boolean()),
    timeout: v.optional(v.number()),
  },
  returns: extractResponseValidator,
  handler: async (_ctx, args) => {
    validateExtractArgs(args);
    const response = await callTavilyApi(
      "/extract",
      buildExtractBody(args),
      args.timeout ?? 30,
    );
    return normalizeExtractResponse(response);
  },
});

export const _test = {
  buildSearchBody,
  buildExtractBody,
  validateSearchArgs,
  validateExtractArgs,
  buildHeaders,
  normalizeSearchResponse,
  normalizeExtractResponse,
  readErrorMessage,
};
