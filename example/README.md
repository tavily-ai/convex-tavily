# Tavily × Convex chat example

Live demo app that installs `@tavily/convex-tavily` as a Convex component and exposes it as Agent tools (`webSearch`, `extractPages`).

## Prerequisites

- Node 20+
- [Convex](https://convex.dev) account
- `TAVILY_API_KEY` from [tavily.com](https://tavily.com)
- `OPENAI_API_KEY` for the demo LLM (`gpt-4o-mini`)

## Run

From the **repo root** (builds the component package and runs Convex):

```bash
npm install
cd example && npm install && cd ..
npm run build:codegen
npm run dev
```

In another terminal, start the UI:

```bash
cd example
npm run dev
```

Open http://localhost:5173

### Env vars (Convex deployment)

```bash
cd example
npx convex env set TAVILY_API_KEY tvly-...
npx convex env set OPENAI_API_KEY sk-...
```

`npx convex dev` writes `CONVEX_URL` into `example/.env.local` for the Vite app.

## What to try

Ask something time-sensitive, e.g. “What shipped recently in Convex components?” — the agent should call `webSearch`, then answer with citations. Follow up with a URL to trigger `extractPages`.

## Layout

| Path | Role |
|---|---|
| `convex/tavily.ts` | shared `TavilyClient` helpers (`searchWeb` / `extractPages` / `researchTopic`) |
| `convex/tools.ts` | Agent tools wrapping those helpers |
| `convex/agent.ts` | `@convex-dev/agent` + OpenAI |
| `convex/chat.ts` | threads / send / list messages |
| `convex/example.ts` | public actions wrapping the same helpers |
| `src/` | React chat UI |
