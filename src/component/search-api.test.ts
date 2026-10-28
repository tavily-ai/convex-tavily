/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import { api } from "./_generated/api.js";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

type FetchCall = { url: string; init: RequestInit };

function stubFetch(body: unknown, status = 200) {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(body), { status });
    }),
  );
  return calls;
}

function callAt(calls: FetchCall[], index = 0): FetchCall {
  const call = calls[index];
  if (!call) throw new Error(`expected fetch call #${index}`);
  return call;
}

function sentBody(call: FetchCall) {
  return JSON.parse(call.init.body as string) as Record<string, unknown>;
}

beforeEach(() => vi.stubEnv("TAVILY_API_KEY", "tvly-test-not-real"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("search action request and response", () => {
  test("identifies the integration by name and the access surface as api", async () => {
    const calls = stubFetch({ query: "q", results: [], images: [] });
    await convexTest(schema, modules).action(api.lib.search, { query: "q" });
    const headers = callAt(calls).init.headers as Record<string, string>;
    expect(callAt(calls).url).toBe("https://api.tavily.com/search");
    expect(headers["X-Client-Name"]).toBe("convex-tavily");
    expect(headers["X-Client-Source"]).toBe("api");
    expect(headers.Authorization).toBe("Bearer tvly-test-not-real");
  });

  test("sends current Search options, including false values", async () => {
    const calls = stubFetch({ query: "q", results: [], images: [] });
    await convexTest(schema, modules).action(api.lib.search, {
      query: "q",
      searchDepth: "fast",
      chunksPerSource: 2,
      includeDomains: ["example.com"],
      includeDomainsMode: "prefer",
      timeRange: "w",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      includePublishedDate: true,
      filterByPublishedDate: false,
      language: "english",
      filterByLanguage: true,
      autoParameters: false,
      exactMatch: false,
      safeSearch: false,
      includeUsage: true,
    });
    expect(sentBody(callAt(calls))).toEqual({
      query: "q",
      search_depth: "fast",
      chunks_per_source: 2,
      include_domains: ["example.com"],
      include_domains_mode: "prefer",
      time_range: "w",
      start_date: "2026-01-01",
      end_date: "2026-02-01",
      include_published_date: true,
      filter_by_published_date: false,
      language: "english",
      filter_by_language: true,
      auto_parameters: false,
      exact_match: false,
      safe_search: false,
      include_usage: true,
    });
  });

  test("country is sent for general topic and rejected for news", async () => {
    const calls = stubFetch({ query: "q", results: [], images: [] });
    const t = convexTest(schema, modules);
    await t.action(api.lib.search, {
      query: "q",
      topic: "general",
      country: "germany",
    });
    expect(sentBody(callAt(calls)).country).toBe("germany");
    await expect(
      t.action(api.lib.search, {
        query: "q",
        topic: "news",
        country: "germany",
      }),
    ).rejects.toThrow(/country is only available/);
    expect(calls).toHaveLength(1);
  });

  test("invalid option combinations fail before any request", async () => {
    const calls = stubFetch({ query: "q", results: [], images: [] });
    const t = convexTest(schema, modules);
    const bad: Array<[Record<string, unknown>, RegExp]> = [
      [{ includeDomainsMode: "restrict" }, /requires includeDomains/],
      [{ filterByLanguage: true }, /requires language/],
      [
        { safeSearch: true, searchDepth: "ultra-fast" },
        /safeSearch is not available/,
      ],
      [
        { chunksPerSource: 2, searchDepth: "ultra-fast" },
        /basic, advanced and fast/,
      ],
      [{ chunksPerSource: 4 }, /between 1 and 3/],
      [{ startDate: "01/02/2026" }, /YYYY-MM-DD/],
    ];
    for (const [extra, message] of bad) {
      await expect(
        t.action(api.lib.search, { query: "q", ...extra }),
      ).rejects.toThrow(message);
    }
    expect(calls).toHaveLength(0);
  });

  test("preserves published dates (including null), result images, usage and auto parameters", async () => {
    stubFetch({
      query: "q",
      images: [],
      results: [
        {
          title: "a",
          url: "https://a.example",
          content: "c",
          score: 0.9,
          published_date: "2026-10-01",
          images: [{ url: "https://a.example/i.png", description: "d" }],
        },
        {
          title: "b",
          url: "https://b.example",
          content: "c",
          score: 0.5,
          published_date: null,
        },
      ],
      auto_parameters: { topic: "news", search_depth: "basic" },
      usage: { credits: 0 },
      request_id: "req-1",
    });
    const out = await convexTest(schema, modules).action(api.lib.search, {
      query: "q",
      includePublishedDate: true,
    });
    expect(out.results[0]!.publishedDate).toBe("2026-10-01");
    expect(out.results[0]!.images).toEqual([
      { url: "https://a.example/i.png", description: "d" },
    ]);
    expect(out.results[1]!.publishedDate).toBeNull();
    expect(out.autoParameters).toEqual({
      topic: "news",
      search_depth: "basic",
    });
    expect(out.usage).toEqual({ credits: 0 });
    expect(out.requestId).toBe("req-1");
  });
});

describe("extract action request and response", () => {
  test("sends attribution headers and every Extract option, and keeps failed results and usage", async () => {
    const calls = stubFetch({
      results: [
        {
          url: "https://a.example",
          raw_content: "text",
          images: [],
          favicon: "https://a.example/f.ico",
        },
      ],
      failed_results: [{ url: "https://b.example", error: "timeout" }],
      usage: { credits: 1 },
      request_id: "req-2",
      response_time: 0.2,
    });
    const out = await convexTest(schema, modules).action(api.lib.extract, {
      urls: ["https://a.example", "https://b.example"],
      query: "pricing",
      chunksPerSource: 5,
      extractDepth: "advanced",
      format: "text",
      includeImages: false,
      includeFavicon: true,
      includeUsage: true,
      timeout: 45,
    });
    const headers = callAt(calls).init.headers as Record<string, string>;
    expect(callAt(calls).url).toBe("https://api.tavily.com/extract");
    expect(headers["X-Client-Name"]).toBe("convex-tavily");
    expect(headers["X-Client-Source"]).toBe("api");
    expect(sentBody(callAt(calls))).toEqual({
      urls: ["https://a.example", "https://b.example"],
      query: "pricing",
      chunks_per_source: 5,
      extract_depth: "advanced",
      format: "text",
      include_images: false,
      include_favicon: true,
      include_usage: true,
      timeout: 45,
    });
    expect(out.failedResults).toEqual([
      { url: "https://b.example", error: "timeout" },
    ]);
    expect(out.usage).toEqual({ credits: 1 });
    expect(out.requestId).toBe("req-2");
  });
});

test("explicit false language filter is forwarded without requiring a language", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ query: "docs", results: [] })),
    );
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TAVILY_API_KEY", "offline-key");
  const t = convexTest(schema, modules);
  await t.action(api.lib.search, { query: "docs", filterByLanguage: false });
  expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
    query: "docs",
    filter_by_language: false,
  });
});
