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
const researchModelValidator = v.union(
  v.literal("mini"),
  v.literal("pro"),
  v.literal("auto"),
);
const citationFormatValidator = v.union(
  v.literal("numbered"),
  v.literal("mla"),
  v.literal("apa"),
  v.literal("chicago"),
);
const outputLengthValidator = v.union(
  v.literal("short"),
  v.literal("standard"),
  v.literal("long"),
);
const researchStatusValidator = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);

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
const researchSourceValidator = v.object({
  url: v.string(),
  title: v.optional(v.string()),
  favicon: v.optional(v.string()),
});
const researchJobResponseValidator = v.object({
  requestId: v.string(),
  createdAt: v.optional(v.string()),
  status: researchStatusValidator,
  input: v.optional(v.string()),
  model: v.optional(v.string()),
  responseTime: v.optional(v.number()),
});
const researchGetResponseValidator = v.object({
  requestId: v.string(),
  createdAt: v.optional(v.string()),
  status: researchStatusValidator,
  content: v.optional(v.string()),
  sources: v.array(researchSourceValidator),
  responseTime: v.optional(v.number()),
  error: v.optional(v.string()),
});
const researchStreamEventValidator = v.object({
  type: v.union(
    v.literal("tool_call"),
    v.literal("tool_response"),
    v.literal("content"),
    v.literal("sources"),
    v.literal("error"),
  ),
  name: v.optional(v.string()),
  id: v.optional(v.string()),
  arguments: v.optional(v.string()),
  queries: v.optional(v.array(v.string())),
  sources: v.optional(v.array(researchSourceValidator)),
  content: v.optional(v.string()),
  error: v.optional(v.string()),
});
const researchStreamResponseValidator = v.object({
  content: v.optional(v.string()),
  sources: v.array(researchSourceValidator),
  events: v.array(researchStreamEventValidator),
  model: v.optional(v.string()),
  requestId: v.optional(v.string()),
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

type ResearchArgs = {
  input: string;
  model?: "mini" | "pro" | "auto";
  citationFormat?: "numbered" | "mla" | "apa" | "chicago";
  includeDomains?: string[];
  excludeDomains?: string[];
  outputLength?: "short" | "standard" | "long";
};

type ResearchStreamEvent = {
  type: "tool_call" | "tool_response" | "content" | "sources" | "error";
  name?: string;
  id?: string;
  arguments?: string;
  queries?: string[];
  sources?: Array<{ url: string; title?: string; favicon?: string }>;
  content?: string;
  error?: string;
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

function buildResearchBody(args: ResearchArgs, stream: boolean) {
  return compactRecord([
    ["input", args.input],
    ["model", args.model],
    ["stream", stream],
    ["citation_format", args.citationFormat],
    ["include_domains", args.includeDomains],
    ["exclude_domains", args.excludeDomains],
    ["output_length", args.outputLength],
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

function validateResearchArgs(args: ResearchArgs) {
  if (args.input.trim().length === 0) {
    throw new Error("Tavily research input must be a non-empty string.");
  }
  if (args.includeDomains !== undefined && args.includeDomains.length > 20) {
    throw new Error("includeDomains accepts at most 20 domains.");
  }
  if (args.excludeDomains !== undefined && args.excludeDomains.length > 20) {
    throw new Error("excludeDomains accepts at most 20 domains.");
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
  endpoint: "/search" | "/extract" | "/research",
  body: Record<string, unknown>,
  timeoutSeconds: number,
  method: "POST" | "GET" = "POST",
  pathSuffix = "",
) {
  const response = await fetch(`${TAVILY_BASE_URL}${endpoint}${pathSuffix}`, {
    method,
    headers: buildHeaders(env.TAVILY_API_KEY),
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
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

function normalizeSources(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((source) => {
    if (!isRecord(source) || typeof source.url !== "string") return [];
    return [
      {
        url: source.url,
        ...(optionalString(source.title) && { title: source.title as string }),
        ...(optionalString(source.favicon) && {
          favicon: source.favicon as string,
        }),
      },
    ];
  });
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

function normalizeResearchStatus(value: unknown): ResearchJobResponse["status"] {
  if (typeof value !== "string") return "pending";
  if (
    value === "pending" ||
    value === "in_progress" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }
  return "pending";
}

type ResearchJobResponse = {
  requestId: string;
  createdAt?: string;
  status: "pending" | "in_progress" | "processing" | "completed" | "failed";
  input?: string;
  model?: string;
  responseTime?: number;
};

function normalizeResearchJobResponse(value: unknown): ResearchJobResponse {
  if (!isRecord(value) || typeof value.request_id !== "string") {
    throw new Error("Tavily returned an invalid research job response.");
  }
  return {
    requestId: value.request_id,
    status: normalizeResearchStatus(value.status),
    ...(optionalString(value.created_at) && {
      createdAt: value.created_at as string,
    }),
    ...(optionalString(value.input) && { input: value.input as string }),
    ...(optionalString(value.model) && { model: value.model as string }),
    ...(optionalNumber(value.response_time) !== undefined && {
      responseTime: value.response_time as number,
    }),
  };
}

function normalizeResearchGetResponse(value: unknown) {
  if (!isRecord(value) || typeof value.request_id !== "string") {
    throw new Error("Tavily returned an invalid research status response.");
  }

  const content =
    typeof value.content === "string"
      ? value.content
      : value.content !== undefined
        ? JSON.stringify(value.content)
        : undefined;

  return {
    requestId: value.request_id,
    status: normalizeResearchStatus(value.status),
    sources: normalizeSources(value.sources),
    ...(optionalString(value.created_at) && {
      createdAt: value.created_at as string,
    }),
    ...(content !== undefined && { content }),
    ...(optionalNumber(value.response_time) !== undefined && {
      responseTime: value.response_time as number,
    }),
    ...(optionalString(value.error) && { error: value.error as string }),
  };
}

function contentToString(value: unknown) {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return undefined;
  return JSON.stringify(value);
}

function normalizeStreamEvent(payload: unknown): ResearchStreamEvent | null {
  if (!isRecord(payload)) return null;
  if (payload.object === "error") {
    return {
      type: "error",
      error:
        optionalString(payload.error) ??
        "An error occurred while streaming the research task",
    };
  }

  const choice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;
  const delta =
    isRecord(choice) && isRecord(choice.delta) ? choice.delta : undefined;
  if (!delta) return null;

  if (typeof delta.content === "string" || isRecord(delta.content)) {
    const content = contentToString(delta.content);
    if (content === undefined) return null;
    return { type: "content", content };
  }

  if (Array.isArray(delta.sources)) {
    return { type: "sources", sources: normalizeSources(delta.sources) };
  }

  if (isRecord(delta.tool_calls)) {
    const toolCalls = delta.tool_calls;
    if (toolCalls.type === "tool_call" && Array.isArray(toolCalls.tool_call)) {
      const tool = toolCalls.tool_call[0];
      if (!isRecord(tool)) return null;
      return {
        type: "tool_call",
        ...(optionalString(tool.name) && { name: tool.name as string }),
        ...(optionalString(tool.id) && { id: tool.id as string }),
        ...(optionalString(tool.arguments) && {
          arguments: tool.arguments as string,
        }),
        ...(Array.isArray(tool.queries) && {
          queries: stringArray(tool.queries),
        }),
      };
    }
    if (
      toolCalls.type === "tool_response" &&
      Array.isArray(toolCalls.tool_response)
    ) {
      const tool = toolCalls.tool_response[0];
      if (!isRecord(tool)) return null;
      return {
        type: "tool_response",
        ...(optionalString(tool.name) && { name: tool.name as string }),
        ...(optionalString(tool.id) && { id: tool.id as string }),
        ...(optionalString(tool.arguments) && {
          arguments: tool.arguments as string,
        }),
        ...(Array.isArray(tool.sources) && {
          sources: normalizeSources(tool.sources),
        }),
      };
    }
  }

  return null;
}

async function consumeResearchStream(
  args: ResearchArgs,
  timeoutSeconds: number,
) {
  const response = await fetch(`${TAVILY_BASE_URL}/research`, {
    method: "POST",
    headers: buildHeaders(env.TAVILY_API_KEY),
    body: JSON.stringify(buildResearchBody(args, true)),
    signal: AbortSignal.timeout(timeoutSeconds * 1_000),
  });

  if (!response.ok) {
    const text = await response.text();
    const parsed = text.length > 0 ? tryParseJson(text) : null;
    throw new Error(
      `Tavily /research failed (${response.status}): ${readErrorMessage(parsed, text)}`,
    );
  }

  if (!response.body) {
    throw new Error("Tavily research stream returned an empty body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: ResearchStreamEvent[] = [];
  let content = "";
  let sources: Array<{ url: string; title?: string; favicon?: string }> = [];
  let model: string | undefined;
  let requestId: string | undefined;

  const handlePayload = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[DONE]") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return;
    }
    if (isRecord(parsed)) {
      if (typeof parsed.id === "string" && requestId === undefined) {
        requestId = parsed.id;
      }
      if (typeof parsed.model === "string") {
        model = parsed.model;
      }
    }
    const event = normalizeStreamEvent(parsed);
    if (!event) return;
    events.push(event);
    if (event.type === "content" && event.content) {
      content += event.content;
    }
    if (event.type === "sources" && event.sources) {
      sources = event.sources;
    }
    if (event.type === "error") {
      throw new Error(event.error ?? "Tavily research stream failed.");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      const chunk = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);

      const dataLines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart());
      if (dataLines.length > 0) {
        handlePayload(dataLines.join("\n"));
      }

      separator = buffer.indexOf("\n\n");
    }
  }

  if (buffer.trim().length > 0) {
    const dataLines = buffer
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());
    if (dataLines.length > 0) {
      handlePayload(dataLines.join("\n"));
    }
  }

  return {
    sources,
    events,
    ...(content.length > 0 && { content }),
    ...(model && { model }),
    ...(requestId && { requestId }),
  };
}

const researchArgsValidator = {
  input: v.string(),
  model: v.optional(researchModelValidator),
  citationFormat: v.optional(citationFormatValidator),
  includeDomains: v.optional(v.array(v.string())),
  excludeDomains: v.optional(v.array(v.string())),
  outputLength: v.optional(outputLengthValidator),
};

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

/** Start a research task and return a requestId for polling via getResearch. */
export const research = action({
  args: researchArgsValidator,
  returns: researchJobResponseValidator,
  handler: async (_ctx, args) => {
    validateResearchArgs(args);
    const response = await callTavilyApi(
      "/research",
      buildResearchBody(args, false),
      60,
    );
    return normalizeResearchJobResponse(response);
  },
});

/** Poll a previously started research task. */
export const getResearch = action({
  args: { requestId: v.string() },
  returns: researchGetResponseValidator,
  handler: async (_ctx, args) => {
    if (args.requestId.trim().length === 0) {
      throw new Error("requestId must be a non-empty string.");
    }
    const response = await callTavilyApi(
      "/research",
      {},
      60,
      "GET",
      `/${encodeURIComponent(args.requestId)}`,
    );
    return normalizeResearchGetResponse(response);
  },
});

/**
 * Run research with Tavily SSE streaming.
 * Consumes the stream inside the action and returns progress events plus the
 * final report. Use this when you want stream semantics without an HTTP route;
 * use research + getResearch when you prefer to poll asynchronously.
 */
export const researchStream = action({
  args: researchArgsValidator,
  returns: researchStreamResponseValidator,
  handler: async (_ctx, args) => {
    validateResearchArgs(args);
    return await consumeResearchStream(args, 600);
  },
});

export const _test = {
  buildSearchBody,
  buildExtractBody,
  buildResearchBody,
  validateSearchArgs,
  validateExtractArgs,
  validateResearchArgs,
  buildHeaders,
  normalizeSearchResponse,
  normalizeExtractResponse,
  normalizeResearchJobResponse,
  normalizeResearchGetResponse,
  normalizeStreamEvent,
  readErrorMessage,
};
