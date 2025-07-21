import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";
import { api } from "./_generated/api";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

// Get user preferences
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return preferences || {
      preferredLanguage: "en",
      voiceEnabled: true,
      autoSpeak: true,
      theme: "dark",
      personality: "professional",
    };
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    preferredLanguage: v.string(),
    voiceEnabled: v.boolean(),
    autoSpeak: v.optional(v.boolean()),
    theme: v.string(),
    personality: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        ...args,
      });
    }
  },
});

// Get conversations
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

// Get specific conversation
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) return null;

    return conversation;
  },
});

// Create new conversation
export const createConversation = mutation({
  args: {
    title: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("conversations", {
      userId,
      messages: [],
      title: args.title,
      language: args.language,
    });
  },
});

// Add message to conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    const newMessage = {
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      language: args.language,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, newMessage],
    });
  },
});

// Generate AI response
export const generateResponse = action({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Add user message first
    await ctx.runMutation(api.jarvis.addMessage, {
      conversationId: args.conversationId,
      role: "user",
      content: args.userMessage,
      language: args.language,
    });

    // Get conversation history
    const conversation: any = await ctx.runQuery(api.jarvis.getConversation, {
      conversationId: args.conversationId,
    });

    if (!conversation) throw new Error("Conversation not found");

    // Prepare system prompt based on language
    const systemPrompts = {
      en: `You are JARVIS, an advanced AI assistant inspired by the AI from Iron Man movies. You are helpful, professional, witty, and engaging. You can:
- Answer questions on any topic with vast knowledge
- Help with computer tasks and automation
- Provide real-time information
- Maintain context throughout conversations
- Adapt your communication style to user preferences

Always be respectful, intelligent, and ready to assist. Add a touch of wit when appropriate, similar to the movie character. Keep responses concise but informative.`,
      
      hi: `आप जार्विस हैं, आयरन मैन फिल्मों के AI से प्रेरित एक उन्नत AI सहायक। आप सहायक, पेशेवर, बुद्धिमान और आकर्षक हैं। आप कर सकते हैं:
- किसी भी विषय पर व्यापक ज्ञान के साथ प्रश्नों का उत्तर देना
- कंप्यूटर कार्यों और स्वचालन में सहायता करना
- वास्तविक समय की जानकारी प्रदान करना
- बातचीत के दौरान संदर्भ बनाए रखना
- उपयोगकर्ता की प्राथमिकताओं के अनुसार अपनी संचार शैली को अनुकूलित करना

हमेशा सम्मानजनक, बुद्धिमान और सहायता के लिए तैयार रहें। जब उपयुक्त हो तो फिल्म के चरित्र की तरह थोड़ी बुद्धि जोड़ें। उत्तर संक्षिप्त लेकिन जानकारीपूर्ण रखें।`
    };

    // Prepare messages for OpenAI
    const messages: Array<{role: "system" | "user" | "assistant", content: string}> = [
      {
        role: "system" as const,
        content: systemPrompts[args.language as keyof typeof systemPrompts] || systemPrompts.en,
      },
      ...conversation.messages.slice(-10).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    try {
      const response: any = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage: string | null = response.choices[0].message.content;
      if (!assistantMessage) throw new Error("No response generated");

      // Add assistant response
      await ctx.runMutation(api.jarvis.addMessage, {
        conversationId: args.conversationId,
        role: "assistant",
        content: assistantMessage,
        language: args.language,
      });

      return assistantMessage;
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate response");
    }
  },
});

// Get system commands
export const getSystemCommands = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("systemCommands")
      .withIndex("by_user_category", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Initialize default system commands
export const initializeSystemCommands = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const defaultCommands = [
      {
        command: "open file manager",
        description: "Opens the system file manager",
        category: "system",
        enabled: true,
      },
      {
        command: "check weather",
        description: "Get current weather information",
        category: "information",
        enabled: true,
      },
      {
        command: "set reminder",
        description: "Set a reminder for later",
        category: "productivity",
        enabled: true,
      },
      {
        command: "play music",
        description: "Play music from default music app",
        category: "entertainment",
        enabled: true,
      },
      {
        command: "search web",
        description: "Search the internet for information",
        category: "information",
        enabled: true,
      },
    ];

    for (const cmd of defaultCommands) {
      await ctx.db.insert("systemCommands", {
        userId,
        ...cmd,
      });
    }
  },
});
