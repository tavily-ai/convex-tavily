import { describe, expect, test } from "vitest";
import { _test } from "./lib.js";

describe("Tavily component", () => {
  test("maps camelCase search options to Tavily's REST payload", () => {
    expect(
      _test.buildSearchBody({
        query: "latest Convex releases",
        searchDepth: "advanced",
        maxResults: 8,
        includeRawContent: "markdown",
        includeUsage: true,
        timeRange: "week",
        includeImages: true,
        includeFavicon: true,
      }),
    ).toEqual({
      query: "latest Convex releases",
      search_depth: "advanced",
      max_results: 8,
      include_raw_content: "markdown",
      include_usage: true,
      time_range: "week",
      include_images: true,
      include_favicon: true,
    });
  });

  test("maps and normalizes a search response", () => {
    expect(
      _test.normalizeSearchResponse(
        {
          answer: "Convex released component environment variables.",
          images: ["https://example.com/image.png"],
          results: [
            {
              title: "Authoring Components",
              url: "https://docs.convex.dev/components/authoring",
              content: "Components package backend functions and state.",
              score: 0.98,
              raw_content: "Full content",
            },
          ],
          response_time: 0.42,
          request_id: "request-123",
          usage: { credits: 2 },
        },
        "Convex components",
      ),
    ).toEqual({
      query: "Convex components",
      answer: "Convex released component environment variables.",
      images: [{ url: "https://example.com/image.png" }],
      results: [
        {
          title: "Authoring Components",
          url: "https://docs.convex.dev/components/authoring",
          content: "Components package backend functions and state.",
          score: 0.98,
          rawContent: "Full content",
        },
      ],
      responseTime: 0.42,
      requestId: "request-123",
      usage: { credits: 2 },
    });
  });

  test("requires a query when extracting ranked chunks", () => {
    expect(() =>
      _test.validateExtractArgs({
        urls: ["https://example.com"],
        chunksPerSource: 3,
      }),
    ).toThrow(/requires query/);
  });

  test("builds research bodies for poll and stream modes", () => {
    expect(
      _test.buildResearchBody(
        {
          input: "Convex components landscape",
          model: "mini",
          citationFormat: "numbered",
        },
        false,
      ),
    ).toEqual({
      input: "Convex components landscape",
      model: "mini",
      stream: false,
      citation_format: "numbered",
    });

    expect(
      _test.buildResearchBody(
        { input: "Convex components landscape", model: "pro" },
        true,
      ),
    ).toEqual({
      input: "Convex components landscape",
      model: "pro",
      stream: true,
    });
  });

  test("normalizes research stream content and tool events", () => {
    expect(
      _test.normalizeStreamEvent({
        id: "evt_1",
        object: "chat.completion.chunk",
        model: "mini",
        choices: [{ delta: { role: "assistant", content: "# Report\n" } }],
      }),
    ).toEqual({ type: "content", content: "# Report\n" });

    expect(
      _test.normalizeStreamEvent({
        object: "chat.completion.chunk",
        choices: [
          {
            delta: {
              tool_calls: {
                type: "tool_call",
                tool_call: [
                  {
                    name: "WebSearch",
                    id: "fc_1",
                    arguments: "Executing searches",
                    queries: ["convex components"],
                  },
                ],
              },
            },
          },
        ],
      }),
    ).toEqual({
      type: "tool_call",
      name: "WebSearch",
      id: "fc_1",
      arguments: "Executing searches",
      queries: ["convex components"],
    });
  });

  test("uses bearer authentication without putting the key in the body", () => {
    expect(_test.buildHeaders("tvly-secret")).toEqual({
      Authorization: "Bearer tvly-secret",
      "Content-Type": "application/json",
      "X-Client-Source": "convex-tavily",
    });
  });
});
