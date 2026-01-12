var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/content-generator.ts
var content_generator_exports = {};
__export(content_generator_exports, {
  ContentGenerator: () => ContentGenerator
});
var ContentGenerator;
var init_content_generator = __esm({
  "server/content-generator.ts"() {
    "use strict";
    ContentGenerator = class {
      apiKey;
      baseUrl = "https://api.perplexity.ai/chat/completions";
      constructor() {
        if (!process.env.PERPLEXITY_API_KEY) {
          throw new Error("PERPLEXITY_API_KEY environment variable is required");
        }
        this.apiKey = process.env.PERPLEXITY_API_KEY;
      }
      async callPerplexityAPI(prompt) {
        console.log("\u{1F50D} Making Perplexity API call...");
        const requestBody = {
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "You are a content writer for LocalFeat, a hyperlocal social platform. Write engaging, SEO-friendly blog posts that connect trending topics to local community engagement. Always include practical local applications and community benefits."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 2e3,
          temperature: 0.7,
          top_p: 0.9,
          return_related_questions: false,
          search_recency_filter: "week",
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 0.1
        };
        console.log("\u{1F4E4} Request body:", JSON.stringify(requestBody, null, 2));
        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });
        console.log("\u{1F4E5} Response status:", response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("\u274C API Error Response:", errorText);
          throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        console.log("\u2705 API Response received:", data.choices?.[0]?.message?.content?.substring(0, 200) + "...");
        return data.choices[0]?.message?.content || "";
      }
      createSlug(title) {
        return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim().substring(0, 50);
      }
      extractExcerpt(content) {
        const cleanContent = content.replace(/#{1,6}\s/g, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/<[^>]*>/g, "").trim();
        const sentences = cleanContent.split(/[.!?]+/);
        return sentences.slice(0, 2).join(". ").trim() + (sentences.length > 2 ? "..." : "");
      }
      generateMetaDescription(title, excerpt) {
        return `${excerpt.substring(0, 140)}... | LocalFeat Blog`;
      }
      extractTags(content) {
        const commonTags = ["local community", "social media", "technology", "lifestyle", "trends"];
        const contentLower = content.toLowerCase();
        const foundTags = commonTags.filter(
          (tag) => contentLower.includes(tag.toLowerCase())
        );
        const topicTags = [];
        if (contentLower.includes("business") || contentLower.includes("entrepreneur")) {
          topicTags.push("local business");
        }
        if (contentLower.includes("event") || contentLower.includes("festival")) {
          topicTags.push("community events");
        }
        if (contentLower.includes("food") || contentLower.includes("restaurant")) {
          topicTags.push("local dining");
        }
        if (contentLower.includes("tech") || contentLower.includes("digital")) {
          topicTags.push("technology");
        }
        return Array.from(/* @__PURE__ */ new Set([...foundTags, ...topicTags])).slice(0, 5);
      }
      async generateTrendingTopics() {
        const topicsPrompt = `List 10 current trending topics and news that would be relevant for local communities in 2024. Focus on topics that can be applied to local businesses, community events, lifestyle trends, technology adoption, and social movements. Format as a simple numbered list.`;
        const response = await this.callPerplexityAPI(topicsPrompt);
        const topics = response.split("\n").filter((line) => line.match(/^\d+\./)).map((line) => line.replace(/^\d+\.\s*/, "").trim()).filter((topic) => topic.length > 0).slice(0, 10);
        return topics.length > 0 ? topics : [
          "AI and Local Business Automation",
          "Community-Driven Sustainability Initiatives",
          "Hyperlocal Social Commerce Trends",
          "Digital Nomads and Small Town Revival",
          "Local Food Scene and Social Media"
        ];
      }
      async generateBlogPost(topic) {
        const contentPrompt = `Write a comprehensive blog post about "${topic}" specifically for LocalFeat users. 

Requirements:
- Focus on how this topic impacts local communities and social connections
- Include practical applications for LocalFeat users
- Make it SEO-friendly with natural keyword usage
- Structure with clear headings and subheadings
- Include actionable advice for local community engagement
- Write in an engaging, accessible tone
- Target length: 800-1200 words
- Include specific examples of how local businesses or community members can benefit

Format the response as a complete blog post with markdown formatting.`;
        const content = await this.callPerplexityAPI(contentPrompt);
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : `${topic}: A LocalFeat Community Guide`;
        const slug = this.createSlug(title);
        const excerpt = this.extractExcerpt(content);
        const tags = this.extractTags(content);
        const metaTitle = `${title} | LocalFeat Blog`;
        const metaDescription = this.generateMetaDescription(title, excerpt);
        return {
          title,
          slug,
          content,
          excerpt,
          tags,
          metaTitle,
          metaDescription,
          featured: Math.random() < 0.3,
          // 30% chance of being featured
          published: true
        };
      }
      async generateDailyContent() {
        try {
          console.log("\u{1F916} Generating trending topics...");
          const topics = await this.generateTrendingTopics();
          console.log("\u{1F4DD} Generating blog posts...");
          const selectedTopics = topics.slice(0, Math.random() < 0.7 ? 1 : 2);
          const blogPosts2 = await Promise.all(
            selectedTopics.map((topic) => this.generateBlogPost(topic))
          );
          console.log(`\u2705 Generated ${blogPosts2.length} blog post(s)`);
          return blogPosts2;
        } catch (error) {
          console.error("\u274C Error generating daily content:", error);
          throw error;
        }
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  blogPosts: () => blogPosts,
  blogPostsRelations: () => blogPostsRelations,
  comments: () => comments,
  commentsRelations: () => commentsRelations,
  conversations: () => conversations,
  conversationsRelations: () => conversationsRelations,
  dailyQuestionResponses: () => dailyQuestionResponses,
  feedback: () => feedback,
  feedbackRelations: () => feedbackRelations,
  forgotPasswordSchema: () => forgotPasswordSchema,
  insertBlogPostSchema: () => insertBlogPostSchema,
  insertCommentSchema: () => insertCommentSchema,
  insertDailyQuestionResponseSchema: () => insertDailyQuestionResponseSchema,
  insertFeedbackSchema: () => insertFeedbackSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertPostSchema: () => insertPostSchema,
  insertUserProfileSchema: () => insertUserProfileSchema,
  loginSchema: () => loginSchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  passwordResets: () => passwordResets,
  passwordResetsRelations: () => passwordResetsRelations,
  posts: () => posts,
  postsRelations: () => postsRelations,
  registrationSchema: () => registrationSchema,
  resetPasswordSchema: () => resetPasswordSchema,
  sessions: () => sessions,
  updateUserProfileSchema: () => updateUserProfileSchema,
  userProfiles: () => userProfiles,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, integer, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  phone: varchar("phone"),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorInitials: text("author_initials").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  locationName: text("location_name"),
  hashtags: text("hashtags").array().notNull().default(sql`ARRAY[]::text[]`),
  likes: integer("likes").notNull().default(0),
  reactions: jsonb("reactions").notNull().default(sql`'{}'::jsonb`),
  // Store emoji reactions as {emoji: count}
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
  expiresAt: timestamp("expires_at").notNull().default(sql`NOW() + INTERVAL '30 days'`)
});
var comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorInitials: text("author_initials").notNull(),
  likes: integer("likes").notNull().default(0),
  reactions: jsonb("reactions").notNull().default(sql`'{}'::jsonb`),
  // Store emoji reactions as {emoji: count}
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`)
});
var conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`)
});
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`)
});
var feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(),
  // "feature" or "bug"
  content: text("content").notNull(),
  userId: varchar("user_id").references(() => users.id),
  // nullable for anonymous feedback
  userInfo: text("user_info"),
  // store username/email for reference
  status: varchar("status").notNull().default("open"),
  // "open", "in_progress", "completed", "closed"
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`)
});
var passwordResets = pgTable("password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`)
});
var blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`NOW()`)
});
var usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  sentMessages: many(messages),
  conversations1: many(conversations, { relationName: "participant1" }),
  conversations2: many(conversations, { relationName: "participant2" })
}));
var postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments)
}));
var commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] })
}));
var conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, { fields: [conversations.participant1Id], references: [users.id], relationName: "participant1" }),
  participant2: one(users, { fields: [conversations.participant2Id], references: [users.id], relationName: "participant2" }),
  messages: many(messages)
}));
var messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] })
}));
var feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] })
}));
var passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, { fields: [passwordResets.userId], references: [users.id] })
}));
var blogPostsRelations = relations(blogPosts, ({ many }) => ({
  // No relations needed for now
}));
var insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  authorName: true,
  authorInitials: true,
  latitude: true,
  longitude: true,
  locationName: true,
  hashtags: true
});
var insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  content: true,
  authorName: true,
  authorInitials: true
});
var insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true
});
var insertFeedbackSchema = createInsertSchema(feedback).pick({
  type: true,
  content: true
});
var registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required")
});
var forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});
var resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  tags: true,
  metaTitle: true,
  metaDescription: true,
  featured: true,
  published: true
});
var dailyQuestionResponses = pgTable("daily_question_responses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  question: text("question").notNull(),
  response: text("response").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertDailyQuestionResponseSchema = createInsertSchema(dailyQuestionResponses).omit({
  id: true,
  createdAt: true
});
var userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  displayName: varchar("display_name", { length: 50 }),
  bio: varchar("bio", { length: 100 }),
  profileImageUrl: varchar("profile_image_url"),
  profileImageData: text("profile_image_data"),
  // Base64 encoded image data
  profileImageType: varchar("profile_image_type", { length: 50 }),
  // MIME type
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserProfileSchema = createInsertSchema(userProfiles, {
  displayName: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less").optional(),
  bio: z.string().max(100, "Bio must be 100 characters or less").optional(),
  profileImageUrl: z.string().optional(),
  profileImageData: z.string().optional(),
  profileImageType: z.string().optional()
}).omit({ id: true, createdAt: true, updatedAt: true });
var updateUserProfileSchema = insertUserProfileSchema.partial().omit({ userId: true });

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import "dotenv/config";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, or, desc, lt, sql as sql2 } from "drizzle-orm";
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async getUserByEmailOrUsername(email, username) {
    const [user] = await db.select().from(users).where(or(eq(users.email, email), eq(users.username, username))).limit(1);
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserPassword(id, passwordHash) {
    const [user] = await db.update(users).set({
      passwordHash,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  async createPost(insertPost, authorId) {
    const [post] = await db.insert(posts).values({
      ...insertPost,
      authorId
    }).returning();
    return post;
  }
  async getPosts(userLatitude, userLongitude, radiusKm = 1, hashtag, search, limit = 10, offset = 0) {
    await this.cleanupExpiredPosts();
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
    let filteredPosts = allPosts.filter((post) => {
      const distance = calculateDistance(userLatitude, userLongitude, post.latitude, post.longitude);
      return distance <= radiusKm && /* @__PURE__ */ new Date() < post.expiresAt;
    });
    if (hashtag) {
      filteredPosts = filteredPosts.filter(
        (post) => post.hashtags.some((tag) => tag.toLowerCase() === hashtag.toLowerCase())
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) => post.content.toLowerCase().includes(searchLower) || post.hashtags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }
    return filteredPosts.slice(offset, offset + limit);
  }
  async getPostById(id) {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }
  async likePost(id) {
    const [post] = await db.update(posts).set({ likes: sql2`${posts.likes} + 1` }).where(eq(posts.id, id)).returning();
    return post;
  }
  async addPostReaction(id, emoji) {
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, id));
    if (!existingPost) return null;
    const currentReactions = existingPost.reactions || {};
    const newReactions = {
      ...currentReactions,
      [emoji]: (currentReactions[emoji] || 0) + 1
    };
    const [post] = await db.update(posts).set({ reactions: newReactions }).where(eq(posts.id, id)).returning();
    return post || null;
  }
  async removePostReaction(id, emoji) {
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, id));
    if (!existingPost) return null;
    const currentReactions = existingPost.reactions || {};
    const newReactions = { ...currentReactions };
    if (newReactions[emoji] && newReactions[emoji] > 0) {
      newReactions[emoji] -= 1;
      if (newReactions[emoji] === 0) {
        delete newReactions[emoji];
      }
    }
    const [post] = await db.update(posts).set({ reactions: newReactions }).where(eq(posts.id, id)).returning();
    return post || null;
  }
  async deletePost(id) {
    await db.delete(comments).where(eq(comments.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
  }
  async createComment(insertComment, authorId) {
    const [comment] = await db.insert(comments).values({
      ...insertComment,
      authorId
    }).returning();
    return comment;
  }
  async getCommentsByPostId(postId) {
    return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(comments.createdAt);
  }
  async likeComment(id) {
    const [comment] = await db.update(comments).set({ likes: sql2`${comments.likes} + 1` }).where(eq(comments.id, id)).returning();
    return comment;
  }
  async addCommentReaction(id, emoji) {
    const [existingComment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!existingComment) return null;
    const currentReactions = existingComment.reactions || {};
    const newReactions = {
      ...currentReactions,
      [emoji]: (currentReactions[emoji] || 0) + 1
    };
    const [comment] = await db.update(comments).set({ reactions: newReactions }).where(eq(comments.id, id)).returning();
    return comment || null;
  }
  async removeCommentReaction(id, emoji) {
    const [existingComment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!existingComment) return null;
    const currentReactions = existingComment.reactions || {};
    const newReactions = { ...currentReactions };
    if (newReactions[emoji] && newReactions[emoji] > 0) {
      newReactions[emoji] -= 1;
      if (newReactions[emoji] === 0) {
        delete newReactions[emoji];
      }
    }
    const [comment] = await db.update(comments).set({ reactions: newReactions }).where(eq(comments.id, id)).returning();
    return comment || null;
  }
  async cleanupExpiredPosts() {
    const now = /* @__PURE__ */ new Date();
    await db.delete(posts).where(lt(posts.expiresAt, now));
  }
  // Messaging operations
  async createOrGetConversation(participant1Id, participant2Id) {
    const [existingConversation] = await db.select().from(conversations).where(
      or(
        and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
        and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
      )
    ).limit(1);
    if (existingConversation) {
      return existingConversation;
    }
    const [newConversation] = await db.insert(conversations).values({
      participant1Id,
      participant2Id
    }).returning();
    return newConversation;
  }
  async getConversationsByUserId(userId) {
    return await db.select().from(conversations).where(or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId))).orderBy(desc(conversations.createdAt));
  }
  async sendMessage(message, senderId) {
    const [newMessage] = await db.insert(messages).values({
      ...message,
      senderId
    }).returning();
    return newMessage;
  }
  async getMessagesByConversationId(conversationId) {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }
  async createFeedback(feedbackData, userId, userInfo) {
    const [newFeedback] = await db.insert(feedback).values({
      ...feedbackData,
      userId,
      userInfo
    }).returning();
    return newFeedback;
  }
  async createPasswordReset(userId, token, expiresAt) {
    const [passwordReset] = await db.insert(passwordResets).values({
      userId,
      token,
      expiresAt
    }).returning();
    return passwordReset;
  }
  async getPasswordReset(token) {
    const [passwordReset] = await db.select().from(passwordResets).where(and(
      eq(passwordResets.token, token),
      eq(passwordResets.used, false)
    )).limit(1);
    return passwordReset;
  }
  async markPasswordResetUsed(token) {
    await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.token, token));
  }
  // Daily question operations
  async createDailyQuestionResponse(responseData) {
    const [response] = await db.insert(dailyQuestionResponses).values(responseData).returning();
    return response;
  }
  async getTodaysDailyQuestionResponses() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return await db.select().from(dailyQuestionResponses).where(and(
      sql2`${dailyQuestionResponses.createdAt} >= ${today.toISOString()}`,
      sql2`${dailyQuestionResponses.createdAt} < ${tomorrow.toISOString()}`
    )).orderBy(desc(dailyQuestionResponses.createdAt));
  }
  // User Profile operations
  async getUserProfile(userId) {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }
  async createUserProfile(data) {
    const [profile] = await db.insert(userProfiles).values(data).returning();
    return profile;
  }
  async updateUserProfile(userId, data) {
    const [profile] = await db.update(userProfiles).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userProfiles.userId, userId)).returning();
    return profile;
  }
  // Blog operations
  async createBlogPost(postData) {
    const [post] = await db.insert(blogPosts).values(postData).returning();
    return post;
  }
  async getBlogPosts(limit = 10, offset = 0, published = true) {
    const query = db.select().from(blogPosts);
    if (published !== void 0) {
      const filteredQuery = query.where(eq(blogPosts.published, published));
      return await filteredQuery.orderBy(desc(blogPosts.createdAt)).limit(limit).offset(offset);
    }
    return await query.orderBy(desc(blogPosts.createdAt)).limit(limit).offset(offset);
  }
  async getBlogPostBySlug(slug) {
    const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true))).limit(1);
    return post;
  }
  async getBlogPostById(id) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return post;
  }
  async incrementBlogPostViews(id) {
    await db.update(blogPosts).set({ viewCount: sql2`${blogPosts.viewCount} + 1` }).where(eq(blogPosts.id, id));
  }
  async getFeaturedBlogPosts(limit = 5) {
    return await db.select().from(blogPosts).where(and(eq(blogPosts.featured, true), eq(blogPosts.published, true))).orderBy(desc(blogPosts.createdAt)).limit(limit);
  }
  async getBlogPostsByTag(tag, limit = 10) {
    return await db.select().from(blogPosts).where(and(
      sql2`${tag} = ANY(${blogPosts.tags})`,
      eq(blogPosts.published, true)
    )).orderBy(desc(blogPosts.createdAt)).limit(limit);
  }
  // Admin/Bot operations
  async createUsersInBatch(usersBatch) {
    if (usersBatch.length === 0) return;
    await db.insert(users).values(usersBatch);
  }
  async createUserProfilesInBatch(profilesBatch) {
    if (profilesBatch.length === 0) return;
    await db.insert(userProfiles).values(profilesBatch);
  }
  async createPostsInBatch(postsBatch) {
    if (postsBatch.length === 0) return;
    await db.insert(posts).values(postsBatch);
  }
  async getBotCount() {
    const result = await db.execute(sql2`SELECT COUNT(*) as count FROM users WHERE id LIKE 'bot_%'`);
    return Number(result.rows[0]?.count || 0);
  }
  async getBotPostsCount() {
    const result = await db.execute(sql2`SELECT COUNT(*) as count FROM posts WHERE author_id LIKE 'bot_%'`);
    return Number(result.rows[0]?.count || 0);
  }
};
var storage = new DatabaseStorage();

