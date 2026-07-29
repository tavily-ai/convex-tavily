import { defineComponent } from "convex/server";
import { v } from "convex/values";

export default defineComponent("tavily", {
  env: {
    TAVILY_API_KEY: v.string(),
  },
});
