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

describe("API failures", () => {
  test.each([400, 401, 429, 432, 500])(
    "retains HTTP %s and structured error detail",
    async (status) => {
      respond({ detail: { error: "request rejected" } }, status);
      await expect(
        convexTest(schema, modules).action(api.lib.map, { url: "example.com" }),
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
    respond({ base_url: "example.com", results: [42] });
    await expect(
      convexTest(schema, modules).action(api.lib.map, {
        url: "example.com",
      }),
    ).rejects.toThrow(/invalid map/);
  });
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
