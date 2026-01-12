import { db } from '../server/db.js';
import { users, posts, userProfiles } from '../shared/schema.js';
import type { 
  InsertUserProfile,
} from '../shared/schema.js';

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

// Expanded Indian names for better variety
const FIRST_NAMES = [
  // Popular male names
  'Aarav', 'Arjun', 'Aditya', 'Vihaan', 'Vivaan', 'Krishna', 'Aryan', 'Ishaan', 'Shaurya', 'Atharv',
  'Reyansh', 'Ayaan', 'Kabir', 'Yuvaan', 'Shivansh', 'Dhruv', 'Kian', 'Rudra', 'Advait', 'Samarth',
  'Ravi', 'Vikram', 'Rohit', 'Amit', 'Suresh', 'Rajesh', 'Deepak', 'Manoj', 'Sanjay', 'Praveen',
  'Kiran', 'Nitin', 'Vishal', 'Anand', 'Ramesh', 'Dinesh', 'Mukesh', 'Ashok', 'Vinod', 'Naresh',
  'Dev', 'Harsh', 'Kartik', 'Naman', 'Pavan', 'Siddhant', 'Ujjwal', 'Varun', 'Yash', 'Aman',
  
  // Popular female names
  'Aadhya', 'Ananya', 'Diya', 'Saanvi', 'Anvi', 'Kavya', 'Aanya', 'Kiara', 'Myra', 'Vanya',
  'Sara', 'Ira', 'Pari', 'Avni', 'Riya', 'Navya', 'Shanvi', 'Prisha', 'Aditi', 'Ishika',
  'Priya', 'Neha', 'Pooja', 'Anjali', 'Kavita', 'Sunita', 'Rekha', 'Seema', 'Geeta', 'Meera',
  'Sushma', 'Vandana', 'Shweta', 'Nisha', 'Ritu', 'Kiran', 'Sapna', 'Preeti', 'Jyoti', 'Archana',
  'Aisha', 'Divya', 'Gauri', 'Hema', 'Jaya', 'Kirthi', 'Lata', 'Maya', 'Nandini', 'Payal'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Goyal', 'Mittal',
  'Chopra', 'Kapoor', 'Malhotra', 'Arora', 'Bhatia', 'Khanna', 'Sethi', 'Tiwari', 'Sinha', 'Yadav',
  'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Joshi', 'Trivedi', 'Pandya', 'Shukla', 'Vyas',
  'Reddy', 'Rao', 'Nair', 'Pillai', 'Menon', 'Iyer', 'Chandra', 'Prasad', 'Das', 'Ghosh',
  'Mukherjee', 'Banerjee', 'Chatterjee', 'Roy', 'Bose', 'Dutta', 'Sen', 'Mitra', 'Bhattacharya',
  'Saxena', 'Mishra', 'Pandey', 'Dubey', 'Srivastava', 'Tripathi', 'Chauhan', 'Thakur', 'Goel'
];

