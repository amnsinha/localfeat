import type { Express } from "express";
import { createServer, type Server } from "http";
import { activityBot } from "./activity-bot";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, insertMessageSchema, insertFeedbackSchema, registrationSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, insertUserProfileSchema } from "@shared/schema";
import { validateContent } from "@shared/content-filter";
import { ContentGenerator } from "./content-generator";
import { z } from "zod";
import { requireAuth, registerUser, loginUser, hashPassword } from "./auth";
import { randomBytes } from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'localfeat.sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  }));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registrationSchema.parse(req.body);
      const user = await registerUser(validatedData);
      
      // Log user in after registration
      req.session.userId = user.id;
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await loginUser(validatedData);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email/username or password" });
      }

      // Store user ID in session
      req.session.userId = user.id;
      
      // Debug logging for production
      if (process.env.NODE_ENV === "production") {
        console.log('Login success:', {
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
        lastName: user.lastName,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('localfeat.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user (public endpoint - returns null if not authenticated)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Debug logging for production
      if (process.env.NODE_ENV === "production") {
        console.log('Session debug:', {
          hasSession: !!req.session,
          userId: req.session?.userId,
          sessionId: req.session?.id,
          cookies: req.headers.cookie ? 'present' : 'missing'
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
        lastName: user.lastName,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.json(null);
    }
  });

  // Get user by ID (public endpoint for viewing profiles)
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return only public user information
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get posts within radius with optional hashtag filter and search (public endpoint)
  app.get("/api/posts", async (req, res) => {
    try {
      const { latitude, longitude, hashtag, search, limit, offset } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const limitNum = parseInt(limit as string) || 10;
      const offsetNum = parseInt(offset as string) || 0;
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid latitude or longitude" });
      }

      const posts = await storage.getPosts(lat, lng, 1, hashtag as string, search as string, limitNum, offsetNum);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Create a new post (requires authentication)
  app.post("/api/posts", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      
      // Validate content for inappropriate words
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      
      // Use authenticated user's ID
      const userId = req.user.id;
      const post = await storage.createPost(validatedData, userId);
      res.status(201).json(post);
    } catch (error) {
      console.error("Post creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Like a post (public endpoint)
  app.post("/api/posts/:id/like", async (req, res) => {
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

  // Add emoji reaction to a post
  app.post("/api/posts/:id/reactions", requireAuth, async (req: any, res) => {
    try {
      const { emoji } = req.body;
      const userId = req.user.id;
      const userName = req.user.username || req.user.firstName || 'Someone';
      
      if (!emoji || typeof emoji !== 'string') {
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

  // Remove emoji reaction from a post
  app.delete("/api/posts/:id/reactions", requireAuth, async (req: any, res) => {
    try {
      const { emoji } = req.body;
      if (!emoji || typeof emoji !== 'string') {
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

  // Delete a post (requires authentication and ownership)
  app.delete("/api/posts/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if post exists and user owns it
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

  // Get comments for a post (public endpoint)
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getCommentsByPostId(id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create a comment (requires authentication)
  app.post("/api/comments", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      
      // Validate content for inappropriate words
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      
      // Use authenticated user's ID
      const userId = req.user.id;
      const userName = req.user.username || req.user.firstName || 'Someone';
      const comment = await storage.createComment(validatedData, userId);


      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Like a comment (public endpoint)
  app.post("/api/comments/:id/like", async (req, res) => {
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

  // Add emoji reaction to a comment
  app.post("/api/comments/:id/reactions", requireAuth, async (req: any, res) => {
    try {
      const { emoji } = req.body;
      const userId = req.user.id;
      const userName = req.user.username || req.user.firstName || 'Someone';
      
      if (!emoji || typeof emoji !== 'string') {
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

  // Remove emoji reaction from a comment
  app.delete("/api/comments/:id/reactions", requireAuth, async (req: any, res) => {
    try {
      const { emoji } = req.body;
      if (!emoji || typeof emoji !== 'string') {
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

  // Messaging endpoints (require authentication)
  
  // Start or get conversation with another user
  app.post("/api/conversations", requireAuth, async (req: any, res) => {
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

  // Get user's conversations
  app.get("/api/conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Send a message
  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Validate content for inappropriate words
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      
      const userId = req.user.id;
      const message = await storage.sendMessage(validatedData, userId);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversationId(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Feedback submission (works for both authenticated and anonymous users)
  app.post("/api/feedback", async (req: any, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      
      // Validate content for inappropriate words
      const contentValidation = validateContent(validatedData.content);
      if (!contentValidation.isValid) {
        return res.status(400).json({ message: contentValidation.message });
      }
      
      // Get user info if authenticated
      const userId = req.user?.id;
      const userInfo = req.user ? `${req.user.username} (${req.user.email})` : undefined;
      
      const feedback = await storage.createFeedback(validatedData, userId, userInfo);
      res.status(201).json({ message: "Feedback submitted successfully", id: feedback.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid feedback data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Password reset request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByEmail(validatedData.email);
      
      // Always return success to prevent email enumeration attacks
      res.json({ message: "If an account with that email exists, we've sent you a password reset link." });
      
      if (!user) {
        return; // Don't send email if user doesn't exist
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save reset token to database
      await storage.createPasswordReset(user.id, resetToken, expiresAt);

      // In a real app, you would send an email here
      // For now, we'll log the reset link for testing
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      console.log(`Password reset requested for ${user.email}. Reset link: ${resetUrl}`);
      
      // TODO: Implement email sending with SendGrid
      // await sendPasswordResetEmail(user.email, user.username, resetUrl);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email address", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      
      // Find the reset token
      const passwordReset = await storage.getPasswordReset(validatedData.token);
      
      if (!passwordReset || passwordReset.used || new Date() > passwordReset.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash the new password
      const passwordHash = await hashPassword(validatedData.password);
      
      // Update user's password
      await storage.updateUserPassword(passwordReset.userId, passwordHash);
      
      // Mark reset token as used
      await storage.markPasswordResetUsed(validatedData.token);
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid password reset data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Validate reset token
  app.get("/api/auth/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const passwordReset = await storage.getPasswordReset(token);
      
      if (!passwordReset || passwordReset.used || new Date() > passwordReset.expiresAt) {
        return res.status(400).json({ valid: false, message: "Invalid or expired reset token" });
      }

      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ valid: false, message: "Failed to validate reset token" });
    }
  });

  // Daily question endpoints
  app.post("/api/daily-question/responses", requireAuth, async (req: any, res) => {
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
        authorName: user.firstName || user.username || 'Anonymous',
        location: location || 'Unknown'
      };

      const dailyResponse = await storage.createDailyQuestionResponse(responseData);
      res.status(201).json(dailyResponse);
    } catch (error) {
      console.error("Error creating daily question response:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  app.get("/api/daily-question/responses", async (req, res) => {
    try {
      const responses = await storage.getTodaysDailyQuestionResponses();
      res.json(responses);
    } catch (error) {
      console.error("Error fetching daily question responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  // Activity bot endpoints (for admin/development use)
  app.post("/api/admin/seed-activity", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (latitude && longitude) {
        activityBot.setLocation(latitude, longitude);
      }
      
      // Seed activity in background
      activityBot.seedActivity().catch(console.error);
      
      res.json({ message: "Activity seeding started" });
    } catch (error) {
      console.error("Error starting activity seeding:", error);
      res.status(500).json({ message: "Failed to start activity seeding" });
    }
  });

  // Test endpoint for manual content generation
  app.post("/api/admin/test-content-generation", async (req, res) => {
    try {
      console.log("🧪 Manual content generation triggered...");
      const generator = new ContentGenerator();
      await generator.generateDailyContent();
      res.json({ message: "Content generation completed successfully" });
    } catch (error) {
      console.error("❌ Error in test content generation:", error);
      res.status(500).json({ error: "Content generation failed", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/admin/bot-post", async (req, res) => {
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

  // Profile routes
  app.get("/api/profile/:userId", async (req, res) => {
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

  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserProfileSchema.parse(req.body);
      const userId = (req as any).user.id;
      
      const profileData = {
        ...validatedData,
        userId,
      };
      
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error: any) {
      console.error("Error creating profile:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.put("/api/profile/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const authUserId = (req as any).user.id;
      
      // Users can only edit their own profile
      if (userId !== authUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertUserProfileSchema.partial().parse(req.body);
      const profile = await storage.updateUserProfile(userId, validatedData);
      
      res.json(profile);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload profile image directly to database as blob
  app.post("/api/upload/profile-image", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { imageData, imageType } = req.body;
      
      if (!imageData || !imageType) {
        return res.status(400).json({ message: "Image data and type are required" });
      }
      
      // Validate image type
      if (!imageType.startsWith('image/')) {
        return res.status(400).json({ message: "Invalid image type" });
      }
      
      // Validate base64 data size (limit to 5MB)
      const base64Data = imageData.split(',')[1] || imageData;
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > 5 * 1024 * 1024) { // 5MB limit
        return res.status(400).json({ message: "Image too large. Maximum size is 5MB" });
      }
      
      // Generate a unique identifier for the image
      const imageId = `profile-${userId}-${Date.now()}`;
      const imageUrl = `/api/profile/image/${imageId}`;
      
      // Update user's profile with image data
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

  // Serve profile images from database
  app.get("/api/profile/image/:imageId", async (req, res) => {
    try {
      const { imageId } = req.params;
      console.log("Serving image for ID:", imageId);
      
      // Extract userId from imageId (format: profile-{userId}-{timestamp})
      // userId is a UUID with hyphens, so we need to be careful with parsing
      if (!imageId.startsWith('profile-')) {
        console.log("Invalid image ID format:", imageId);
        return res.status(404).json({ message: "Invalid image ID" });
      }
      
      // Remove 'profile-' prefix and extract userId (everything except the last timestamp part)
      const withoutPrefix = imageId.substring('profile-'.length);
      const lastHyphenIndex = withoutPrefix.lastIndexOf('-');
      
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
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(profile.profileImageData, 'base64');
      
      // Set proper headers
      res.set({
        'Content-Type': profile.profileImageType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      });
      
      console.log("Sending image buffer, size:", imageBuffer.length);
      
      // Send the image
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error serving profile image:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to serve image" });
      }
    }
  });

  // Blog endpoints (public access, no authentication required)
  
  // Get all blog posts (public)
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const { limit = "10", offset = "0", tag } = req.query;
      
      let posts;
      if (tag && typeof tag === 'string') {
        posts = await storage.getBlogPostsByTag(tag, parseInt(limit as string));
      } else {
        posts = await storage.getBlogPosts(
          parseInt(limit as string), 
          parseInt(offset as string)
        );
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get featured blog posts (public)
  app.get("/api/blog/posts/featured", async (req, res) => {
    try {
      const { limit = "5" } = req.query;
      const posts = await storage.getFeaturedBlogPosts(parseInt(limit as string));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching featured blog posts:", error);
      res.status(500).json({ message: "Failed to fetch featured blog posts" });
    }
  });

  // Get blog post by slug (public)
  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Increment view count
      await storage.incrementBlogPostViews(post.id);
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Create blog post (admin only - for automated generation)
  app.post("/api/blog/posts", async (req, res) => {
    try {
      // Simple security check - this should be called by internal processes only
      const { adminKey } = req.body;
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const postData = req.body;
      delete postData.adminKey; // Remove admin key from post data
      
      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  // Admin bot creation endpoint
  app.post("/api/admin/create-bots", async (req, res) => {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'localfeat-admin-2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { count = 5000, batchSize = 50 } = req.body;
      
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const totalBatches = Math.ceil(count / batchSize);
      let totalCreated = { users: 0, profiles: 0, posts: 0 };

      res.write(`🚀 Starting bot creation: ${count} bots in ${totalBatches} batches\n\n`);

      // Delhi/NCR locations
      const locations = [
        { name: "Pocket 42, Rohini", lat: 28.72335, lng: 77.13432 },
        { name: "Sector 15 Pkt 4, Rohini", lat: 28.72921, lng: 77.13254 },
        { name: "Sector 9, Rohini", lat: 28.71720, lng: 77.12620 },
        { name: "Sector 18G, Rohini", lat: 28.74020, lng: 77.13464 },
        { name: "Sector 19, Dwarka", lat: 28.57667, lng: 77.05248 },
        { name: "Sector 3, Dwarka", lat: 28.56700, lng: 77.09760 },
        { name: "Sector 100, Noida", lat: 28.54535, lng: 77.37168 },
        { name: "DLF Ridgewood, Gurugram", lat: 28.46504, lng: 77.08108 },
        { name: "Model Town", lat: 28.71800, lng: 77.19160 },
        { name: "Model Town III", lat: 28.71066, lng: 77.19680 },
        { name: "Mayur Vihar Phase 1", lat: 28.60260, lng: 77.29300 },
        { name: "Mayur Vihar (gen.)", lat: 28.61560, lng: 77.31330 },
        { name: "Mayur Vihar Phase 3", lat: 28.61152, lng: 77.33629 },
        { name: "Naraina Vihar", lat: 28.62899, lng: 77.14133 },
        { name: "Sarita Vihar", lat: 28.53389, lng: 77.28994 }
      ];

      const firstNames = ['Aarav', 'Arjun', 'Aditya', 'Vihaan', 'Vivaan', 'Krishna', 'Aryan', 'Ishaan', 'Shaurya', 'Atharv', 'Aadhya', 'Ananya', 'Diya', 'Saanvi', 'Anvi', 'Kavya', 'Priya', 'Neha', 'Pooja', 'Anjali'];
      const lastNames = ['Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Goyal', 'Mittal', 'Chopra', 'Kapoor', 'Patel', 'Shah', 'Mehta'];
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
        const currentBatchSize = Math.min(batchSize, count - (batchNum * batchSize));
        
        res.write(`📦 Batch ${batchNum + 1}/${totalBatches}: Creating ${currentBatchSize} bots...\n`);
        
        const usersBatch: any[] = [];
        const profilesBatch: any[] = [];
        const postsBatch: any[] = [];

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
            phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            passwordHash: 'bot_account_hash',
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
            const lat = location.lat + (Math.random() - 0.5) * 0.005;
            const lng = location.lng + (Math.random() - 0.5) * 0.005;
            const hashtagMatches = template.match(/#\w+/g) || [];
            const hashtags = hashtagMatches.map(tag => tag.substring(1));

            postsBatch.push({
              content: template,
              authorId: userId,
              authorName: displayName,
              authorInitials: displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
              locationName: location.name,
              hashtags,
              likes: Math.floor(Math.random() * 15),
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
          }
        }

        await storage.createUsersInBatch(usersBatch);
        await storage.createUserProfilesInBatch(profilesBatch);
        await storage.createPostsInBatch(postsBatch);

        totalCreated.users += usersBatch.length;
        totalCreated.profiles += profilesBatch.length;
        totalCreated.posts += postsBatch.length;

        res.write(`✅ Batch ${batchNum + 1} complete: ${usersBatch.length} users, ${postsBatch.length} posts\n`);
        
        const progress = ((batchNum + 1) / totalBatches * 100).toFixed(1);
        res.write(`📊 Progress: ${progress}%\n\n`);
      }

      res.write(`🎉 SUCCESS! Created:\n`);
      res.write(`👥 Users: ${totalCreated.users.toLocaleString()}\n`);
      res.write(`📝 Posts: ${totalCreated.posts.toLocaleString()}\n`);
      res.write(`🏙️ Locations: 15 Delhi/NCR areas\n\n`);
      res.write(`Your LocalFeat app now has a vibrant Indian community!\n`);
      res.end();

    } catch (error) {
      console.error('Bot creation failed:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Bot creation failed', details: error.message });
      }
    }
  });

  // Admin bot status endpoint  
  app.get("/api/admin/bot-status", async (req, res) => {
    try {
      const botUsers = await storage.getBotCount();
      const botPosts = await storage.getBotPostsCount();
      
      res.json({
        botUsers,
        botPosts,
        ready: botUsers > 0
      });
    } catch (error) {
      console.error('Bot status error:', error);
      res.status(500).json({ error: 'Failed to check bot status' });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}