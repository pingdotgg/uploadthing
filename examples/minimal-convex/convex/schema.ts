import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  media: defineTable({
    url: v.string(),
  }),
});
