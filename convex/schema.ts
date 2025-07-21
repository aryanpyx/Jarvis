import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  conversations: defineTable({
    userId: v.id("users"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      language: v.optional(v.string()),
    })),
    title: v.string(),
    language: v.string(),
  }).index("by_user", ["userId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    preferredLanguage: v.string(),
    voiceEnabled: v.boolean(),
    autoSpeak: v.optional(v.boolean()),
    theme: v.string(),
    personality: v.string(),
  }).index("by_user", ["userId"]),

  systemCommands: defineTable({
    userId: v.id("users"),
    command: v.string(),
    description: v.string(),
    category: v.string(),
    enabled: v.boolean(),
  }).index("by_user_category", ["userId", "category"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
