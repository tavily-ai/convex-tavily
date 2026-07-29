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
