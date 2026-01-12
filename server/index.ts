import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupGoogleAuth } from "./googleAuth";
import passport from "passport";
import session from "express-session";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for secure cookies in production

// Session configuration for authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-default-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup Google OAuth authentication
  setupGoogleAuth(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Setup periodic cleanup of expired posts (every 5 minutes)
  setInterval(async () => {
    try {
      await storage.cleanupExpiredPosts();
    } catch (error) {
      console.error('Error during post cleanup:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Setup daily blog content generation (runs every 24 hours)
  const runDailyContentGeneration = async () => {
    try {
      console.log('🚀 Starting daily blog content generation...');
      const { ContentGenerator } = await import('./content-generator');
      const generator = new ContentGenerator();
      const blogPosts = await generator.generateDailyContent();
      
      for (const postData of blogPosts) {
        await storage.createBlogPost(postData);
        console.log(`📝 Published blog post: "${postData.title}"`);
      }
      
      console.log(`✅ Daily content generation complete. Published ${blogPosts.length} posts.`);
    } catch (error) {
      console.error('❌ Error during daily content generation:', error);
    }
  };

  // Run content generation immediately on startup (for testing)
  if (process.env.NODE_ENV === 'development') {
    setTimeout(runDailyContentGeneration, 10000); // Wait 10 seconds after startup
  }

  // Schedule daily content generation (every 24 hours at 6 AM)
  const scheduleDaily = () => {
    const now = new Date();
    const next6AM = new Date();
    next6AM.setHours(6, 0, 0, 0);
    
    // If it's already past 6 AM today, schedule for tomorrow
    if (now.getHours() >= 6) {
      next6AM.setDate(next6AM.getDate() + 1);
    }
    
    const msUntil6AM = next6AM.getTime() - now.getTime();
    
    setTimeout(() => {
      runDailyContentGeneration();
      // Then run every 24 hours
      setInterval(runDailyContentGeneration, 24 * 60 * 60 * 1000);
    }, msUntil6AM);
  };

  scheduleDaily();

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
