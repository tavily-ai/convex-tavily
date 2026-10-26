import { expectTypeOf, test } from "vitest";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";
import type { api } from "../component/_generated/api.js";

test("exported component types match the actual action validators", () => {
  type Actions = typeof api.lib;
  type Generated = ComponentApi["lib"];
  type Args<T extends keyof Generated & keyof Actions> = FunctionArgs<
    Generated[T]
  >;
  type ActualArgs<T extends keyof Generated & keyof Actions> = FunctionArgs<
    Actions[T]
  >;
  type Returns<T extends keyof Generated & keyof Actions> = FunctionReturnType<
    Generated[T]
  >;
  type ActualReturns<T extends keyof Generated & keyof Actions> =
    FunctionReturnType<Actions[T]>;
  expectTypeOf<Args<"map">>().toEqualTypeOf<ActualArgs<"map">>();
  expectTypeOf<Returns<"map">>().toExtend<ActualReturns<"map">>();
  expectTypeOf<ActualReturns<"map">>().toExtend<Returns<"map">>();
  expectTypeOf<Args<"crawl">>().toEqualTypeOf<ActualArgs<"crawl">>();
  expectTypeOf<Returns<"crawl">>().toExtend<ActualReturns<"crawl">>();
  expectTypeOf<ActualReturns<"crawl">>().toExtend<Returns<"crawl">>();
  expectTypeOf<Args<"research">>().toEqualTypeOf<ActualArgs<"research">>();
  expectTypeOf<Returns<"research">>().toEqualTypeOf<
    ActualReturns<"research">
  >();
  expectTypeOf<Args<"getResearch">>().toEqualTypeOf<
    ActualArgs<"getResearch">
  >();
  expectTypeOf<Returns<"getResearch">>().toEqualTypeOf<
    ActualReturns<"getResearch">
  >();
  expectTypeOf<Args<"search">>().toEqualTypeOf<ActualArgs<"search">>();
  expectTypeOf<Returns<"search">>().toExtend<ActualReturns<"search">>();
  expectTypeOf<ActualReturns<"search">>().toExtend<Returns<"search">>();
  expectTypeOf<Args<"extract">>().toEqualTypeOf<ActualArgs<"extract">>();
  expectTypeOf<Returns<"extract">>().toExtend<ActualReturns<"extract">>();
  expectTypeOf<ActualReturns<"extract">>().toExtend<Returns<"extract">>();
});
