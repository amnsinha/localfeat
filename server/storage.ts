import {
  users,
  posts,
  comments,
  conversations,
  messages,
  feedback,
  passwordResets,
  blogPosts,
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Message,
  type InsertMessage,
  type Conversation,
  type Feedback,
  type InsertFeedback,
  type PasswordReset,
  type BlogPost,
  type InsertBlogPost,
  dailyQuestionResponses,
  type DailyQuestionResponse,
  type InsertDailyQuestionResponse,
  userProfiles,
  type UserProfile,
  type InsertUserProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByEmailOrUsername(email: string, username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
  
  // Post operations
  createPost(post: InsertPost, authorId: string): Promise<Post>;
  getPosts(userLatitude: number, userLongitude: number, radiusKm?: number, hashtag?: string, search?: string): Promise<Post[]>;
  getPostById(id: string): Promise<Post | undefined>;
  likePost(id: string): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;
  addPostReaction(id: string, emoji: string): Promise<Post | null>;
  removePostReaction(id: string, emoji: string): Promise<Post | null>;
  cleanupExpiredPosts(): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertComment, authorId: string): Promise<Comment>;
  getCommentsByPostId(postId: string): Promise<Comment[]>;
  likeComment(id: string): Promise<Comment | undefined>;
  addCommentReaction(id: string, emoji: string): Promise<Comment | null>;
  removeCommentReaction(id: string, emoji: string): Promise<Comment | null>;
  
  // Messaging operations
  createOrGetConversation(participant1Id: string, participant2Id: string): Promise<Conversation>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  sendMessage(message: InsertMessage, senderId: string): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback, userId?: string, userInfo?: string): Promise<Feedback>;
  
  // Password reset operations
  createPasswordReset(userId: string, token: string, expiresAt: Date): Promise<PasswordReset>;
  getPasswordReset(token: string): Promise<PasswordReset | undefined>;
  markPasswordResetUsed(token: string): Promise<void>;
  
  // Daily question operations
  createDailyQuestionResponse(response: InsertDailyQuestionResponse): Promise<DailyQuestionResponse>;
  getTodaysDailyQuestionResponses(): Promise<DailyQuestionResponse[]>;
  
  // User Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(data: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Blog operations
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPosts(limit?: number, offset?: number, published?: boolean): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  incrementBlogPostViews(id: string): Promise<void>;
  getFeaturedBlogPosts(limit?: number): Promise<BlogPost[]>;
  getBlogPostsByTag(tag: string, limit?: number): Promise<BlogPost[]>;
  
  // Admin/Bot operations
  createUsersInBatch(users: InsertUser[]): Promise<void>;
  createUserProfilesInBatch(profiles: InsertUserProfile[]): Promise<void>;
  createPostsInBatch(posts: InsertPost[]): Promise<void>;
  getBotCount(): Promise<number>;
  getBotPostsCount(): Promise<number>;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        passwordHash, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createPost(insertPost: InsertPost, authorId: string): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({
        ...insertPost,
        authorId,
      })
      .returning();
    return post;
  }

  async getPosts(userLatitude: number, userLongitude: number, radiusKm: number = 1, hashtag?: string, search?: string, limit: number = 10, offset: number = 0): Promise<Post[]> {
    // First cleanup expired posts
    await this.cleanupExpiredPosts();
    
    // Get all non-expired posts
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));
    
    let filteredPosts = allPosts.filter(post => {
      const distance = calculateDistance(userLatitude, userLongitude, post.latitude, post.longitude);
      return distance <= radiusKm && new Date() < post.expiresAt;
    });

    if (hashtag) {
      filteredPosts = filteredPosts.filter(post => 
        post.hashtags.some(tag => tag.toLowerCase() === hashtag.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.content.toLowerCase().includes(searchLower) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    return filteredPosts.slice(offset, offset + limit);
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async likePost(id: string): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async addPostReaction(id: string, emoji: string): Promise<Post | null> {
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, id));
    if (!existingPost) return null;

    const currentReactions = (existingPost.reactions as Record<string, number>) || {};
    const newReactions = {
      ...currentReactions,
      [emoji]: (currentReactions[emoji] || 0) + 1
    };

    const [post] = await db
      .update(posts)
      .set({ reactions: newReactions })
      .where(eq(posts.id, id))
      .returning();
    
    return post || null;
  }

  async removePostReaction(id: string, emoji: string): Promise<Post | null> {
    const [existingPost] = await db.select().from(posts).where(eq(posts.id, id));
    if (!existingPost) return null;

    const currentReactions = (existingPost.reactions as Record<string, number>) || {};
    const newReactions = { ...currentReactions };
    
    if (newReactions[emoji] && newReactions[emoji] > 0) {
      newReactions[emoji] -= 1;
      if (newReactions[emoji] === 0) {
        delete newReactions[emoji];
      }
    }

    const [post] = await db
      .update(posts)
      .set({ reactions: newReactions })
      .where(eq(posts.id, id))
      .returning();
    
    return post || null;
  }

  async deletePost(id: string): Promise<void> {
    // First delete all comments associated with the post (cascade delete)
    await db.delete(comments).where(eq(comments.postId, id));
    
    // Then delete the post
    await db.delete(posts).where(eq(posts.id, id));
  }

  async createComment(insertComment: InsertComment, authorId: string): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...insertComment,
        authorId,
      })
      .returning();
    return comment;
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }

  async likeComment(id: string): Promise<Comment | undefined> {
    const [comment] = await db
      .update(comments)
      .set({ likes: sql`${comments.likes} + 1` })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async addCommentReaction(id: string, emoji: string): Promise<Comment | null> {
    const [existingComment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!existingComment) return null;

    const currentReactions = (existingComment.reactions as Record<string, number>) || {};
    const newReactions = {
      ...currentReactions,
      [emoji]: (currentReactions[emoji] || 0) + 1
    };

    const [comment] = await db
      .update(comments)
      .set({ reactions: newReactions })
      .where(eq(comments.id, id))
      .returning();
    
    return comment || null;
  }

  async removeCommentReaction(id: string, emoji: string): Promise<Comment | null> {
    const [existingComment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!existingComment) return null;

    const currentReactions = (existingComment.reactions as Record<string, number>) || {};
    const newReactions = { ...currentReactions };
    
    if (newReactions[emoji] && newReactions[emoji] > 0) {
      newReactions[emoji] -= 1;
      if (newReactions[emoji] === 0) {
        delete newReactions[emoji];
      }
    }

    const [comment] = await db
      .update(comments)
      .set({ reactions: newReactions })
      .where(eq(comments.id, id))
      .returning();
    
    return comment || null;
  }

  async cleanupExpiredPosts(): Promise<void> {
    const now = new Date();
    await db.delete(posts).where(lt(posts.expiresAt, now));
    // Comments will be automatically deleted due to cascade
  }

  // Messaging operations
  async createOrGetConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    // Check if conversation already exists
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
          and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
        )
      )
      .limit(1);

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        participant1Id,
        participant2Id,
      })
      .returning();

    return newConversation;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)))
      .orderBy(desc(conversations.createdAt));
  }

  async sendMessage(message: InsertMessage, senderId: string): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        senderId,
      })
      .returning();

    return newMessage;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createFeedback(feedbackData: InsertFeedback, userId?: string, userInfo?: string): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        ...feedbackData,
        userId,
        userInfo,
      })
      .returning();

    return newFeedback;
  }

  async createPasswordReset(userId: string, token: string, expiresAt: Date): Promise<PasswordReset> {
    const [passwordReset] = await db
      .insert(passwordResets)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();

    return passwordReset;
  }

  async getPasswordReset(token: string): Promise<PasswordReset | undefined> {
    const [passwordReset] = await db
      .select()
      .from(passwordResets)
      .where(and(
        eq(passwordResets.token, token),
        eq(passwordResets.used, false)
      ))
      .limit(1);

    return passwordReset;
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.token, token));
  }

  // Daily question operations
  async createDailyQuestionResponse(responseData: InsertDailyQuestionResponse): Promise<DailyQuestionResponse> {
    const [response] = await db
      .insert(dailyQuestionResponses)
      .values(responseData)
      .returning();
    return response;
  }

  async getTodaysDailyQuestionResponses(): Promise<DailyQuestionResponse[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(dailyQuestionResponses)
      .where(and(
        sql`${dailyQuestionResponses.createdAt} >= ${today.toISOString()}`,
        sql`${dailyQuestionResponses.createdAt} < ${tomorrow.toISOString()}`
      ))
      .orderBy(desc(dailyQuestionResponses.createdAt));
  }

  // User Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(data: InsertUserProfile): Promise<UserProfile> {
    const [profile] = await db.insert(userProfiles).values(data).returning();
    return profile;
  }

  async updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [profile] = await db.update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return profile;
  }

  // Blog operations
  async createBlogPost(postData: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values(postData)
      .returning();
    return post;
  }

  async getBlogPosts(limit = 10, offset = 0, published = true): Promise<BlogPost[]> {
    const query = db.select().from(blogPosts);
    
    if (published !== undefined) {
      const filteredQuery = query.where(eq(blogPosts.published, published));
      return await filteredQuery
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await query
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);
    return post;
  }

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);
    return post;
  }

  async incrementBlogPostViews(id: string): Promise<void> {
    await db
      .update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, id));
  }

  async getFeaturedBlogPosts(limit = 5): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.featured, true), eq(blogPosts.published, true)))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit);
  }

  async getBlogPostsByTag(tag: string, limit = 10): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(and(
        sql`${tag} = ANY(${blogPosts.tags})`,
        eq(blogPosts.published, true)
      ))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit);
  }

  // Admin/Bot operations
  async createUsersInBatch(usersBatch: InsertUser[]): Promise<void> {
    if (usersBatch.length === 0) return;
    await db.insert(users).values(usersBatch);
  }

  async createUserProfilesInBatch(profilesBatch: InsertUserProfile[]): Promise<void> {
    if (profilesBatch.length === 0) return;
    await db.insert(userProfiles).values(profilesBatch);
  }

  async createPostsInBatch(postsBatch: InsertPost[]): Promise<void> {
    if (postsBatch.length === 0) return;
    await db.insert(posts).values(postsBatch);
  }

  async getBotCount(): Promise<number> {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE id LIKE 'bot_%'`);
    return Number(result.rows[0]?.count || 0);
  }

  async getBotPostsCount(): Promise<number> {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM posts WHERE author_id LIKE 'bot_%'`);
    return Number(result.rows[0]?.count || 0);
  }
}

export const storage = new DatabaseStorage();
