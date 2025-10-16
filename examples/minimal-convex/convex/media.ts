import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("media", args);
  },
});
