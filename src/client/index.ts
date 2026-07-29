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
}
