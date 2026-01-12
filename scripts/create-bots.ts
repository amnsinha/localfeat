import { db } from '../server/db.js';
import { users, posts, userProfiles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

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

// Indian first names
const FIRST_NAMES = [
  // Male names
  'Aarav', 'Arjun', 'Aditya', 'Vihaan', 'Vivaan', 'Krishna', 'Aryan', 'Ishaan', 'Shaurya', 'Atharv',
  'Reyansh', 'Ayaan', 'Kabir', 'Yuvaan', 'Shivansh', 'Dhruv', 'Kian', 'Rudra', 'Advait', 'Samarth',
  'Ravi', 'Vikram', 'Rohit', 'Amit', 'Suresh', 'Rajesh', 'Deepak', 'Manoj', 'Sanjay', 'Praveen',
  'Kiran', 'Nitin', 'Vishal', 'Anand', 'Ramesh', 'Dinesh', 'Mukesh', 'Ashok', 'Vinod', 'Naresh',
  
  // Female names
  'Aadhya', 'Ananya', 'Diya', 'Saanvi', 'Anvi', 'Kavya', 'Aanya', 'Kiara', 'Myra', 'Vanya',
  'Sara', 'Ira', 'Pari', 'Avni', 'Riya', 'Navya', 'Shanvi', 'Prisha', 'Aditi', 'Ishika',
  'Priya', 'Neha', 'Pooja', 'Anjali', 'Kavita', 'Sunita', 'Rekha', 'Seema', 'Geeta', 'Meera',
  'Sushma', 'Vandana', 'Shweta', 'Nisha', 'Ritu', 'Kiran', 'Sapna', 'Preeti', 'Jyoti', 'Archana'
];

// Indian last names
const LAST_NAMES = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Goyal', 'Mittal',
  'Chopra', 'Kapoor', 'Malhotra', 'Arora', 'Bhatia', 'Khanna', 'Sethi', 'Tiwari', 'Sinha', 'Yadav',
  'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Trivedi', 'Pandya', 'Shukla', 'Vyas',
  'Reddy', 'Rao', 'Nair', 'Pillai', 'Menon', 'Iyer', 'Chandra', 'Prasad', 'Das', 'Ghosh',
  'Mukherjee', 'Banerjee', 'Chatterjee', 'Roy', 'Bose', 'Dutta', 'Sen', 'Mitra', 'Bhattacharya'
];

// Post templates with hashtags
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
  "Want to start a chess club in the neighborhood #chess #games #club #strategy",
  "Looking for dance partner for salsa classes #dance #salsa #partner #classes",
  "Need help with home repairs, can pay #repair #help #home #maintenance",
  "Anyone interested in starting a small business? #business #startup #entrepreneur #opportunity",
  "Looking for tennis partner at local courts #tennis #sports #partner #courts",
  "Want to organize community cleanup drives #cleanup #community #environment #volunteer",
  "Anyone know good tutors for kids? #tutor #education #kids #learning",
  "Looking for someone to share Netflix account #netflix #sharing #entertainment #movies",
  "Need recommendations for good salons nearby #salon #beauty #recommendations #grooming",
  "Anyone interested in weekend cycling groups? #cycling #weekend #fitness #group",
  "Looking for language exchange partners #language #exchange #learn #practice",
  "Want to start vegetable gardening together #gardening #vegetables #hobby #organic",
  "Anyone know good mechanics in the area? #mechanic #car #service #recommendations",
  "Looking for pool/billiards playing partners #pool #billiards #games #partner",
  "Need pet sitting services, can reciprocate #pets #sitting #dogs #cats #help",
  "Anyone up for weekend cooking experiments? #cooking #weekend #food #experiment",
  "Looking for meditation group nearby #meditation #mindfulness #peace #wellness",
  "Want to organize movie nights in community #movies #community #entertainment #weekend",
  "Anyone interested in learning new programming languages? #programming #coding #tech #learn",
  "Looking for workout accountability partner #workout #accountability #fitness #motivation",
  "Need recommendations for good doctors nearby #doctor #health #medical #recommendations",
  "Anyone up for weekend art and craft sessions? #art #craft #creative #weekend",
  "Looking for someone to practice English conversation #english #practice #language #conversation",
  "Want to start morning walking group #walking #morning #health #group",
  "Anyone know good plumbers in the locality? #plumber #home #repair #recommendations"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomCoordinate(base: number, variation: number = 0.01): number {
  return base + (Math.random() - 0.5) * variation;
}

async function createBot(): Promise<{ userId: string, location: typeof LOCATIONS[0] }> {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  const displayName = `${firstName} ${lastName}`;
  const location = getRandomElement(LOCATIONS);
  
  // Generate a random user ID for the bot
  const userId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const randomSuffix = Math.floor(Math.random() * 999999);
  
  // Create user
  await db.insert(users).values({
    id: userId,
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomSuffix}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomSuffix}@localfeat.bot`,
    phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Random Indian phone number
    passwordHash: 'bot_account', // Placeholder for bot accounts
    firstName,
    lastName
  });
  
  // Create user profile
  await db.insert(userProfiles).values({
    userId,
    displayName,
    bio: `Local resident of ${location.name}`,
    profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
  });

  return { userId, location };
}

async function createBotPost(userId: string, location: typeof LOCATIONS[0]): Promise<void> {
  const template = getRandomElement(POST_TEMPLATES);
  const lat = generateRandomCoordinate(location.lat, 0.005);
  const lng = generateRandomCoordinate(location.lng, 0.005);
  
  // Extract hashtags from template
  const hashtagMatches = template.match(/#\w+/g) || [];
  const hashtags = hashtagMatches.map(tag => tag.substring(1));
  
  // Get user profile for author name and initials
  const userProfile = await getUserProfile(userId);
  
  await db.insert(posts).values({
    content: template,
    authorId: userId,
    authorName: userProfile.displayName,
    authorInitials: userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase(),
    latitude: lat,
    longitude: lng,
    locationName: location.name,
    hashtags,
    likes: Math.floor(Math.random() * 10),
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last week
  });
}

async function getUserProfile(userId: string): Promise<{ displayName: string }> {
  const profile = await db.select({ displayName: userProfiles.displayName }).from(userProfiles).where(eq(userProfiles.userId, userId));
  return profile[0] ? { displayName: profile[0].displayName || 'Unknown User' } : { displayName: 'Unknown User' };
}

async function createBotsWithPosts() {
  console.log('🤖 Starting to create 5000 bots with posts...');
  
  const batchSize = 100;
  const totalBots = 5000;
  
  for (let i = 0; i < totalBots; i += batchSize) {
    const currentBatch = Math.min(batchSize, totalBots - i);
    console.log(`📝 Creating batch ${Math.floor(i / batchSize) + 1}: bots ${i + 1}-${i + currentBatch}`);
    
    const promises: Promise<void>[] = [];
    for (let j = 0; j < currentBatch; j++) {
      promises.push(
        createBot().then(async ({ userId, location }) => {
          // Each bot creates 1-3 posts
          const postsCount = Math.floor(Math.random() * 3) + 1;
          for (let k = 0; k < postsCount; k++) {
            await createBotPost(userId, location);
          }
        })
      );
    }
    
    await Promise.all(promises);
    console.log(`✅ Completed batch ${Math.floor(i / batchSize) + 1}`);
    
    // Small delay between batches to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Successfully created 5000 bots with posts across Delhi/NCR locations!');
}

// Run the script
createBotsWithPosts().catch(console.error);