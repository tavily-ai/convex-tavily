import { describe, expect, test, vi } from "vitest";
import { TavilyClient } from "./index.js";
import { components } from "./setup.js";

describe("TavilyClient", () => {
  test("search delegates to the component search action", async () => {
    const client = new TavilyClient(components.tavily);
    const runAction = vi.fn().mockResolvedValue({ results: [], images: [] });

    await client.search({ runAction }, { query: "Convex components" });

    expect(runAction).toHaveBeenCalledWith(components.tavily.lib.search, {
      query: "Convex components",
    });
  });

  test("extract delegates to the component extract action", async () => {
    const client = new TavilyClient(components.tavily);
    const runAction = vi.fn().mockResolvedValue({
      results: [],
      failedResults: [],
    });

    await client.extract(
      { runAction },
      { urls: ["https://docs.convex.dev/components/authoring"] },
    );

    expect(runAction).toHaveBeenCalledWith(components.tavily.lib.extract, {
      urls: ["https://docs.convex.dev/components/authoring"],
    });
  });
});