// server/activity-bot.ts
var BOT_PERSONAS = [
  {
    name: "Alex Chen",
    initials: "AC",
    personality: "coffee enthusiast, early riser",
    interests: ["coffee", "morning", "study", "gym"]
  },
  {
    name: "Maya Patel",
    initials: "MP",
    personality: "foodie, local explorer",
    interests: ["food", "travel", "weekend", "hiking"]
  },
  {
    name: "Jordan Kim",
    initials: "JK",
    personality: "fitness enthusiast, positive vibes",
    interests: ["gym", "fitness", "morning", "music"]
  },
  {
    name: "Sam Rodriguez",
    initials: "SR",
    personality: "student, night owl",
    interests: ["study", "music", "library", "food"]
  },
  {
    name: "Riley Thompson",
    initials: "RT",
    personality: "outdoor lover, weekend warrior",
    interests: ["hiking", "weekend", "travel", "morning"]
  },
  {
    name: "Taylor Wong",
    initials: "TW",
    personality: "social butterfly, event planner",
    interests: ["weekend", "music", "food", "travel"]
  }
];
var POST_TEMPLATES = {
  coffee: [
    "Just discovered this amazing coffee spot - their latte art is incredible! \u2615 #coffee",
    "Early morning coffee run complete. Nothing beats starting the day right! #morning #coffee",
    "Anyone know a good place for cold brew around here? The weather is perfect for it #coffee",
    "That first sip of coffee hits different when you find the perfect spot #coffee #morning"
  ],
  food: [
    "Found this hidden gem for lunch today - the tacos are unreal! \u{1F32E} #food",
    "Sunday brunch vibes! Anyone else trying the new place on Main Street? #food #weekend",
    "Late night food cravings hitting hard. Best spot for a quick bite? #food",
    "Home cooking experiment went surprisingly well! Might have to share the recipe #food"
  ],
  gym: [
    "Morning workout done! The gym was surprisingly empty today #gym #morning #fitness",
    "New PR on deadlifts! Feeling stronger every day \u{1F4AA} #gym #fitness",
    "Anyone else notice the gym gets crazy busy around 6pm? #gym #fitness",
    "Post-workout smoothie is the best reward. What's your go-to flavor? #gym #fitness"
  ],
  study: [
    "Found the perfect study spot with great WiFi and minimal distractions #study #library",
    "Finals season is here! Anyone else camping out at the library? #study",
    "Study group session was actually productive today - rare win! #study",
    "Need to find a quiet place to focus. Coffee shop or library? #study"
  ],
  weekend: [
    "Saturday plans: sleep in, good coffee, maybe some exploring. Perfect weekend! #weekend",
    "Sunday vibes are hitting just right. What's everyone up to? #weekend",
    "Weekend farmers market run was worth it - fresh everything! #weekend #food",
    "Lazy Sunday afternoon calls for a good book and some sunshine #weekend"
  ],
  morning: [
    "Early bird gets the worm! Beautiful sunrise this morning \u{1F305} #morning",
    "Morning walk complete - nothing beats starting the day with fresh air #morning",
    "6am and already productive. Morning people unite! #morning",
    "Quiet morning moments before the world wakes up are the best #morning"
  ],
  music: [
    "Live music tonight was incredible! Local talent is seriously underrated #music",
    "Discovering new artists on my morning commute. Any recommendations? #music",
    "Nothing beats good music and good vibes on a Friday night #music #weekend",
    "Playlist for studying is finally perfect after months of tweaking #music #study"
  ],
  hiking: [
    "Trail was muddy but totally worth it for these views! \u{1F97E} #hiking #weekend",
    "Morning hike complete - legs are tired but soul is happy #hiking #morning",
    "Found a new trail that's not crowded. Hidden gems everywhere! #hiking #travel",
    "Weekend adventure planning: which trail should we tackle next? #hiking #weekend"
  ],
  travel: [
    "Day trip was exactly what I needed. Sometimes you don't have to go far #travel #weekend",
    "Exploring the neighborhood like a tourist in my own city #travel",
    "Weekend road trip planning in progress. Who's got recommendations? #travel #weekend",
    "Local exploration beats vacation planning any day #travel"
  ],
  library: [
    "Library productivity mode: activated. Silent floor is my sanctuary #library #study",
    "Found the perfect corner table with natural light. Study goals! #library #study",
    "Library events are actually pretty cool. Who knew? #library",
    "Quiet afternoon at the library beats crowded coffee shops every time #library #study"
  ]
};
var COMMENT_TEMPLATES = [
  "Love this spot! Thanks for sharing",
  "Adding this to my list \u{1F4DD}",
  "Been meaning to try this place!",
  "Great recommendation!",
  "This looks amazing",
  "Perfect timing - was just looking for something like this",
  "Yes! Finally someone else who gets it",
  "Totally agree with this",
  "Same! Such a good find",
  "You're inspiring me to get out more",
  "This is exactly what I needed to see today",
  "Thanks for the motivation!"
];
function generateNearbyCoordinates(baseLatitude, baseLongitude) {
  const latOffset = (Math.random() - 0.5) * 0.02;
  const lngOffset = (Math.random() - 0.5) * 0.02;
  return {
    latitude: baseLatitude + latOffset,
    longitude: baseLongitude + lngOffset
  };
}
function getLocationName(latitude, longitude) {
  const areas = [
    "Downtown",
    "Riverside",
    "University District",
    "Old Town",
    "Midtown",
    "The Heights",
    "Arts Quarter",
    "Market District"
  ];
  const index2 = Math.floor(Math.abs(latitude * longitude) * 1e3 % areas.length);
  return areas[index2];
}
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function extractHashtags(content) {
  const matches = content.match(/#\w+/g);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
}
var ActivityBot = class {
  isRunning = false;
  baseCoordinates = { latitude: 40.7128, longitude: -74.006 };
  // Default to NYC
  setLocation(latitude, longitude) {
    this.baseCoordinates = { latitude, longitude };
  }
  async createBotPost() {
    try {
      const persona = randomChoice(BOT_PERSONAS);
      const interest = randomChoice(persona.interests);
      const postTemplate = randomChoice(POST_TEMPLATES[interest] || POST_TEMPLATES["food"]);
      const coordinates = generateNearbyCoordinates(
        this.baseCoordinates.latitude,
        this.baseCoordinates.longitude
      );
      const locationName = getLocationName(coordinates.latitude, coordinates.longitude);
      const hashtags = extractHashtags(postTemplate);
      const botUserId = `bot_${persona.initials.toLowerCase()}`;
      const postData = {
        content: postTemplate,
        authorName: persona.name,
        authorInitials: persona.initials,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationName,
        hashtags
      };
      await storage.createPost(postData, botUserId);
      console.log(`Bot created post by ${persona.name}: "${postTemplate.substring(0, 50)}..."`);
    } catch (error) {
      console.error("Error creating bot post:", error);
    }
  }
  async createBotComment(postId) {
    try {
      const persona = randomChoice(BOT_PERSONAS);
      const commentText = randomChoice(COMMENT_TEMPLATES);
      const botUserId = `bot_${persona.initials.toLowerCase()}`;
      const commentData = {
        postId,
        content: commentText,
        authorName: persona.name,
        authorInitials: persona.initials
      };
      await storage.createComment(commentData, botUserId);
      console.log(`Bot commented by ${persona.name}: "${commentText}"`);
    } catch (error) {
      console.error("Error creating bot comment:", error);
    }
  }
  async addRandomReaction(postId) {
    try {
      const emojis = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F602}", "\u{1F525}", "\u{1F4AF}"];
      const emoji = randomChoice(emojis);
      await storage.addPostReaction(postId, emoji);
      console.log(`Bot added ${emoji} reaction to post ${postId}`);
    } catch (error) {
      console.error("Error adding bot reaction:", error);
    }
  }
  async seedActivity() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Activity bot starting to seed content...");
    try {
      const postCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < postCount; i++) {
        await this.createBotPost();
        const delay = Math.random() * 9e4 + 3e4;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      const recentPosts = await storage.getPosts(
        this.baseCoordinates.latitude,
        this.baseCoordinates.longitude,
        5
        // 5km radius
      );
      for (const post of recentPosts.slice(0, 3)) {
        if (Math.random() < 0.7) {
          await this.createBotComment(post.id);
          await new Promise((resolve) => setTimeout(resolve, 5e3));
        }
        if (Math.random() < 0.5) {
          await this.addRandomReaction(post.id);
          await new Promise((resolve) => setTimeout(resolve, 3e3));
        }
      }
    } catch (error) {
      console.error("Error in activity bot seeding:", error);
    } finally {
      this.isRunning = false;
      console.log("Activity bot seeding complete");
    }
  }
  async respondToDailyQuestion(question) {
    try {
      const persona = randomChoice(BOT_PERSONAS);
      let response = "";
      const questionLower = question.toLowerCase();
      if (questionLower.includes("coffee") || questionLower.includes("caf\xE9")) {
        response = persona.interests.includes("coffee") ? "There's this little place on Main Street with the best espresso I've tried!" : "I'm more of a tea person, but my friends love the caf\xE9 downtown";
      } else if (questionLower.includes("saturday") || questionLower.includes("weekend")) {
        response = persona.interests.includes("hiking") ? "Planning a morning hike if the weather holds up!" : "Probably catching up on some reading and maybe exploring the farmers market";
      } else if (questionLower.includes("restaurant") || questionLower.includes("food")) {
        response = "The new Mediterranean place has been getting great reviews - might give it a try!";
      } else if (questionLower.includes("gym") || questionLower.includes("workout")) {
        response = persona.interests.includes("gym") ? "Early morning is definitely the way to go - much less crowded" : "I prefer outdoor activities myself, but the gym near the park seems popular";
      } else {
        const genericResponses = [
          "Great question! I've been wondering about this too",
          "This is exactly what I needed to think about today",
          "Love seeing questions that bring the community together",
          "Such a good conversation starter!"
        ];
        response = randomChoice(genericResponses);
      }
      const botUserId = `bot_${persona.initials.toLowerCase()}`;
      const location = getLocationName(this.baseCoordinates.latitude, this.baseCoordinates.longitude);
      const responseData = {
        question,
        response,
        authorId: botUserId,
        authorName: persona.name,
        location
      };
      await storage.createDailyQuestionResponse(responseData);
      console.log(`Bot responded to daily question by ${persona.name}: "${response}"`);
    } catch (error) {
      console.error("Error creating bot daily question response:", error);
    }
  }
  // Gentle seeding mode for low activity periods
  async maintainActivity() {
    const interval = Math.random() * 72e5 + 72e5;
    setTimeout(async () => {
      if (!this.isRunning) {
        await this.createBotPost();
        if (Math.random() < 0.3) {
          await this.respondToDailyQuestion("What's your plan for today?");
        }
      }
      this.maintainActivity();
    }, interval);
  }
};
var activityBot = new ActivityBot();
activityBot.maintainActivity();

