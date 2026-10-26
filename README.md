# convex-tavily

Tavily Search, Extract, Map, Crawl, and Research for Convex applications.

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

## Discover and crawl a website

Use `map` to discover URLs or `crawl` to discover and extract pages in one action:

```ts
export const crawlDocs = action({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    const mapped = await tavily.map(ctx, {
      url,
      selectPaths: ["/docs/.*"],
      maxDepth: 2,
      limit: 25,
      allowExternal: false,
      includeUsage: true,
    });
    const crawled = await tavily.crawl(ctx, {
      url,
      instructions: "Find installation instructions",
      chunksPerSource: 3,
      maxDepth: 2,
      limit: 10,
      extractDepth: "advanced",
      format: "markdown",
      includeImages: true,
      includeFavicon: true,
      timeout: 120,
    });
    return { mapped, crawled };
  },
});
```

Both actions support `instructions`, `maxDepth` (1–5), `maxBreadth` (1–500),
`limit` (positive integer), `selectPaths`, `selectDomains`, `excludePaths`,
`excludeDomains`, `allowExternal`, `timeout` (10–150 seconds), and `includeUsage`.
Crawl also supports `extractDepth`, `format`, `includeImages`, `includeFavicon`,
and `chunksPerSource` (1–5, requires `instructions`). Omitted options use Tavily's
server defaults; explicit `false` is preserved. Instructions affect mapping credit
cost, and advanced extraction costs more than basic extraction; see
[Tavily pricing](https://docs.tavily.com/documentation/api-credits).

Results use camelCase (`baseUrl`, `rawContent`, `responseTime`, `requestId`) and
preserve content, titles, images, favicon, returned failures and credit usage.

## Submit Research and read the result

Research can outlive an action. Submit once, save the returned `requestId` with
your application record, and call `getResearch` from a later action (or use your
application's scheduler with a bounded retry policy). These actions do not poll
or hold open an SSE stream. Repeating `research` creates a new paid task; use
`getResearch` to check an existing task.

```ts
export const startResearch = action({
  args: { question: v.string() },
  handler: async (ctx, { question }) =>
    tavily.research(ctx, {
      input: question,
      model: "auto", // mini | pro | auto
      includeDomains: ["docs.convex.dev"], // preference, not a hard restriction
      excludeDomains: ["example.com"],
      outputLength: "standard", // short | standard | long (targets, not hard caps)
      citationFormat: "numbered", // numbered | mla | apa | chicago
      outputSchema: {
        properties: { summary: { type: "string", description: "A summary" } },
        required: ["summary"],
      },
      // Optional UTF-8 text attachments, already encoded as base64:
      files: [{ name: "brief.md", data: "SGVsbG8=", type: "base64" }],
    }),
});

export const readResearch = action({
  args: { requestId: v.string(), includeUsage: v.optional(v.boolean()) },
  handler: async (ctx, args) => tavily.getResearch(ctx, args),
});
```

`research` accepts HTTP 201 and returns a task rather than claiming completion.
`getResearch` accepts optional `includeUsage` to request credit metadata; omission uses the server default and explicit `false` is preserved. It returns `pending`, `in_progress`, `completed`, or `failed`. A
completed response includes `content` (report text or a structured object) and
`sources`; sources retain their metadata, including file citations. Responses
also retain returned `createdAt`, `model`, `input`, `responseTime`, `usage`, and
`error`. A failed task is returned as `status: "failed"`; HTTP/transport failures
throw. Authenticate and authorize these application wrappers, including access to
stored task IDs, just as you would the Search wrapper.

Each domain list accepts up to 20 entries. Files accept `.txt`, `.md`, or `.json`,
up to 5 files and 80,000 words combined. Convex also imposes argument/return size
limits, which can be reached before Tavily's word limit; keep attachments and
report sizes within your host's limits. Structured JSON uses Convex-compatible
object field names (ASCII and not starting with `$`); this also applies to
`outputSchema` and report properties. See
[Convex limits](https://docs.convex.dev/production/state/limits) and the
[Research API](https://docs.tavily.com/documentation/api-reference/endpoint/research).
The component intentionally uses asynchronous submission and result reads;
`stream` is not exposed on its JSON action interface.

## Request flow

```text
App client
  -> application Convex action
  -> TavilyClient.search/extract/map/crawl/research/getResearch
  -> ctx.runAction(components.tavily.lib.<action>)
  -> POST https://api.tavily.com/<endpoint> or GET /research/<requestId>
```

## Current API

- `search(ctx, args)` — Search: `searchDepth` (`basic`, `advanced`, `fast`, `ultra-fast`), `chunksPerSource` (1-3; not with `ultra-fast`), `topic`, `maxResults`, `timeRange` / `startDate` / `endDate`, `includePublishedDate` (beta) / `filterByPublishedDate`, `includeDomains` / `excludeDomains` / `includeDomainsMode`, `country`, `language` / `filterByLanguage`, `autoParameters`, `exactMatch`, `safeSearch` (not with `fast`/`ultra-fast`), answer/raw content/images/favicon/usage options. Results keep `publishedDate` (`null` when undetected), per-result `images`, `usage`, `requestId` and `autoParameters`.
- `extract(ctx, args)` — Extract up to 20 URLs, including query-focused chunks, images, timeout.
- `map(ctx, args)` — Discover URLs with traversal, path/domain controls and usage.
- `crawl(ctx, args)` — Discover and extract content with traversal and extraction controls.
- `research(ctx, args)` — Submit a Research task with model, domains, structured output, citation format and files.
- `getResearch(ctx, { requestId, includeUsage })` — Read status and the complete report/sources when ready.

Requests are sent with `X-Client-Name: convex-tavily` and `X-Client-Source: api`.

The component is stateless and owns no database tables.

The included agent example registers all six tool operations, including separate
`startResearch` and `readResearch` tools. Its instructions preserve pending task
IDs and stop repeated polling within a model turn. Search/Extract examples keep
small result budgets for the demo; application code can use the full client API.

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
