/// <reference types="vite/client" />
import { afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import { defineSchema } from "convex/server";
import { z } from "zod";
import { researchAgent } from "./agent.js";
import { register } from "../../src/test.js";
import {
  mapWebsite,
  crawlWebsite,
  startResearch,
  readResearch,
} from "./tools.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test("demo tool schemas expose new controls and execute through the component", async () => {
  const t = convexTest(defineSchema({}), import.meta.glob("./_generated/*.js"));
  register(t);
  vi.stubEnv("TAVILY_API_KEY", "offline-demo-fixture");
  const calls: Array<{ url: string; body: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({
        url,
        body: init.body ? JSON.parse(init.body as string) : undefined,
      });
      const body = url.endsWith("/research")
        ? { request_id: "id", status: "pending" }
        : url.endsWith("/research/id")
          ? {
              request_id: "id",
              status: "completed",
              content: "Report [1]",
              sources: [{ url: "https://example.com" }],
            }
          : { base_url: "example.com", results: [] };
      return new Response(JSON.stringify(body), {
        status: url.endsWith("/research") ? 201 : 200,
      });
    }),
  );
  await t.action(async (ctx) => {
    const options = { toolCallId: "tool-1", messages: [] };
    const mapped = (mapWebsite.inputSchema as z.ZodType).parse({
      url: "example.com",
      allowExternal: false,
      limit: 1,
    });
    await mapWebsite.execute!.call({ ...mapWebsite, ctx }, mapped, options);
    const crawled = (crawlWebsite.inputSchema as z.ZodType).parse({
      url: "example.com",
      instructions: "docs",
      chunksPerSource: 5,
      includeImages: false,
    });
    await crawlWebsite.execute!.call(
      { ...crawlWebsite, ctx },
      crawled,
      options,
    );
    const research = (startResearch.inputSchema as z.ZodType).parse({
      input: "q",
      model: "pro",
      citationFormat: "chicago",
      files: [{ name: "a.md", data: "YQ==" }],
    });
    const task = await startResearch.execute!.call(
      { ...startResearch, ctx },
      research,
      options,
    );
    expect(task).toMatchObject({ requestId: "id", status: "pending" });
    const result = await readResearch.execute!.call(
      { ...readResearch, ctx },
      { requestId: "id" },
      options,
    );
    expect(result).toMatchObject({
      status: "completed",
      content: "Report [1]",
      sources: [{ url: "https://example.com" }],
    });
  });
  expect(calls).toHaveLength(4);
  expect(calls[0]!.body).toEqual({
    url: "example.com",
    allow_external: false,
    limit: 1,
  });
  expect(calls[1]!.body).toMatchObject({
    chunks_per_source: 5,
    include_images: false,
  });
  expect(calls[2]!.body).toMatchObject({
    model: "pro",
    citation_format: "chicago",
    stream: false,
    files: [{ name: "a.md", data: "YQ==" }],
  });
  expect(calls[3]!.url).toBe("https://api.tavily.com/research/id");
});

test("demo agent registers discovery and Research lifecycle tools", () => {
  expect(Object.keys(researchAgent.options.tools ?? {}).sort()).toEqual([
    "crawlWebsite",
    "extractPages",
    "mapWebsite",
    "readResearch",
    "startResearch",
    "webSearch",
  ]);
});