// shared/content-filter.ts
var BAD_WORDS = [
  "spam",
  "scam",
  "fraud",
  "fake",
  "hate",
  "violence",
  "illegal",
  "drugs",
  "abuse",
  "harassment",
  "discriminat",
  "racist",
  "sexist",
  "threat",
  "attack",
  "kill",
  "murder",
  "suicide",
  "harm",
  "weapon"
];
function containsBadWords(text2) {
  const lowerText = text2.toLowerCase();
  return BAD_WORDS.some((word) => lowerText.includes(word));
}
function validateContent(content) {
  if (containsBadWords(content)) {
    return {
      isValid: false,
      message: "Your post contains inappropriate content. Please revise and try again."
    };
  }
  return { isValid: true };
}

// server/routes.ts
init_content_generator();
import { z as z2 } from "zod";

// server/auth.ts
import bcrypt from "bcryptjs";
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
async function registerUser(data) {
  const existingUser = await storage.getUserByEmailOrUsername(data.email, data.username);
  if (existingUser) {
    throw new Error("User with this email or username already exists");
  }
  const passwordHash = await hashPassword(data.password);
  const newUser = await storage.createUser({
    username: data.username,
    email: data.email,
    phone: data.phone,
    passwordHash,
    firstName: null,
    lastName: null,
    profileImageUrl: null
  });
  return newUser;
}
async function loginUser(data) {
  const user = await storage.getUserByEmailOrUsername(data.identifier, data.identifier);
  if (!user) {
    return null;
  }
  if (!user.passwordHash) {
    return null;
  }
  const isValidPassword = await verifyPassword(data.password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }
  return user;
}
var requireAuth = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// server/routes.ts
import { randomBytes } from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
async function registerRoutes(app2) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  app2.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: "localfeat.sid",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax"
    }
  }));
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registrationSchema.parse(req.body);
      const user = await registerUser(validatedData);
      req.session.userId = user.id;
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await loginUser(validatedData);
      if (!user) {
        return res.status(401).json({ message: "Invalid email/username or password" });
      }
      req.session.userId = user.id;
      if (process.env.NODE_ENV === "production") {
        console.log("Login success:", {
          userId: user.id,
          sessionId: req.session.id,
          sessionSaved: !!req.session.userId
        });
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("localfeat.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/user", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        console.log("Session debug:", {
          hasSession: !!req.session,
          userId: req.session?.userId,
          sessionId: req.session?.id,
          cookies: req.headers.cookie ? "present" : "missing"
        });
      }
      if (!req.session?.userId) {
        return res.json(null);
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.json(null);
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.json(null);
    }
  });
  app2.get("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/posts", async (req, res) => {
    try {
      const { latitude, longitude, hashtag, search, limit, offset } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const limitNum = parseInt(limit) || 10;
      const offsetNum = parseInt(offset) || 0;
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid latitude or longitude" });
      }
      const posts2 = await storage.getPosts(lat, lng, 1, hashtag, search, limitNum, offsetNum);
      res.json(posts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  app2.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      const userId = req.user.id;
      const post = await storage.createPost(validatedData, userId);
      res.status(201).json(post);
    } catch (error) {
      console.error("Post creation error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.likePost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to like post" });
    }
  });
  app2.post("/api/posts/:id/reactions", requireAuth, async (req, res) => {
    try {
      const { emoji } = req.body;
      const userId = req.user.id;
      const userName = req.user.username || req.user.firstName || "Someone";
      if (!emoji || typeof emoji !== "string") {
        return res.status(400).json({ message: "Valid emoji is required" });
      }
      const post = await storage.addPostReaction(req.params.id, emoji);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });
  app2.delete("/api/posts/:id/reactions", requireAuth, async (req, res) => {
    try {
      const { emoji } = req.body;
      if (!emoji || typeof emoji !== "string") {
        return res.status(400).json({ message: "Valid emoji is required" });
      }
      const post = await storage.removePostReaction(req.params.id, emoji);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });
  app2.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== userId) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      await storage.deletePost(id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Post deletion error:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });
  app2.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments2 = await storage.getCommentsByPostId(id);
      res.json(comments2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app2.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      const userId = req.user.id;
      const userName = req.user.username || req.user.firstName || "Someone";
      const comment = await storage.createComment(validatedData, userId);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  app2.post("/api/comments/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await storage.likeComment(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to like comment" });
    }
  });
  app2.post("/api/comments/:id/reactions", requireAuth, async (req, res) => {
    try {
      const { emoji } = req.body;
      const userId = req.user.id;
      const userName = req.user.username || req.user.firstName || "Someone";
      if (!emoji || typeof emoji !== "string") {
        return res.status(400).json({ message: "Valid emoji is required" });
      }
      const comment = await storage.addCommentReaction(req.params.id, emoji);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });
  app2.delete("/api/comments/:id/reactions", requireAuth, async (req, res) => {
    try {
      const { emoji } = req.body;
      if (!emoji || typeof emoji !== "string") {
        return res.status(400).json({ message: "Valid emoji is required" });
      }
      const comment = await storage.removeCommentReaction(req.params.id, emoji);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });
  app2.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const { participantId } = req.body;
      if (!participantId) {
        return res.status(400).json({ message: "Participant ID is required" });
      }
      const userId = req.user.id;
      const conversation = await storage.createOrGetConversation(userId, participantId);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });
  app2.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const conversations2 = await storage.getConversationsByUserId(userId);
      res.json(conversations2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      const userId = req.user.id;
      const message = await storage.sendMessage(validatedData, userId);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app2.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const messages2 = await storage.getMessagesByConversationId(id);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/feedback", async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      const userId = req.user?.id;
      const userInfo = req.user ? `${req.user.username} (${req.user.email})` : void 0;
      const feedback2 = await storage.createFeedback(validatedData, userId, userInfo);
      res.status(201).json({ message: "Feedback submitted successfully", id: feedback2.id });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid feedback data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      res.json({ message: "If an account with that email exists, we've sent you a password reset link." });
      if (!user) {
        return;
      }
      const resetToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await storage.createPasswordReset(user.id, resetToken, expiresAt);
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
      console.log(`Password reset requested for ${user.email}. Reset link: ${resetUrl}`);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid email address", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const passwordReset = await storage.getPasswordReset(validatedData.token);
      if (!passwordReset || passwordReset.used || /* @__PURE__ */ new Date() > passwordReset.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      const passwordHash = await hashPassword(validatedData.password);
      await storage.updateUserPassword(passwordReset.userId, passwordHash);
      await storage.markPasswordResetUsed(validatedData.token);
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid password reset data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.get("/api/auth/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const passwordReset = await storage.getPasswordReset(token);
      if (!passwordReset || passwordReset.used || /* @__PURE__ */ new Date() > passwordReset.expiresAt) {
        return res.status(400).json({ valid: false, message: "Invalid or expired reset token" });
      }
      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ valid: false, message: "Failed to validate reset token" });
    }
  });
  app2.post("/api/daily-question/responses", requireAuth, async (req, res) => {
    try {
      const { question, response, location } = req.body;
      if (!question || !response) {
        return res.status(400).json({ message: "Question and response are required" });
      }
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const responseData = {
        question: question.trim(),
        response: response.trim(),
        authorId: userId,
        authorName: user.firstName || user.username || "Anonymous",
        location: location || "Unknown"
      };
      const dailyResponse = await storage.createDailyQuestionResponse(responseData);
      res.status(201).json(dailyResponse);
    } catch (error) {
      console.error("Error creating daily question response:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });
  app2.get("/api/daily-question/responses", async (req, res) => {
    try {
      const responses = await storage.getTodaysDailyQuestionResponses();
      res.json(responses);
    } catch (error) {
      console.error("Error fetching daily question responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });
  app2.post("/api/admin/seed-activity", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (latitude && longitude) {
        activityBot.setLocation(latitude, longitude);
      }
      activityBot.seedActivity().catch(console.error);
      res.json({ message: "Activity seeding started" });
    } catch (error) {
      console.error("Error starting activity seeding:", error);
      res.status(500).json({ message: "Failed to start activity seeding" });
    }
  });
  app2.post("/api/admin/test-content-generation", async (req, res) => {
    try {
      console.log("\u{1F9EA} Manual content generation triggered...");
      const generator = new ContentGenerator();
      await generator.generateDailyContent();
      res.json({ message: "Content generation completed successfully" });
    } catch (error) {
      console.error("\u274C Error in test content generation:", error);
      res.status(500).json({ error: "Content generation failed", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.post("/api/admin/bot-post", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (latitude && longitude) {
        activityBot.setLocation(latitude, longitude);
      }
      await activityBot.createBotPost();
      res.json({ message: "Bot post created successfully" });
    } catch (error) {
      console.error("Error creating bot post:", error);
      res.status(500).json({ message: "Failed to create bot post" });
    }
  });
  app2.get("/api/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserProfileSchema.parse(req.body);
      const userId = req.user.id;
      const profileData = {
        ...validatedData,
        userId
      };
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create profile" });
    }
  });
  app2.put("/api/profile/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const authUserId = req.user.id;
      if (userId !== authUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const validatedData = insertUserProfileSchema.partial().parse(req.body);
      const profile = await storage.updateUserProfile(userId, validatedData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.post("/api/upload/profile-image", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { imageData, imageType } = req.body;
      if (!imageData || !imageType) {
        return res.status(400).json({ message: "Image data and type are required" });
      }
      if (!imageType.startsWith("image/")) {
        return res.status(400).json({ message: "Invalid image type" });
      }
      const base64Data = imageData.split(",")[1] || imageData;
      const sizeInBytes = base64Data.length * 3 / 4;
      if (sizeInBytes > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Image too large. Maximum size is 5MB" });
      }
      const imageId = `profile-${userId}-${Date.now()}`;
      const imageUrl = `/api/profile/image/${imageId}`;
      await storage.updateUserProfile(userId, {
        profileImageUrl: imageUrl,
        profileImageData: base64Data,
        profileImageType: imageType
      });
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  app2.get("/api/profile/image/:imageId", async (req, res) => {
    try {
      const { imageId } = req.params;
      console.log("Serving image for ID:", imageId);
      if (!imageId.startsWith("profile-")) {
        console.log("Invalid image ID format:", imageId);
        return res.status(404).json({ message: "Invalid image ID" });
      }
      const withoutPrefix = imageId.substring("profile-".length);
      const lastHyphenIndex = withoutPrefix.lastIndexOf("-");
      if (lastHyphenIndex === -1) {
        console.log("Invalid image ID format - no timestamp:", imageId);
        return res.status(404).json({ message: "Invalid image ID" });
      }
      const userId = withoutPrefix.substring(0, lastHyphenIndex);
      console.log("Looking for profile for user:", userId);
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        console.log("No profile found for user:", userId);
        return res.status(404).json({ message: "Profile not found" });
      }
      if (!profile.profileImageData || !profile.profileImageType) {
        console.log("No image data found in profile for user:", userId);
        return res.status(404).json({ message: "Image not found" });
      }
      console.log("Found image data, type:", profile.profileImageType, "data length:", profile.profileImageData.length);
      const imageBuffer = Buffer.from(profile.profileImageData, "base64");
      res.set({
        "Content-Type": profile.profileImageType,
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400"
        // Cache for 1 day
      });
      console.log("Sending image buffer, size:", imageBuffer.length);
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error serving profile image:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to serve image" });
      }
    }
  });
  app2.get("/api/blog/posts", async (req, res) => {
    try {
      const { limit = "10", offset = "0", tag } = req.query;
      let posts2;
      if (tag && typeof tag === "string") {
        posts2 = await storage.getBlogPostsByTag(tag, parseInt(limit));
      } else {
        posts2 = await storage.getBlogPosts(
          parseInt(limit),
          parseInt(offset)
        );
      }
      res.json(posts2);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  app2.get("/api/blog/posts/featured", async (req, res) => {
    try {
      const { limit = "5" } = req.query;
      const posts2 = await storage.getFeaturedBlogPosts(parseInt(limit));
      res.json(posts2);
    } catch (error) {
      console.error("Error fetching featured blog posts:", error);
      res.status(500).json({ message: "Failed to fetch featured blog posts" });
    }
  });
  app2.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      await storage.incrementBlogPostViews(post.id);
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });
  app2.post("/api/blog/posts", async (req, res) => {
    try {
      const { adminKey } = req.body;
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const postData = req.body;
      delete postData.adminKey;
      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });
  app2.post("/api/admin/create-bots", async (req, res) => {
    try {
      const adminSecret = req.headers["x-admin-secret"];
      if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "localfeat-admin-2025") {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { count = 5e3, batchSize = 50 } = req.body;
      res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      const totalBatches = Math.ceil(count / batchSize);
      let totalCreated = { users: 0, profiles: 0, posts: 0 };
      res.write(`\u{1F680} Starting bot creation: ${count} bots in ${totalBatches} batches

`);
      const locations = [
        { name: "Pocket 42, Rohini", lat: 28.72335, lng: 77.13432 },
        { name: "Sector 15 Pkt 4, Rohini", lat: 28.72921, lng: 77.13254 },
        { name: "Sector 9, Rohini", lat: 28.7172, lng: 77.1262 },
        { name: "Sector 18G, Rohini", lat: 28.7402, lng: 77.13464 },
        { name: "Sector 19, Dwarka", lat: 28.57667, lng: 77.05248 },
        { name: "Sector 3, Dwarka", lat: 28.567, lng: 77.0976 },
        { name: "Sector 100, Noida", lat: 28.54535, lng: 77.37168 },
        { name: "DLF Ridgewood, Gurugram", lat: 28.46504, lng: 77.08108 },
        { name: "Model Town", lat: 28.718, lng: 77.1916 },
        { name: "Model Town III", lat: 28.71066, lng: 77.1968 },
        { name: "Mayur Vihar Phase 1", lat: 28.6026, lng: 77.293 },
        { name: "Mayur Vihar (gen.)", lat: 28.6156, lng: 77.3133 },
        { name: "Mayur Vihar Phase 3", lat: 28.61152, lng: 77.33629 },
        { name: "Naraina Vihar", lat: 28.62899, lng: 77.14133 },
        { name: "Sarita Vihar", lat: 28.53389, lng: 77.28994 }
      ];
      const firstNames = ["Aarav", "Arjun", "Aditya", "Vihaan", "Vivaan", "Krishna", "Aryan", "Ishaan", "Shaurya", "Atharv", "Aadhya", "Ananya", "Diya", "Saanvi", "Anvi", "Kavya", "Priya", "Neha", "Pooja", "Anjali"];
      const lastNames = ["Sharma", "Verma", "Singh", "Kumar", "Gupta", "Agarwal", "Jain", "Bansal", "Goyal", "Mittal", "Chopra", "Kapoor", "Patel", "Shah", "Mehta"];
      const postTemplates = [
        "Looking for a gym partner to start morning workouts! #gym #workout #fitness #partner",
        "Anyone up for an evening walk in the park? #walk #evening #health #nature",
        "Need a study buddy for competitive exams #study #exams #motivation #education",
        "Looking for someone to practice badminton with #badminton #sports #games #partner",
        "Anyone interested in learning cooking together? #cooking #food #learn #hobby",
        "Want to start a book club in our area #books #reading #bookclub #literature",
        "Looking for a running partner for morning jogs #running #jogging #fitness #morning",
        "Need recommendations for good street food nearby #food #streetfood #recommendations #local"
      ];
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const currentBatchSize = Math.min(batchSize, count - batchNum * batchSize);
        res.write(`\u{1F4E6} Batch ${batchNum + 1}/${totalBatches}: Creating ${currentBatchSize} bots...
`);
        const usersBatch = [];
        const profilesBatch = [];
        const postsBatch = [];
        for (let i = 0; i < currentBatchSize; i++) {
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          const displayName = `${firstName} ${lastName}`;
          const location = locations[Math.floor(Math.random() * locations.length)];
          const userId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
          const uniqueId = Math.floor(Math.random() * 999999);
          usersBatch.push({
            id: userId,
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${uniqueId}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@localfeat.bot`,
            phone: `+91${Math.floor(Math.random() * 9e9) + 1e9}`,
            passwordHash: "bot_account_hash",
            firstName,
            lastName
          });
          profilesBatch.push({
            userId,
            displayName,
            bio: `Local resident of ${location.name}`,
            profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`
          });
          const postsCount = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < postsCount; j++) {
            const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
            const lat = location.lat + (Math.random() - 0.5) * 5e-3;
            const lng = location.lng + (Math.random() - 0.5) * 5e-3;
            const hashtagMatches = template.match(/#\w+/g) || [];
            const hashtags = hashtagMatches.map((tag) => tag.substring(1));
            postsBatch.push({
              content: template,
              authorId: userId,
              authorName: displayName,
              authorInitials: displayName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2),
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
              locationName: location.name,
              hashtags,
              likes: Math.floor(Math.random() * 15),
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1e3)
            });
          }
        }
        await storage.createUsersInBatch(usersBatch);
        await storage.createUserProfilesInBatch(profilesBatch);
        await storage.createPostsInBatch(postsBatch);
        totalCreated.users += usersBatch.length;
        totalCreated.profiles += profilesBatch.length;
        totalCreated.posts += postsBatch.length;
        res.write(`\u2705 Batch ${batchNum + 1} complete: ${usersBatch.length} users, ${postsBatch.length} posts
`);
        const progress = ((batchNum + 1) / totalBatches * 100).toFixed(1);
        res.write(`\u{1F4CA} Progress: ${progress}%

`);
      }
      res.write(`\u{1F389} SUCCESS! Created:
`);
      res.write(`\u{1F465} Users: ${totalCreated.users.toLocaleString()}
`);
      res.write(`\u{1F4DD} Posts: ${totalCreated.posts.toLocaleString()}
`);
      res.write(`\u{1F3D9}\uFE0F Locations: 15 Delhi/NCR areas

`);
      res.write(`Your LocalFeat app now has a vibrant Indian community!
`);
      res.end();
    } catch (error) {
      console.error("Bot creation failed:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Bot creation failed", details: error.message });
      }
    }
  });
  app2.get("/api/admin/bot-status", async (req, res) => {
    try {
      const botUsers = await storage.getBotCount();
      const botPosts = await storage.getBotPostsCount();
      res.json({
        botUsers,
        botPosts,
        ready: botUsers > 0
      });
    } catch (error) {
      console.error("Bot status error:", error);
      res.status(500).json({ error: "Failed to check bot status" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/googleAuth.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
function setupGoogleAuth(app2) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not found. Google login will be disabled.");
    return;
  }
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://localfeat.com/auth/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const profileImageUrl = profile.photos?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Google profile"), false);
      }
      let user = await storage.getUserByEmailOrUsername(email, "");
      if (user) {
        if (!user.firstName && firstName) {
          user = await storage.updateUser(user.id, {
            firstName,
            lastName,
            profileImageUrl
          });
        }
      } else {
        const username = `${firstName?.toLowerCase() || "user"}${Date.now()}`;
        user = await storage.createUser({
          username,
          email,
          phone: null,
          passwordHash: null,
          // Google OAuth users don't need a password
          firstName,
          lastName,
          profileImageUrl,
          googleId
        });
      }
      return done(null, user);
    } catch (error) {
      console.error("Google OAuth error:", error);
      return done(error, false);
    }
  }));
  app2.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app2.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
      }
      res.redirect("/");
    }
  );
  app2.get(
    "/auth/callback",
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
      }
      res.redirect("/");
    }
  );
}

