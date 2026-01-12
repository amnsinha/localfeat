import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { RegistrationData, LoginData, User } from "@shared/schema";
import type { RequestHandler } from "express";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function registerUser(data: RegistrationData): Promise<User> {
  // Check if user already exists
  const existingUser = await storage.getUserByEmailOrUsername(data.email, data.username);
  if (existingUser) {
    throw new Error("User with this email or username already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const newUser = await storage.createUser({
    username: data.username,
    email: data.email,
    phone: data.phone,
    passwordHash,
    firstName: null,
    lastName: null,
    profileImageUrl: null,
  });

  return newUser;
}

export async function loginUser(data: LoginData): Promise<User | null> {
  // Get user by email or username
  const user = await storage.getUserByEmailOrUsername(data.identifier, data.identifier);
  if (!user) {
    return null;
  }

  // Verify password (skip if user has no password - OAuth users)
  if (!user.passwordHash) {
    return null; // OAuth users should use their OAuth provider
  }
  
  const isValidPassword = await verifyPassword(data.password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  return user;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Extend session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}