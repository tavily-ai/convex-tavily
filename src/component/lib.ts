import { v, type Infer } from "convex/values";
import { action, env } from "./_generated/server.js";

const TAVILY_BASE_URL = "https://api.tavily.com";
// Identity of this integration (X-Client-Name); X-Client-Source names the access surface (direct API).
const CLIENT_NAME = "convex-tavily";
const CLIENT_SOURCE = "api";

const searchDepthValidator = v.union(
  v.literal("basic"),
  v.literal("advanced"),
  v.literal("fast"),
  v.literal("ultra-fast"),
);
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
  v.literal("d"),
  v.literal("w"),
  v.literal("m"),
  v.literal("y"),
);
const includeDomainsModeValidator = v.union(
  v.literal("restrict"),
  v.literal("prefer"),
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
  // null when Tavily could not detect a date (only returned when published dates are requested).
  publishedDate: v.optional(v.union(v.string(), v.null())),
  favicon: v.optional(v.string()),
  images: v.optional(v.array(imageValidator)),
});
const searchResponseValidator = v.object({
  query: v.string(),
  answer: v.optional(v.string()),
  images: v.array(imageValidator),
  results: v.array(searchResultValidator),
  responseTime: v.optional(v.number()),
  requestId: v.optional(v.string()),
  usage: v.optional(usageValidator),
  autoParameters: v.optional(v.record(v.string(), v.any())),
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

const searchArgsValidator = v.object({
  query: v.string(),
  searchDepth: v.optional(searchDepthValidator),
  chunksPerSource: v.optional(v.number()),
  topic: v.optional(topicValidator),
  maxResults: v.optional(v.number()),
  includeImages: v.optional(v.boolean()),
  includeImageDescriptions: v.optional(v.boolean()),
  includeAnswer: v.optional(answerModeValidator),
  includeRawContent: v.optional(rawContentModeValidator),
  includeDomains: v.optional(v.array(v.string())),
  excludeDomains: v.optional(v.array(v.string())),
  includeDomainsMode: v.optional(includeDomainsModeValidator),
  timeRange: v.optional(timeRangeValidator),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  includePublishedDate: v.optional(v.boolean()),
  filterByPublishedDate: v.optional(v.boolean()),
  country: v.optional(v.string()),
  language: v.optional(v.string()),
  filterByLanguage: v.optional(v.boolean()),
  autoParameters: v.optional(v.boolean()),
  exactMatch: v.optional(v.boolean()),
  safeSearch: v.optional(v.boolean()),
  includeFavicon: v.optional(v.boolean()),
  includeUsage: v.optional(v.boolean()),
});
type SearchArgs = Infer<typeof searchArgsValidator>;

const extractArgsValidator = v.object({
  urls: v.array(v.string()),
  query: v.optional(v.string()),
  chunksPerSource: v.optional(v.number()),
  extractDepth: v.optional(extractDepthValidator),
  format: v.optional(formatValidator),
  includeImages: v.optional(v.boolean()),
  includeFavicon: v.optional(v.boolean()),
  includeUsage: v.optional(v.boolean()),
  timeout: v.optional(v.number()),
});
type ExtractArgs = Infer<typeof extractArgsValidator>;

function compactRecord(entries: Array<[string, unknown]>) {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

function buildSearchBody(args: SearchArgs) {
  return compactRecord([
    ["query", args.query],
    ["search_depth", args.searchDepth],
    ["chunks_per_source", args.chunksPerSource],
    ["topic", args.topic],
    ["max_results", args.maxResults],
    ["include_images", args.includeImages],
    ["include_image_descriptions", args.includeImageDescriptions],
    ["include_answer", args.includeAnswer],
    ["include_raw_content", args.includeRawContent],
    ["include_domains", args.includeDomains],
    ["exclude_domains", args.excludeDomains],
    ["include_domains_mode", args.includeDomainsMode],
    ["time_range", args.timeRange],
    ["start_date", args.startDate],
    ["end_date", args.endDate],
    ["include_published_date", args.includePublishedDate],
    ["filter_by_published_date", args.filterByPublishedDate],
    ["country", args.country],
    ["language", args.language],
    ["filter_by_language", args.filterByLanguage],
    ["auto_parameters", args.autoParameters],
    ["exact_match", args.exactMatch],
    ["safe_search", args.safeSearch],
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
  if (args.chunksPerSource !== undefined) {
    if (
      !Number.isInteger(args.chunksPerSource) ||
      args.chunksPerSource < 1 ||
      args.chunksPerSource > 3
    ) {
      throw new Error("chunksPerSource must be an integer between 1 and 3.");
    }
    if (args.searchDepth === "ultra-fast") {
      throw new Error(
        "chunksPerSource is available for basic, advanced and fast search depths.",
      );
    }
  }
  if (
    args.includeDomainsMode !== undefined &&
    (args.includeDomains === undefined || args.includeDomains.length === 0)
  ) {
    throw new Error("includeDomainsMode requires includeDomains.");
  }
  if (args.filterByLanguage === true && !args.language) {
    throw new Error("filterByLanguage requires language.");
  }
  if (
    args.safeSearch === true &&
    (args.searchDepth === "fast" || args.searchDepth === "ultra-fast")
  ) {
    throw new Error(
      "safeSearch is not available for fast or ultra-fast search depths.",
    );
  }
  if (
    args.country !== undefined &&
    args.topic !== undefined &&
    args.topic !== "general"
  ) {
    throw new Error("country is only available when topic is general.");
  }
  for (const [name, value] of [
    ["startDate", args.startDate],
    ["endDate", args.endDate],
  ] as const) {
    if (value !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`${name} must use the YYYY-MM-DD format.`);
    }
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
    "X-Client-Name": CLIENT_NAME,
    "X-Client-Source": CLIENT_SOURCE,
  };
}

function requireApiKey(): string {
  const apiKey = env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Set it on the Convex deployment " +
        "(npx convex env set TAVILY_API_KEY ...) and wire it to the tavily " +
        "component in convex/convex.config.ts.",
    );
  }
  return apiKey;
}

async function callTavilyApi(
  endpoint: "/search" | "/extract" | "/map" | "/crawl",
  body: Record<string, unknown>,
  timeoutSeconds: number,
) {
  const response = await fetch(`${TAVILY_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(requireApiKey()),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutSeconds * 1_000),
  });

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    if (response.ok) throw new Error("Tavily returned a non-JSON response.");
    parsed = null;
  }
  if (!response.ok) {
    throw new Error(
      `Tavily ${endpoint} failed (${response.status}): ${readErrorMessage(parsed, text)}`,
    );
  }
  return parsed;
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

function normalizeImages(value: unknown) {
  return Array.isArray(value)
    ? value.flatMap((image) => {
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
      ...((typeof result.published_date === "string" ||
        result.published_date === null) && {
        publishedDate: result.published_date as string | null,
      }),
      ...(optionalString(result.favicon) && {
        favicon: result.favicon as string,
      }),
      ...(Array.isArray(result.images) && {
        images: normalizeImages(result.images),
      }),
    };
  });

  const images = normalizeImages(value.images);

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
    ...(isRecord(value.auto_parameters) && {
      autoParameters: value.auto_parameters,
    }),
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
  args: searchArgsValidator.fields,
  returns: searchResponseValidator,
  handler: async (_ctx, args) => {
    validateSearchArgs(args);
    const response = await callTavilyApi("/search", buildSearchBody(args), 60);
    return normalizeSearchResponse(response, args.query);
  },
});

export const extract = action({
  args: extractArgsValidator.fields,
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
  requireApiKey,
  normalizeSearchResponse,
  normalizeExtractResponse,
  readErrorMessage,
};

// Discovery actions share traversal controls; Crawl additionally extracts content.
const traversalArgs = {
  url: v.string(),
  instructions: v.optional(v.string()),
  maxDepth: v.optional(v.number()),
  maxBreadth: v.optional(v.number()),
  limit: v.optional(v.number()),
  selectPaths: v.optional(v.array(v.string())),
  selectDomains: v.optional(v.array(v.string())),
  excludePaths: v.optional(v.array(v.string())),
  excludeDomains: v.optional(v.array(v.string())),
  allowExternal: v.optional(v.boolean()),
  timeout: v.optional(v.number()),
  includeUsage: v.optional(v.boolean()),
};
const _traversalValidator = v.object(traversalArgs);
type TraversalArgs = Infer<typeof _traversalValidator>;
const responseMetadata = {
  responseTime: v.optional(v.number()),
  requestId: v.optional(v.string()),
  usage: v.optional(v.record(v.string(), v.any())),
};

function validateTraversal(args: TraversalArgs) {
  if (!args.url.trim()) throw new Error("url must not be empty.");
  for (const [name, min, max] of [
    ["maxDepth", 1, 5],
    ["maxBreadth", 1, 500],
    ["limit", 1, Number.MAX_SAFE_INTEGER],
  ] as const) {
    const n = args[name];
    if (n !== undefined && (!Number.isSafeInteger(n) || n < min || n > max)) {
      throw new Error(`${name} must be an integer between ${min} and ${max}.`);
    }
  }
  if (
    args.timeout !== undefined &&
    (!Number.isFinite(args.timeout) || args.timeout < 10 || args.timeout > 150)
  ) {
    throw new Error("timeout must be between 10 and 150 seconds.");
  }
}

function traversalBody(args: TraversalArgs) {
  return compactRecord([
    ["url", args.url],
    ["instructions", args.instructions],
    ["max_depth", args.maxDepth],
    ["max_breadth", args.maxBreadth],
    ["limit", args.limit],
    ["select_paths", args.selectPaths],
    ["select_domains", args.selectDomains],
    ["exclude_paths", args.excludePaths],
    ["exclude_domains", args.excludeDomains],
    ["allow_external", args.allowExternal],
    ["timeout", args.timeout],
    ["include_usage", args.includeUsage],
  ]);
}

function metadata(value: Record<string, unknown>) {
  return {
    ...(typeof value.response_time === "number" && {
      responseTime: value.response_time,
    }),
    ...(typeof value.request_id === "string" && {
      requestId: value.request_id,
    }),
    ...(isRecord(value.usage) && { usage: value.usage }),
  };
}

export const map = action({
  args: traversalArgs,
  returns: v.object({
    baseUrl: v.string(),
    results: v.array(v.string()),
    ...responseMetadata,
  }),
  handler: async (_ctx, args) => {
    validateTraversal(args);
    // Allow the service's operation timeout plus transport overhead.
    const value = await callTavilyApi(
      "/map",
      traversalBody(args),
      (args.timeout ?? 150) + 10,
    );
    if (
      !isRecord(value) ||
      typeof value.base_url !== "string" ||
      !Array.isArray(value.results) ||
      !value.results.every((url) => typeof url === "string")
    ) {
      throw new Error("Tavily returned an invalid map response.");
    }
    return {
      baseUrl: value.base_url,
      results: value.results as string[],
      ...metadata(value),
    };
  },
});

export const crawl = action({
  args: {
    ...traversalArgs,
    chunksPerSource: v.optional(v.number()),
    extractDepth: v.optional(extractDepthValidator),
    format: v.optional(formatValidator),
    includeImages: v.optional(v.boolean()),
    includeFavicon: v.optional(v.boolean()),
  },
  returns: v.object({
    baseUrl: v.string(),
    results: v.array(extractResultValidator),
    failedResults: v.optional(v.array(extractFailureValidator)),
    ...responseMetadata,
  }),
  handler: async (_ctx, args) => {
    validateTraversal(args);
    if (args.chunksPerSource !== undefined) {
      if (!args.instructions?.trim())
        throw new Error("Crawl chunksPerSource requires instructions.");
      if (
        !Number.isInteger(args.chunksPerSource) ||
        args.chunksPerSource < 1 ||
        args.chunksPerSource > 5
      ) {
        throw new Error(
          "Crawl chunksPerSource must be an integer between 1 and 5.",
        );
      }
    }
    const value = await callTavilyApi(
      "/crawl",
      {
        ...traversalBody(args),
        ...compactRecord([
          ["chunks_per_source", args.chunksPerSource],
          ["extract_depth", args.extractDepth],
          ["format", args.format],
          ["include_images", args.includeImages],
          ["include_favicon", args.includeFavicon],
        ]),
      },
      (args.timeout ?? 150) + 10,
    );
    if (!isRecord(value) || typeof value.base_url !== "string")
      throw new Error("Tavily returned an invalid crawl response.");
    const extracted = normalizeExtractResponse({
      ...value,
      failed_results: value.failed_results ?? [],
    });
    return {
      baseUrl: value.base_url,
      results: extracted.results,
      ...metadata(value),
      ...(value.failed_results !== undefined && {
        failedResults: extracted.failedResults,
      }),
    };
  },
});
