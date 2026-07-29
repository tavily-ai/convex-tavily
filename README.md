# convex-tavily

Tavily web search, content extraction, and research for Convex applications.

This package installs Tavily as an isolated Convex component. Application actions call a typed `TavilyClient`, which delegates to component actions and keeps `TAVILY_API_KEY` in typed Convex environment configuration.

## Install

```bash
npm install @tavily/convex-tavily
```

## Configure Convex

Add the component to `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import { v } from "convex/values";
import tavily from "@tavily/convex-tavily/convex.config";

const app = defineApp({
  env: {
    TAVILY_API_KEY: v.string(),
  },
});

app.use(tavily, {
  name: "tavily",
  env: {
    TAVILY_API_KEY: app.env.TAVILY_API_KEY,
  },
});

export default app;
```

Set your key:

```bash
npx convex env set TAVILY_API_KEY tvly-your-key
```

## Search the web

Call the component from an application-owned action. Keeping this wrapper in the app gives you a place to add authentication, authorization, and rate limiting.

```ts
import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { TavilyClient } from "@tavily/convex-tavily";
import { v } from "convex/values";

const tavily = new TavilyClient(components.tavily);

export const searchWeb = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await tavily.search(ctx, {
      query: args.query,
      searchDepth: "advanced",
      maxResults: 5,
      includeAnswer: false,
      includeFavicon: true,
    });
  },
});
```

## Extract known pages

```ts
export const extractPages = action({
  args: {
    urls: v.array(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await tavily.extract(ctx, {
      urls: args.urls,
      query: args.query,
      chunksPerSource: args.query ? 3 : undefined,
      extractDepth: "advanced",
      format: "markdown",
    });
  },
});
```

## Research

Use streaming when you want Tavily's SSE progress events collected into one action result:

```ts
export const researchTopic = action({
  args: { input: v.string() },
  handler: async (ctx, args) => {
    return await tavily.researchStream(ctx, {
      input: args.input,
      model: "mini",
      citationFormat: "numbered",
    });
  },
});
```

Or start a job and poll:

```ts
const job = await tavily.research(ctx, { input, model: "pro" });
let result = await tavily.getResearch(ctx, { requestId: job.requestId });
while (result.status !== "completed" && result.status !== "failed") {
  // wait, then poll again
  result = await tavily.getResearch(ctx, { requestId: job.requestId });
}
```

## Request flow

```text
App client
  -> application Convex action
  -> TavilyClient.search/extract/research/researchStream
  -> ctx.runAction(components.tavily.lib.*)
  -> https://api.tavily.com/search | /extract | /research
```

There are no component HTTP routes. `researchStream` consumes Tavily's SSE stream inside the Convex action and returns progress `events` plus the final report. Use `research` + `getResearch` when you want async polling instead.

## Current API

- `search(ctx, args)` — Search (`basic`/`advanced` depth, `timeRange`, images/favicon/usage knobs).
- `extract(ctx, args)` — Extract up to 20 URLs, including query-focused chunks, images, timeout.
- `research(ctx, args)` — Start a research task; returns `requestId`.
- `getResearch(ctx, { requestId })` — Poll research status/content.
- `researchStream(ctx, args)` — Stream research via SSE; returns `events`, `content`, `sources`.

The component is stateless and owns no database tables.

## Development

```bash
npm install
cd example && npm install && cd ..
npm run build:codegen
npm test
npm run lint
npm run typecheck
```

Component code generation may require a configured Convex development deployment.
