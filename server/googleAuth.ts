import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { Express } from "express";

export function setupGoogleAuth(app: Express) {
  // Check if Google OAuth credentials are available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not found. Google login will be disabled.");
    return;
  }

  // Google OAuth Strategy - production with localfeat.com (non-www)
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "https://localfeat.com/auth/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract user information from Google profile
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const profileImageUrl = profile.photos?.[0]?.value;

      if (!email) {
        return done(new Error("No email found in Google profile"), false);
      }

      // Check if user already exists by email
      let user = await storage.getUserByEmailOrUsername(email, "");
      
      if (user) {
        // Update user with Google info if not already set
        if (!user.firstName && firstName) {
          user = await storage.updateUser(user.id, {
            firstName,
            lastName,
            profileImageUrl
          });
        }
      } else {
        // Create new user with Google information
        const username = `${firstName?.toLowerCase() || 'user'}${Date.now()}`;
        
        user = await storage.createUser({
          username,
          email,
          phone: null,
          passwordHash: null, // Google OAuth users don't need a password
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

  // Google OAuth routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth' }),
    (req, res) => {
      // Store user ID in session
      if (req.user) {
        req.session.userId = (req.user as any).id;
      }
      
      // Successful authentication, redirect to home
      res.redirect('/');
    }
  );

  // Production callback route
  app.get('/auth/callback', 
    passport.authenticate('google', { failureRedirect: '/auth' }),
    (req, res) => {
      // Store user ID in session
      if (req.user) {
        req.session.userId = (req.user as any).id;
      }
      
      // Successful authentication, redirect to home
      res.redirect('/');
    }
  );
}