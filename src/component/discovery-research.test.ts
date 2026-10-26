/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import { api } from "./_generated/api.js";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
function respond(body: unknown, status = 200) {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
beforeEach(() => vi.stubEnv("TAVILY_API_KEY", "tvly-offline-fixture"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const traversal = {
  url: "https://example.com",
  instructions: "Find documentation",
  maxDepth: 5,
  maxBreadth: 500,
  limit: 1000,
  selectPaths: ["/docs/.*"],
  selectDomains: ["example.com"],
  excludePaths: ["/private/.*"],
  excludeDomains: ["private.example.com"],
  allowExternal: false,
  includeUsage: true,
  timeout: 150,
};
const wireTraversal = {
  url: "https://example.com",
  instructions: "Find documentation",
  max_depth: 5,
  max_breadth: 500,
  limit: 1000,
  select_paths: ["/docs/.*"],
  select_domains: ["example.com"],
  exclude_paths: ["/private/.*"],
  exclude_domains: ["private.example.com"],
  allow_external: false,
  include_usage: true,
  timeout: 150,
};

describe("discovery actions", () => {
  test("Map exposes all traversal options and preserves URLs and zero usage", async () => {
    const fetch = respond({
      base_url: "example.com",
      results: ["https://example.com/docs"],
      response_time: 0,
      request_id: "map-1",
      usage: { credits: 0 },
    });
    const out = await convexTest(schema, modules).action(
      api.lib.map,
      traversal,
    );
    expect(fetch.mock.calls[0]![0]).toBe("https://api.tavily.com/map");
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual(wireTraversal);
    expect(out).toEqual({
      baseUrl: "example.com",
      results: ["https://example.com/docs"],
      responseTime: 0,
      requestId: "map-1",
      usage: { credits: 0 },
    });
  });
  test("Crawl adds extraction controls, content, titles, images, favicon and failures", async () => {
    const fetch = respond({
      base_url: "example.com",
      results: [
        {
          url: "https://example.com",
          raw_content: "",
          title: "Title",
          images: ["image"],
          favicon: "icon",
        },
      ],
      failed_results: [{ url: "bad", error: "timeout" }],
      request_id: "crawl-1",
      usage: { credits: 2 },
    });
    const out = await convexTest(schema, modules).action(api.lib.crawl, {
      ...traversal,
      chunksPerSource: 5,
      extractDepth: "advanced",
      format: "text",
      includeImages: false,
      includeFavicon: true,
    });
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
      ...wireTraversal,
      chunks_per_source: 5,
      extract_depth: "advanced",
      format: "text",
      include_images: false,
      include_favicon: true,
    });
    expect(out.results[0]).toEqual({
      url: "https://example.com",
      rawContent: "",
      title: "Title",
      images: ["image"],
      favicon: "icon",
    });
    expect(out.failedResults).toEqual([{ url: "bad", error: "timeout" }]);
  });
  test.each(["map", "crawl"] as const)(
    "%s leaves absent options absent and sends authentication/attribution",
    async (method) => {
      const fetch = respond({ base_url: "example.com", results: [] });
      await convexTest(schema, modules).action(api.lib[method], {
        url: "example.com",
      });
      const init = fetch.mock.calls[0]![1];
      expect(JSON.parse(init.body)).toEqual({ url: "example.com" });
      expect(init.headers).toMatchObject({
        Authorization: "Bearer tvly-offline-fixture",
        "X-Client-Name": "convex-tavily",
        "X-Client-Source": "api",
      });
      expect(init.signal).toBeInstanceOf(AbortSignal);
    },
  );
  test.each([
    { maxDepth: 6 },
    { maxDepth: 1.5 },
    { maxBreadth: 501 },
    { limit: 0 },
    { timeout: 9 },
    { timeout: 151 },
  ])("rejects invalid traversal %j before HTTP", async (extra) => {
    const fetch = respond({});
    const t = convexTest(schema, modules);
    for (const method of ["map", "crawl"] as const) {
      await expect(
        t.action(api.lib[method], { url: "example.com", ...extra }),
      ).rejects.toThrow();
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  test("Crawl chunks require instructions and the 1-5 range", async () => {
    const fetch = respond({});
    const t = convexTest(schema, modules);
    await expect(
      t.action(api.lib.crawl, { url: "example.com", chunksPerSource: 2 }),
    ).rejects.toThrow(/instructions/);
    await expect(
      t.action(api.lib.crawl, {
        url: "example.com",
        instructions: "q",
        chunksPerSource: 6,
      }),
    ).rejects.toThrow(/chunksPerSource/);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Research task lifecycle", () => {
  test("submits every control as JSON and returns HTTP201 task without polling", async () => {
    const fetch = respond(
      {
        request_id: "task-1",
        status: "pending",
        created_at: "date",
        input: "Compare",
        model: "pro",
        response_time: 0.1,
      },
      201,
    );
    const outputSchema = {
      properties: { summary: { type: "string", description: "Summary" } },
      required: ["summary"],
    };
    const files = [
      { name: "brief.md", data: "aGVsbG8=", type: "base64" as const },
    ];
    const out = await convexTest(schema, modules).action(api.lib.research, {
      input: "Compare",
      model: "pro",
      outputSchema,
      citationFormat: "apa",
      includeDomains: ["example.com"],
      excludeDomains: ["other.com"],
      outputLength: "long",
      files,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
      input: "Compare",
      model: "pro",
      stream: false,
      output_schema: outputSchema,
      citation_format: "apa",
      include_domains: ["example.com"],
      exclude_domains: ["other.com"],
      output_length: "long",
      files,
    });
    expect(out).toEqual({
      requestId: "task-1",
      status: "pending",
      createdAt: "date",
      input: "Compare",
      model: "pro",
      responseTime: 0.1,
    });
  });
  test.each(["pending", "in_progress", "completed", "failed"])(
    "reads %s without inventing completion or dropping structured content/sources",
    async (status) => {
      const completed = {
        content: { summary: "Report [1]", nested: { count: 0 } },
        sources: [
          { title: "source", url: "https://example.com", favicon: "icon" },
          { title: "brief.md", type: "file", file_name: "brief.md" },
        ],
      };
      const extras =
        status === "completed"
          ? completed
          : status === "failed"
            ? { error: { message: "Task failed" } }
            : {};
      const fetch = respond({
        request_id: "task/1?",
        status,
        ...extras,
        usage: { credits: 0 },
        response_time: 0,
      });
      const out = await convexTest(schema, modules).action(
        api.lib.getResearch,
        { requestId: "task/1?" },
      );
      expect(fetch.mock.calls[0]![0]).toBe(
        "https://api.tavily.com/research/task%2F1%3F",
      );
      expect(fetch.mock.calls[0]![1].method).toBe("GET");
      expect(fetch.mock.calls[0]![1].body).toBeUndefined();
      expect(out).toEqual({
        requestId: "task/1?",
        status,
        ...extras,
        usage: { credits: 0 },
        responseTime: 0,
      });
    },
  );
  test.each([
    { input: " " },
    { input: "q", includeDomains: Array(21).fill("x") },
    { input: "q", files: Array(6).fill({ name: "a.md", data: "" }) },
    { input: "q", files: [{ name: "a.pdf", data: "YQ==" }] },
    { input: "q", files: [{ name: "a.md", data: "%%%" }] },
    { input: "q", outputSchema: {} },
  ])("rejects invalid Research input before HTTP: %j", async (args) => {
    const fetch = respond({});
    await expect(
      convexTest(schema, modules).action(api.lib.research, args),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("API failures", () => {
  test.each([400, 401, 429, 432, 500])(
    "retains HTTP %s and structured error detail",
    async (status) => {
      respond({ detail: { error: "request rejected" } }, status);
      await expect(
        convexTest(schema, modules).action(api.lib.research, { input: "q" }),
      ).rejects.toThrow(`(${status}): request rejected`);
    },
  );
  test("retains status for non-JSON errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("upstream unavailable", { status: 503 }),
        ),
    );
    await expect(
      convexTest(schema, modules).action(api.lib.map, { url: "example.com" }),
    ).rejects.toThrow(/503.*upstream unavailable/);
  });
  test("rejects malformed successful responses", async () => {
    respond({ status: "completed", request_id: "x" });
    await expect(
      convexTest(schema, modules).action(api.lib.getResearch, {
        requestId: "x",
      }),
    ).rejects.toThrow(/invalid research/);
  });
});

test("Research enforces combined file words without making a request", async () => {
  const fetch = respond({});
  const data = btoa("word ".repeat(40001));
  await expect(
    convexTest(schema, modules).action(api.lib.research, {
      input: "q",
      files: [
        { name: "one.md", data },
        { name: "two.txt", data },
      ],
    }),
  ).rejects.toThrow(/80000 words combined/);
  expect(fetch).not.toHaveBeenCalled();
});

test("Research accepts all model choices and unstructured report text", async () => {
  for (const model of ["mini", "pro", "auto"] as const) {
    const fetch = respond({ request_id: "id", status: "pending" }, 201);
    await convexTest(schema, modules).action(api.lib.research, {
      input: "q",
      model,
    });
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
      input: "q",
      model,
      stream: false,
    });
  }
  respond({
    request_id: "id",
    status: "completed",
    content: "Report [1]",
    sources: [{ url: "https://example.com", title: "Citation" }],
  });
  const out = await convexTest(schema, modules).action(api.lib.getResearch, {
    requestId: "id",
  });
  expect(out.content).toBe("Report [1]");
});

test("Research rejects an invalid model at the Convex boundary", async () => {
  const fetch = respond({});
  await expect(
    convexTest(schema, modules).action(api.lib.research, {
      input: "q",
      // @ts-expect-error Exercise the actual runtime validator too.
      model: "unsupported",
    }),
  ).rejects.toThrow(/Validator/);
  expect(fetch).not.toHaveBeenCalled();
});

test("request cancellation propagates and is not retried", async () => {
  const fetch = vi
    .fn()
    .mockRejectedValue(new DOMException("Timed out", "TimeoutError"));
  vi.stubGlobal("fetch", fetch);
  await expect(
    convexTest(schema, modules).action(api.lib.map, {
      url: "example.com",
      timeout: 10,
    }),
  ).rejects.toThrow(/Timed out/);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test.each([undefined, false, true])(
  "Research usage query preserves omission/false/true: %s",
  async (includeUsage) => {
    const fetch = respond({
      request_id: "id",
      status: "in_progress",
      usage: { credits: 0 },
    });
    const args = {
      requestId: "id",
      ...(includeUsage !== undefined && { includeUsage }),
    };
    const result = await convexTest(schema, modules).action(
      api.lib.getResearch,
      args,
    );
    expect(fetch.mock.calls[0]![0]).toBe(
      `https://api.tavily.com/research/id${includeUsage === undefined ? "" : `?include_usage=${includeUsage}`}`,
    );
    expect(result.usage).toEqual({ credits: 0 });
  },
);
