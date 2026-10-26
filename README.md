# convex-tavily

Tavily web search and content extraction for Convex applications.

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

## Request flow

```text
App client
  -> application Convex action
  -> TavilyClient.search/extract
  -> ctx.runAction(components.tavily.lib.search/extract)
  -> POST https://api.tavily.com/search or /extract
```

## Current API

- `search(ctx, args)` — Search: `searchDepth` (`basic`, `advanced`, `fast`, `ultra-fast`), `chunksPerSource` (1-3; not with `ultra-fast`), `topic`, `maxResults`, `timeRange` / `startDate` / `endDate`, `includePublishedDate` (beta) / `filterByPublishedDate`, `includeDomains` / `excludeDomains` / `includeDomainsMode`, `country`, `language` / `filterByLanguage`, `autoParameters`, `exactMatch`, `safeSearch` (not with `fast`/`ultra-fast`), answer/raw content/images/favicon/usage options. Results keep `publishedDate` (`null` when undetected), per-result `images`, `usage`, `requestId` and `autoParameters`.
- `extract(ctx, args)` — Extract up to 20 URLs, including query-focused chunks, images, timeout.

Requests are sent with `X-Client-Name: convex-tavily` and `X-Client-Source: api`.

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
