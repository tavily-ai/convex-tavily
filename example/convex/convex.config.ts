import { defineApp } from "convex/server";
import { v } from "convex/values";
import agent from "@convex-dev/agent/convex.config";
import tavily from "@tavily/convex-tavily/convex.config";

const app = defineApp({
  env: {
    TAVILY_API_KEY: v.string(),
  },
});

app.use(agent);

// Local `file:..` install loads a second copy of the `convex` package types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(tavily as any, {
  name: "tavily",
  env: {
    TAVILY_API_KEY: app.env.TAVILY_API_KEY,
  },
});

export default app;
