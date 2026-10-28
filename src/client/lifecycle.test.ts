/// <reference types="vite/client" />
import { afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import { defineSchema } from "convex/server";
import { TavilyClient } from "./index.js";
import { components } from "./setup.js";
import { register } from "../test.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test("typed client crosses real component registration for Map and Crawl", async () => {
  const t = convexTest(defineSchema({}), import.meta.glob("./_generated/*.ts"));
  register(t);
  const client = new TavilyClient(components.tavily);
  vi.stubEnv("TAVILY_API_KEY", "offline-key");
  const responses = [
    { base_url: "example.com", results: ["https://example.com/page"] },
    {
      base_url: "example.com",
      results: [{ url: "https://example.com/page", raw_content: "page" }],
    },
  ];
  const fetch = vi.fn().mockImplementation(
    async () =>
      new Response(JSON.stringify(responses.shift()), {
        status: 200,
      }),
  );
  vi.stubGlobal("fetch", fetch);
  await t.action(async (ctx) => {
    const mapped = await client.map(ctx, { url: "example.com" });
    expect(mapped.results).toEqual(["https://example.com/page"]);
    const crawled = await client.crawl(ctx, { url: mapped.results[0]! });
    expect(crawled.results[0]?.rawContent).toBe("page");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
