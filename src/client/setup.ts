import { componentsGeneric } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

export const components = componentsGeneric() as unknown as {
  tavily: ComponentApi<"tavily">;
};
