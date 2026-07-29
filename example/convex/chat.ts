import { createThread, listUIMessages, saveMessage } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api.js";
import {
  internalAction,
  mutation,
  query,
} from "./_generated/server.js";
import { researchAgent } from "./agent.js";

/** Start a new chat thread. */
export const createChatThread = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, { title }) => {
    return await createThread(ctx, components.agent, {
      title: title ?? "Tavily chat",
    });
  },
});

/**
 * Save the user message and schedule the agent response.
 * Prefer this over calling an action directly so the UI can optimistically
 * show the user message.
 */
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, { threadId, prompt }) => {
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const generateResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
  },
  handler: async (ctx, { threadId, promptMessageId }) => {
    await researchAgent.generateText(
      ctx,
      { threadId },
      { promptMessageId },
    );
  },
});

/** List UI messages for a thread. */
export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await listUIMessages(ctx, components.agent, args);
  },
});
