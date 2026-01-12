import express from 'express';
import { db } from './db.js';
import { users, posts, userProfiles } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Delhi/NCR locations with coordinates
const LOCATIONS = [
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

// Indian names
const FIRST_NAMES = [
  'Aarav', 'Arjun', 'Aditya', 'Vihaan', 'Vivaan', 'Krishna', 'Aryan', 'Ishaan', 'Shaurya', 'Atharv',
  'Reyansh', 'Ayaan', 'Kabir', 'Yuvaan', 'Shivansh', 'Dhruv', 'Rudra', 'Advait', 'Samarth',
  'Ravi', 'Vikram', 'Rohit', 'Amit', 'Suresh', 'Rajesh', 'Deepak', 'Manoj', 'Sanjay', 'Praveen',
  'Aadhya', 'Ananya', 'Diya', 'Saanvi', 'Anvi', 'Kavya', 'Aanya', 'Kiara', 'Myra', 'Vanya',
  'Sara', 'Ira', 'Pari', 'Avni', 'Riya', 'Navya', 'Shanvi', 'Prisha', 'Aditi', 'Ishika',
  'Priya', 'Neha', 'Pooja', 'Anjali', 'Kavita', 'Sunita', 'Rekha', 'Seema', 'Geeta', 'Meera'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Goyal', 'Mittal',
  'Chopra', 'Kapoor', 'Malhotra', 'Arora', 'Bhatia', 'Khanna', 'Sethi', 'Tiwari', 'Sinha', 'Yadav',
  'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Trivedi', 'Pandya', 'Shukla', 'Vyas',
  'Reddy', 'Rao', 'Nair', 'Pillai', 'Menon', 'Iyer', 'Chandra', 'Prasad', 'Das', 'Ghosh'
];

const POST_TEMPLATES = [
  "Looking for a gym partner to start morning workouts! #gym #workout #fitness #partner",
  "Anyone up for an evening walk in the park? #walk #evening #health #nature",
  "Need a study buddy for competitive exams #study #exams #motivation #education",
  "Looking for someone to practice badminton with #badminton #sports #games #partner",
  "Anyone interested in learning cooking together? #cooking #food #learn #hobby",
  "Want to start a book club in our area #books #reading #bookclub #literature",
  "Looking for a running partner for morning jogs #running #jogging #fitness #morning",
  "Need recommendations for good street food nearby #food #streetfood #recommendations #local",
  "Anyone know a good yoga instructor in the area? #yoga #instructor #health #wellness",
  "Looking for carpool partners to office commute #carpool #commute #office #transport",
  "Want to organize weekend cricket matches #cricket #weekend #sports #team",
  "Anyone interested in learning guitar together? #guitar #music #learn #hobby",
  "Need babysitting help, can exchange favors #babysitting #help #kids #support",
  "Looking for photography enthusiasts for weekend shoots #photography #weekend #hobby #creative",
  "Anyone up for weekend treks nearby Delhi? #trekking #weekend #adventure #nature",
  "Want to start a chess club in the neighborhood #chess #games #club #strategy"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomCoordinate(base: number, variation: number = 0.005): number {
  return Number((base + (Math.random() - 0.5) * variation).toFixed(6));
}

// Admin endpoint to create bots (protected by simple secret)
router.post('/create-bots', async (req, res) => {
  try {
    // Simple protection - you can set this as an environment variable
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

    res.write(`Starting bot creation: ${count} bots in ${totalBatches} batches\n\n`);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const currentBatchSize = Math.min(batchSize, count - (batchNum * batchSize));
      
      res.write(`Batch ${batchNum + 1}/${totalBatches}: Creating ${currentBatchSize} bots...\n`);
      
      const usersBatch: any[] = [];
      const profilesBatch: any[] = [];
      const postsBatch: any[] = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const firstName = getRandomElement(FIRST_NAMES);
        const lastName = getRandomElement(LAST_NAMES);
        const displayName = `${firstName} ${lastName}`;
        const location = getRandomElement(LOCATIONS);
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

        // Create 1-3 posts per bot
        const postsCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < postsCount; j++) {
          const template = getRandomElement(POST_TEMPLATES);
          const lat = generateRandomCoordinate(location.lat);
          const lng = generateRandomCoordinate(location.lng);
          const hashtagMatches = template.match(/#\w+/g) || [];
          const hashtags = hashtagMatches.map(tag => tag.substring(1));

          postsBatch.push({
            content: template,
            authorId: userId,
            authorName: displayName,
            authorInitials: displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            latitude: lat,
            longitude: lng,
            locationName: location.name,
            hashtags,
            likes: Math.floor(Math.random() * 15),
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          });
        }
      }

      // Insert batch data
      await db.insert(users).values(usersBatch);
      await db.insert(userProfiles).values(profilesBatch);
      await db.insert(posts).values(postsBatch);

      totalCreated.users += usersBatch.length;
      totalCreated.profiles += profilesBatch.length;
      totalCreated.posts += postsBatch.length;

      res.write(`✅ Batch ${batchNum + 1} complete: ${usersBatch.length} users, ${postsBatch.length} posts\n`);
      
      // Progress update
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
    res.status(500).json({ error: 'Bot creation failed', details: error.message });
  }
});

// Status endpoint to check bot count
router.get('/bot-status', async (req, res) => {
  try {
    const botUsersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE id LIKE 'bot_%'`);
    const botPostsResult = await db.execute(sql`SELECT COUNT(*) as count FROM posts WHERE author_id LIKE 'bot_%'`);
    
    const botUsers = Number(botUsersResult.rows[0]?.count || 0);
    const botPosts = Number(botPostsResult.rows[0]?.count || 0);
    
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

export default router;