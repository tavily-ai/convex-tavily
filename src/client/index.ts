import type {
  FunctionArgs,
  FunctionReturnType,
  GenericActionCtx,
  GenericDataModel,
} from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

type SearchFunction = ComponentApi["lib"]["search"];
type ExtractFunction = ComponentApi["lib"]["extract"];

// All public types are derived from the component's generated ComponentApi,
// which codegen produces from the validators in src/component/lib.ts — the
// single source of truth. Do not hand-maintain copies of these shapes.

export type SearchArgs = FunctionArgs<SearchFunction>;
export type SearchResponse = FunctionReturnType<SearchFunction>;
export type SearchResult = SearchResponse["results"][number];
export type SearchImage = SearchResponse["images"][number];
export type Usage = NonNullable<SearchResponse["usage"]>;
export type SearchDepth = NonNullable<SearchArgs["searchDepth"]>;
export type SearchTopic = NonNullable<SearchArgs["topic"]>;
export type TimeRange = NonNullable<SearchArgs["timeRange"]>;
export type AnswerMode = NonNullable<SearchArgs["includeAnswer"]>;
export type RawContentMode = NonNullable<SearchArgs["includeRawContent"]>;

export type ExtractArgs = FunctionArgs<ExtractFunction>;
export type ExtractResponse = FunctionReturnType<ExtractFunction>;
export type ExtractResult = ExtractResponse["results"][number];
export type ExtractFailure = ExtractResponse["failedResults"][number];
export type ExtractDepth = NonNullable<ExtractArgs["extractDepth"]>;
export type ExtractFormat = NonNullable<ExtractArgs["format"]>;

export type MapArgs = FunctionArgs<ComponentApi["lib"]["map"]>;
export type MapResponse = FunctionReturnType<ComponentApi["lib"]["map"]>;
export type CrawlArgs = FunctionArgs<ComponentApi["lib"]["crawl"]>;
export type CrawlResponse = FunctionReturnType<ComponentApi["lib"]["crawl"]>;
export type ResearchArgs = FunctionArgs<ComponentApi["lib"]["research"]>;
export type ResearchResponse = FunctionReturnType<
  ComponentApi["lib"]["research"]
>;
export type GetResearchArgs = FunctionArgs<ComponentApi["lib"]["getResearch"]>;
export type ResearchFile = NonNullable<ResearchArgs["files"]>[number];
export type ResearchSource = NonNullable<ResearchResponse["sources"]>[number];

export type ActionCtx = Pick<GenericActionCtx<GenericDataModel>, "runAction">;

/** Server-side client for the Tavily Convex component. */
export class TavilyClient {
  constructor(private readonly component: ComponentApi) {}

  async search(ctx: ActionCtx, args: SearchArgs): Promise<SearchResponse> {
    return await ctx.runAction(this.component.lib.search, args);
  }

  async extract(ctx: ActionCtx, args: ExtractArgs): Promise<ExtractResponse> {
    return await ctx.runAction(this.component.lib.extract, args);
  }

  async map(ctx: ActionCtx, args: MapArgs): Promise<MapResponse> {
    return await ctx.runAction(this.component.lib.map, args);
  }

  async crawl(ctx: ActionCtx, args: CrawlArgs): Promise<CrawlResponse> {
    return await ctx.runAction(this.component.lib.crawl, args);
  }

  /** Submit a Research task; save requestId and call getResearch later. */
  async research(
    ctx: ActionCtx,
    args: ResearchArgs,
  ): Promise<ResearchResponse> {
    return await ctx.runAction(this.component.lib.research, args);
  }

  /** Read status and, when complete, report content and sources. */
  async getResearch(
    ctx: ActionCtx,
    args: GetResearchArgs,
  ): Promise<ResearchResponse> {
    return await ctx.runAction(this.component.lib.getResearch, args);
  }
}