// Diverse post templates with realistic Indian social scenarios
const POST_TEMPLATES = [
  "Looking for a gym partner to start morning workouts! DM if interested #gym #workout #fitness #partner #morning",
  "Anyone up for an evening walk in the park? Need motivation #walk #evening #health #nature #motivation",
  "Need a study buddy for competitive exams preparation #study #exams #motivation #education #competitive",
  "Looking for someone to practice badminton with on weekends #badminton #sports #games #partner #weekend",
  "Anyone interested in learning cooking together? Can share recipes #cooking #food #learn #hobby #recipes",
  "Want to start a book club in our area, any book lovers? #books #reading #bookclub #literature #community",
  "Looking for a running partner for morning jogs #running #jogging #fitness #morning #health",
  "Need recommendations for good street food nearby #food #streetfood #recommendations #local #foodie",
  "Anyone know a good yoga instructor in the area? #yoga #instructor #health #wellness #fitness",
  "Looking for carpool partners for office commute to save fuel #carpool #commute #office #transport #eco",
  "Want to organize weekend cricket matches in the colony #cricket #weekend #sports #team #colony",
  "Anyone interested in learning guitar together? Beginner level #guitar #music #learn #hobby #beginner",
  "Need babysitting help occasionally, can exchange favors #babysitting #help #kids #support #exchange",
  "Looking for photography enthusiasts for weekend shoots #photography #weekend #hobby #creative #shoots",
  "Anyone up for weekend treks near Delhi? Adventure seekers #trekking #weekend #adventure #nature #delhi",
  "Want to start a chess club in the neighborhood #chess #games #club #strategy #neighborhood",
  "Looking for dance partner for salsa classes starting soon #dance #salsa #partner #classes #fun",
  "Need help with home repairs, can pay reasonable amount #repair #help #home #maintenance #handyman",
  "Anyone interested in starting a small business venture? #business #startup #entrepreneur #opportunity #venture",
  "Looking for tennis partner at local courts on Sundays #tennis #sports #partner #courts #sunday",
  "Want to organize community cleanup drives monthly #cleanup #community #environment #volunteer #monthly",
  "Anyone know good tutors for kids' homework help? #tutor #education #kids #learning #homework",
  "Looking for someone to share streaming subscriptions #streaming #sharing #entertainment #movies #shows",
  "Need recommendations for good salons/parlours nearby #salon #beauty #recommendations #grooming #parlour",
  "Anyone interested in weekend cycling groups? Morning rides #cycling #weekend #fitness #group #morning",
  "Looking for language exchange partners - Hindi/English #language #exchange #learn #practice #hindi",
  "Want to start organic vegetable gardening together #gardening #vegetables #hobby #organic #terrace",
  "Anyone know reliable mechanics for car servicing? #mechanic #car #service #recommendations #reliable",
  "Looking for pool/billiards playing partners nearby #pool #billiards #games #partner #nearby",
  "Need pet sitting services for weekend trips #pets #sitting #dogs #cats #help #weekend",
  "Anyone up for weekend cooking experiments and food trials? #cooking #weekend #food #experiment #trial",
  "Looking for meditation group for stress relief #meditation #mindfulness #peace #wellness #stress",
  "Want to organize movie nights in society clubhouse #movies #community #entertainment #weekend #society",
  "Anyone learning programming? Can form study group #programming #coding #tech #learn #group",
  "Looking for workout accountability partner at gym #workout #accountability #fitness #motivation #gym",
  "Need recommendations for good doctors/clinics nearby #doctor #health #medical #recommendations #clinic",
  "Anyone up for weekend art and craft workshops? #art #craft #creative #weekend #workshop",
  "Looking for English conversation practice partner #english #practice #language #conversation #fluency",
  "Want to start morning walking group in the colony #walking #morning #health #group #colony",
  "Anyone know experienced plumbers for bathroom renovation? #plumber #home #repair #recommendations #renovation",
  "Looking for carrom board playing partners #carrom #games #indoor #partner #evening",
  "Need study space sharing for exam preparation #study #space #sharing #exams #preparation",
  "Anyone interested in weekend volunteering activities? #volunteering #weekend #community #social #help",
  "Looking for badminton coach for beginners #badminton #coach #beginners #sports #training",
  "Want to organize potluck dinners in the building #potluck #dinner #building #community #food",
  "Anyone up for weekend nature photography walks? #photography #nature #weekend #walks #hobby",
  "Need recommendations for reliable house cleaning help #cleaning #house #help #recommendations #domestic",
  "Looking for someone to practice tabla/harmonium with #tabla #harmonium #music #practice #classical",
  "Anyone interested in weekend temple visits group? #temple #weekend #spiritual #group #devotion",
  "Want to start evening tea discussion groups #tea #evening #discussion #group #community"
];

