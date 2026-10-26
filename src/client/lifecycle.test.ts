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

test("typed client crosses real component registration for discovery and Research lifecycle", async () => {
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
    { request_id: "task", status: "pending" },
    { request_id: "task", status: "in_progress" },
    {
      request_id: "task",
      status: "completed",
      content: "Report [1]",
      sources: [{ title: "page", url: "https://example.com/page" }],
    },
  ];
  const fetch = vi.fn().mockImplementation(
    async () =>
      new Response(JSON.stringify(responses.shift()), {
        status: responses.length === 2 ? 201 : 200,
      }),
  );
  vi.stubGlobal("fetch", fetch);
  await t.action(async (ctx) => {
    const mapped = await client.map(ctx, { url: "example.com" });
    expect(mapped.results).toEqual(["https://example.com/page"]);
    const crawled = await client.crawl(ctx, { url: mapped.results[0]! });
    expect(crawled.results[0]?.rawContent).toBe("page");
    const created = await client.research(ctx, {
      input: "Compare this page",
      model: "mini",
    });
    expect(created.status).toBe("pending");
    expect(fetch).toHaveBeenCalledTimes(3);
    const pending = await client.getResearch(ctx, {
      requestId: created.requestId,
    });
    expect(pending.status).toBe("in_progress");
    expect(pending.content).toBeUndefined();
    const completed = await client.getResearch(ctx, {
      requestId: created.requestId,
    });
    expect(completed.content).toBe("Report [1]");
    expect(completed.sources).toEqual([
      { title: "page", url: "https://example.com/page" },
    ]);
    expect(fetch).toHaveBeenCalledTimes(5);
  });
});
