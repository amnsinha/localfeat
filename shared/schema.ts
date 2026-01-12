import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, integer, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for custom authentication
export const users = pgTable("users", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
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
  reactions: jsonb("reactions").notNull().default(sql`'{}'::jsonb`), // Store emoji reactions as {emoji: count}
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
  expiresAt: timestamp("expires_at").notNull().default(sql`NOW() + INTERVAL '30 days'`),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorInitials: text("author_initials").notNull(),
  likes: integer("likes").notNull().default(0),
  reactions: jsonb("reactions").notNull().default(sql`'{}'::jsonb`), // Store emoji reactions as {emoji: count}
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});





export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // "feature" or "bug"
  content: text("content").notNull(),
  userId: varchar("user_id").references(() => users.id), // nullable for anonymous feedback
  userInfo: text("user_info"), // store username/email for reference
  status: varchar("status").notNull().default("open"), // "open", "in_progress", "completed", "closed"
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

export const passwordResets = pgTable("password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

export const blogPosts = pgTable("blog_posts", {
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
  updatedAt: timestamp("updated_at").notNull().default(sql`NOW()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  sentMessages: many(messages),
  conversations1: many(conversations, { relationName: "participant1" }),
  conversations2: many(conversations, { relationName: "participant2" }),

}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, { fields: [conversations.participant1Id], references: [users.id], relationName: "participant1" }),
  participant2: one(users, { fields: [conversations.participant2Id], references: [users.id], relationName: "participant2" }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, { fields: [passwordResets.userId], references: [users.id] }),
}));

export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  // No relations needed for now
}));



export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  authorName: true,
  authorInitials: true,
  latitude: true,
  longitude: true,
  locationName: true,
  hashtags: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  content: true,
  authorName: true,
  authorInitials: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  type: true,
  content: true,
});

// Registration and login schemas
export const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  tags: true,
  metaTitle: true,
  metaDescription: true,
  featured: true,
  published: true,
});

// Type exports
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type RegistrationData = z.infer<typeof registrationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;


// Daily Question Responses
export const dailyQuestionResponses = pgTable("daily_question_responses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  question: text("question").notNull(),
  response: text("response").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDailyQuestionResponseSchema = createInsertSchema(dailyQuestionResponses).omit({
  id: true,
  createdAt: true,
});

export type DailyQuestionResponse = typeof dailyQuestionResponses.$inferSelect;
export type InsertDailyQuestionResponse = typeof dailyQuestionResponses.$inferInsert;

// User profiles
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  displayName: varchar("display_name", { length: 50 }),
  bio: varchar("bio", { length: 100 }),
  profileImageUrl: varchar("profile_image_url"),
  profileImageData: text("profile_image_data"), // Base64 encoded image data
  profileImageType: varchar("profile_image_type", { length: 50 }), // MIME type
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export const insertUserProfileSchema = createInsertSchema(userProfiles, {
  displayName: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less").optional(),
  bio: z.string().max(100, "Bio must be 100 characters or less").optional(),
  profileImageUrl: z.string().optional(),
  profileImageData: z.string().optional(),
  profileImageType: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateUserProfileSchema = insertUserProfileSchema.partial().omit({ userId: true });