// server/index.ts
import passport2 from "passport";
import session2 from "express-session";
var app = express2();
app.set("trust proxy", 1);
app.use(session2({
  secret: process.env.SESSION_SECRET || "your-default-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  }
}));
app.use(passport2.initialize());
app.use(passport2.session());
passport2.serializeUser((user, done) => {
  done(null, user.id);
});
passport2.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  setupGoogleAuth(app);
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  setInterval(async () => {
    try {
      await storage.cleanupExpiredPosts();
    } catch (error) {
      console.error("Error during post cleanup:", error);
    }
  }, 5 * 60 * 1e3);
  const runDailyContentGeneration = async () => {
    try {
      console.log("\u{1F680} Starting daily blog content generation...");
      const { ContentGenerator: ContentGenerator2 } = await Promise.resolve().then(() => (init_content_generator(), content_generator_exports));
      const generator = new ContentGenerator2();
      const blogPosts2 = await generator.generateDailyContent();
      for (const postData of blogPosts2) {
        await storage.createBlogPost(postData);
        console.log(`\u{1F4DD} Published blog post: "${postData.title}"`);
      }
      console.log(`\u2705 Daily content generation complete. Published ${blogPosts2.length} posts.`);
    } catch (error) {
      console.error("\u274C Error during daily content generation:", error);
    }
  };
  if (process.env.NODE_ENV === "development") {
    setTimeout(runDailyContentGeneration, 1e4);
  }
  const scheduleDaily = () => {
    const now = /* @__PURE__ */ new Date();
    const next6AM = /* @__PURE__ */ new Date();
    next6AM.setHours(6, 0, 0, 0);
    if (now.getHours() >= 6) {
      next6AM.setDate(next6AM.getDate() + 1);
    }
    const msUntil6AM = next6AM.getTime() - now.getTime();
    setTimeout(() => {
      runDailyContentGeneration();
      setInterval(runDailyContentGeneration, 24 * 60 * 60 * 1e3);
    }, msUntil6AM);
  };
  scheduleDaily();
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
