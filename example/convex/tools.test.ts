/// <reference types="vite/client" />
import { afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import { defineSchema } from "convex/server";
import { z } from "zod";
import { researchAgent } from "./agent.js";
import { register } from "../../src/test.js";
import { webSearch, extractPages, mapWebsite, crawlWebsite } from "./tools.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test("main Search and Extract model inputs retain their bounds and omission behavior", () => {
  const search = webSearch.inputSchema;
  const extract = extractPages.inputSchema;
  if (!(search instanceof z.ZodObject) || !(extract instanceof z.ZodObject)) {
    throw new Error("Expected model-facing Zod object schemas");
  }
  expect(Object.keys(search.shape)).toEqual(["query", "maxResults"]);
  expect(search.parse({ query: "docs" })).toEqual({ query: "docs" });
  expect(search.safeParse({ query: "docs", maxResults: 0 }).success).toBe(
    false,
  );
  expect(search.safeParse({ query: "docs", maxResults: 11 }).success).toBe(
    false,
  );
  expect(Object.keys(extract.shape)).toEqual(["urls", "query"]);
  expect(extract.parse({ urls: ["https://example.com"] })).toEqual({
    urls: ["https://example.com"],
  });
  expect(extract.safeParse({ urls: [] }).success).toBe(false);
  expect(
    extract.safeParse({ urls: Array(6).fill("https://example.com") }).success,
  ).toBe(false);
});

test("discovery models choose a target and focus while application code owns traversal budgets", async () => {
  const t = convexTest(defineSchema({}), import.meta.glob("./_generated/*.js"));
  register(t);
  vi.stubEnv("TAVILY_API_KEY", "offline-demo-fixture");
  const calls: Array<{ url: string; body: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return new Response(
        JSON.stringify({ base_url: "example.com", results: [] }),
      );
    }),
  );
  await t.action(async (ctx) => {
    const options = { toolCallId: "tool-1", messages: [] };
    const parseInputs = (schema: unknown) => {
      if (!(schema instanceof z.ZodObject))
        throw new Error("Expected model schema");
      expect(Object.keys(schema.shape)).toEqual(["url", "instructions"]);
      const args = schema.parse({
        url: "example.com",
        instructions: "installation docs",
        limit: 500,
        maxDepth: 5,
        allowExternal: true,
      });
      expect(args).toEqual({
        url: "example.com",
        instructions: "installation docs",
      });
      return args;
    };
    await mapWebsite.execute!.call(
      { ...mapWebsite, ctx },
      parseInputs(mapWebsite.inputSchema),
      options,
    );
    await crawlWebsite.execute!.call(
      { ...crawlWebsite, ctx },
      parseInputs(crawlWebsite.inputSchema),
      options,
    );
  });
  expect(calls).toEqual([
    {
      url: "https://api.tavily.com/map",
      body: {
        url: "example.com",
        instructions: "installation docs",
        max_depth: 1,
        limit: 10,
        allow_external: false,
      },
    },
    {
      url: "https://api.tavily.com/crawl",
      body: {
        url: "example.com",
        instructions: "installation docs",
        max_depth: 1,
        limit: 3,
        allow_external: false,
      },
    },
  ]);
});

test("demo agent registers the four supported endpoint tools", () => {
  expect(Object.keys(researchAgent.options.tools ?? {}).sort()).toEqual([
    "crawlWebsite",
    "extractPages",
    "mapWebsite",
    "webSearch",
  ]);
});