interface BotStats {
  usersCreated: number;
  profilesCreated: number;
  postsCreated: number;
  errors: string[];
  startTime: Date;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomCoordinate(base: number, variation: number = 0.005): number {
  return Number((base + (Math.random() - 0.5) * variation).toFixed(6));
}

function generateUniqueId(): string {
  return `bot_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
}

async function createBotBatch(batchNumber: number, batchSize: number, stats: BotStats): Promise<void> {
  const startTime = Date.now();
  console.log(`📦 Creating batch ${batchNumber} (${batchSize} bots)...`);
  
  try {
    // Prepare batch data
    const usersBatch: any[] = [];
    const profilesBatch: any[] = [];
    const postsBatch: any[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const displayName = `${firstName} ${lastName}`;
      const location = getRandomElement(LOCATIONS);
      const userId = generateUniqueId();
      const uniqueId = Math.floor(Math.random() * 999999);
      
      // User data
      usersBatch.push({
        id: userId,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${uniqueId}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@localfeat.bot`,
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        passwordHash: 'bot_account_hash',
        firstName,
        lastName
      });
      
      // Profile data
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
    
    // Batch insert operations
    if (usersBatch.length > 0) {
      await db.insert(users).values(usersBatch);
      stats.usersCreated += usersBatch.length;
    }
    
    if (profilesBatch.length > 0) {
      await db.insert(userProfiles).values(profilesBatch);
      stats.profilesCreated += profilesBatch.length;
    }
    
    if (postsBatch.length > 0) {
      await db.insert(posts).values(postsBatch);
      stats.postsCreated += postsBatch.length;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Batch ${batchNumber} completed in ${duration}ms (${usersBatch.length} users, ${postsBatch.length} posts)`);
    
  } catch (error) {
    const errorMsg = `Batch ${batchNumber} failed: ${error}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
    throw error;
  }
}

async function createProductionBots() {
  console.log('🚀 PRODUCTION Bot Creation Script Starting...');
  console.log('📍 Target: Delhi/NCR locations with authentic Indian community content');
  
  const stats: BotStats = {
    usersCreated: 0,
    profilesCreated: 0,
    postsCreated: 0,
    errors: [],
    startTime: new Date()
  };
  
  const totalBots = 5000;
  const batchSize = 50; // Smaller batches for production stability
  const totalBatches = Math.ceil(totalBots / batchSize);
  
  console.log(`📊 Configuration: ${totalBots} bots in ${totalBatches} batches of ${batchSize}`);
  
  try {
    for (let i = 0; i < totalBatches; i++) {
      const currentBatchSize = Math.min(batchSize, totalBots - (i * batchSize));
      await createBotBatch(i + 1, currentBatchSize, stats);
      
      // Progress update every 10 batches
      if ((i + 1) % 10 === 0) {
        const progress = ((i + 1) / totalBatches * 100).toFixed(1);
        const elapsed = (Date.now() - stats.startTime.getTime()) / 1000;
        console.log(`📈 Progress: ${progress}% (${i + 1}/${totalBatches}) - ${elapsed.toFixed(1)}s elapsed`);
      }
      
      // Small delay between batches for production stability
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Final summary
    const totalTime = (Date.now() - stats.startTime.getTime()) / 1000;
    console.log('\n🎉 PRODUCTION BOT CREATION COMPLETED!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Users Created: ${stats.usersCreated.toLocaleString()}`);
    console.log(`👤 Profiles Created: ${stats.profilesCreated.toLocaleString()}`);  
    console.log(`📝 Posts Created: ${stats.postsCreated.toLocaleString()}`);
    console.log(`⏱️  Total Time: ${totalTime.toFixed(1)} seconds`);
    console.log(`⚡ Rate: ${(stats.usersCreated / totalTime).toFixed(1)} users/second`);
    console.log(`❌ Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n🔍 Error Summary:');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✅ Your LocalFeat production app now has a vibrant Indian community!');
    console.log('🏙️  Locations covered: All 15 Delhi/NCR areas');
    console.log('🇮🇳 Authentic names and realistic local content');
    console.log('🔍 Discoverable posts with relevant hashtags');
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error);
    console.log('\n📊 Partial Stats:');
    console.log(`Users Created: ${stats.usersCreated}`);
    console.log(`Posts Created: ${stats.postsCreated}`);
    process.exit(1);
  }
}

// Performance monitoring
process.on('beforeExit', () => {
  console.log('📊 Script execution completed');
});

// Run the script
if (require.main === module) {
  createProductionBots().catch(console.error);
}

export { createProductionBots };