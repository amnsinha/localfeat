import { storage } from "./storage";
import { randomUUID } from "crypto";

// Realistic fake personas for the bot
const BOT_PERSONAS = [
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

// Realistic post templates categorized by interest
const POST_TEMPLATES: Record<string, string[]> = {
  coffee: [
    "Just discovered this amazing coffee spot - their latte art is incredible! ☕ #coffee",
    "Early morning coffee run complete. Nothing beats starting the day right! #morning #coffee",
    "Anyone know a good place for cold brew around here? The weather is perfect for it #coffee",
    "That first sip of coffee hits different when you find the perfect spot #coffee #morning"
  ],
  food: [
    "Found this hidden gem for lunch today - the tacos are unreal! 🌮 #food",
    "Sunday brunch vibes! Anyone else trying the new place on Main Street? #food #weekend",
    "Late night food cravings hitting hard. Best spot for a quick bite? #food",
    "Home cooking experiment went surprisingly well! Might have to share the recipe #food"
  ],
  gym: [
    "Morning workout done! The gym was surprisingly empty today #gym #morning #fitness",
    "New PR on deadlifts! Feeling stronger every day 💪 #gym #fitness",
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
    "Early bird gets the worm! Beautiful sunrise this morning 🌅 #morning",
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
    "Trail was muddy but totally worth it for these views! 🥾 #hiking #weekend",
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

// Comment templates for engaging with posts
const COMMENT_TEMPLATES = [
  "Love this spot! Thanks for sharing",
  "Adding this to my list 📝",
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

// Generate realistic coordinates within a small area (simulating a neighborhood)
function generateNearbyCoordinates(baseLatitude: number, baseLongitude: number): { latitude: number; longitude: number } {
  // Generate coordinates within ~2km radius
  const latOffset = (Math.random() - 0.5) * 0.02; // ~2km in latitude
  const lngOffset = (Math.random() - 0.5) * 0.02; // ~2km in longitude
  
  return {
    latitude: baseLatitude + latOffset,
    longitude: baseLongitude + lngOffset
  };
}

// Get location name based on coordinates (simplified)
function getLocationName(latitude: number, longitude: number): string {
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
  
  // Use coordinates to deterministically pick an area
  const index = Math.floor((Math.abs(latitude * longitude) * 1000) % areas.length);
  return areas[index];
}

// Select random element from array
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate hashtags based on content
function extractHashtags(content: string): string[] {
  const matches = content.match(/#\w+/g);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

class ActivityBot {
  private isRunning = false;
  private baseCoordinates = { latitude: 40.7128, longitude: -74.0060 }; // Default to NYC

  setLocation(latitude: number, longitude: number) {
    this.baseCoordinates = { latitude, longitude };
  }

  async createBotPost(): Promise<void> {
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
      
      // Create bot user ID (consistent per persona)
      const botUserId = `bot_${persona.initials.toLowerCase()}`;
      
      const postData = {
        content: postTemplate as string,
        authorName: persona.name,
        authorInitials: persona.initials,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationName,
        hashtags
      };

      await storage.createPost(postData, botUserId);
      console.log(`Bot created post by ${persona.name}: "${(postTemplate as string).substring(0, 50)}..."`);
      
    } catch (error) {
      console.error("Error creating bot post:", error);
    }
  }

  async createBotComment(postId: string): Promise<void> {
    try {
      const persona = randomChoice(BOT_PERSONAS);
      const commentText = randomChoice(COMMENT_TEMPLATES);
      
      // Create bot user ID (consistent per persona)
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

  async addRandomReaction(postId: string): Promise<void> {
    try {
      const emojis = ["👍", "❤️", "😂", "🔥", "💯"];
      const emoji = randomChoice(emojis);
      
      await storage.addPostReaction(postId, emoji);
      console.log(`Bot added ${emoji} reaction to post ${postId}`);
      
    } catch (error) {
      console.error("Error adding bot reaction:", error);
    }
  }

  async seedActivity(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("Activity bot starting to seed content...");

    try {
      // Create 2-4 posts with varied timing
      const postCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < postCount; i++) {
        await this.createBotPost();
        
        // Random delay between posts (30 seconds to 2 minutes)
        const delay = Math.random() * 90000 + 30000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Get recent posts and add some engagement
      const recentPosts = await storage.getPosts(
        this.baseCoordinates.latitude,
        this.baseCoordinates.longitude,
        5 // 5km radius
      );

      // Add comments and reactions to some posts
      for (const post of recentPosts.slice(0, 3)) {
        // 70% chance to add a comment
        if (Math.random() < 0.7) {
          await this.createBotComment(post.id);
          
          // Small delay between actions
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // 50% chance to add a reaction
        if (Math.random() < 0.5) {
          await this.addRandomReaction(post.id);
          
          // Small delay between actions
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

    } catch (error) {
      console.error("Error in activity bot seeding:", error);
    } finally {
      this.isRunning = false;
      console.log("Activity bot seeding complete");
    }
  }

  async respondToDailyQuestion(question: string): Promise<void> {
    try {
      const persona = randomChoice(BOT_PERSONAS);
      
      // Simple responses based on persona and question content
      let response = "";
      const questionLower = question.toLowerCase();
      
      if (questionLower.includes("coffee") || questionLower.includes("café")) {
        response = persona.interests.includes("coffee") 
          ? "There's this little place on Main Street with the best espresso I've tried!"
          : "I'm more of a tea person, but my friends love the café downtown";
      } else if (questionLower.includes("saturday") || questionLower.includes("weekend")) {
        response = persona.interests.includes("hiking")
          ? "Planning a morning hike if the weather holds up!"
          : "Probably catching up on some reading and maybe exploring the farmers market";
      } else if (questionLower.includes("restaurant") || questionLower.includes("food")) {
        response = "The new Mediterranean place has been getting great reviews - might give it a try!";
      } else if (questionLower.includes("gym") || questionLower.includes("workout")) {
        response = persona.interests.includes("gym")
          ? "Early morning is definitely the way to go - much less crowded"
          : "I prefer outdoor activities myself, but the gym near the park seems popular";
      } else {
        // Generic positive responses
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
  async maintainActivity(): Promise<void> {
    // Create 1 post every 2-4 hours during low activity
    const interval = Math.random() * 7200000 + 7200000; // 2-4 hours in ms
    
    setTimeout(async () => {
      if (!this.isRunning) {
        await this.createBotPost();
        
        // 30% chance to also respond to daily question
        if (Math.random() < 0.3) {
          // Would need to get current daily question - simplified for now
          await this.respondToDailyQuestion("What's your plan for today?");
        }
      }
      
      // Schedule next maintenance activity
      this.maintainActivity();
    }, interval);
  }
}

export const activityBot = new ActivityBot();

// Auto-start gentle maintenance mode
activityBot.maintainActivity();