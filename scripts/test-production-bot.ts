import { db } from '../server/db.js';
import { users, posts, userProfiles } from '../shared/schema.js';

async function testProductionBotCreation() {
  console.log('🧪 Testing production bot creation with 5 bots...');
  
  try {
    // Create a small test batch
    const testUsers = [];
    const testProfiles = [];
    const testPosts = [];
    
    for (let i = 0; i < 5; i++) {
      const userId = `test_bot_${Date.now()}_${i}`;
      const firstName = `Test${i}`;
      const lastName = 'User';
      const displayName = `${firstName} ${lastName}`;
      
      testUsers.push({
        id: userId,
        username: `testuser${i}${Date.now()}`,
        email: `test${i}.${Date.now()}@localfeat.bot`,
        phone: `+919999999${i.toString().padStart(3, '0')}`,
        passwordHash: 'test_hash',
        firstName,
        lastName
      });
      
      testProfiles.push({
        userId,
        displayName,
        bio: 'Test user profile',
        profileImageUrl: `https://ui-avatars.com/api/?name=${displayName}`
      });
      
      testPosts.push({
        content: `Test post ${i} #test #production`,
        authorId: userId,
        authorName: displayName,
        authorInitials: 'TU',
        latitude: 28.7041,
        longitude: 77.1025,
        locationName: 'Test Location',
        hashtags: ['test', 'production'],
        likes: i
      });
    }
    
    // Insert test data
    console.log('📝 Inserting test users...');
    await db.insert(users).values(testUsers);
    
    console.log('👤 Inserting test profiles...');
    await db.insert(userProfiles).values(testProfiles);
    
    console.log('📄 Inserting test posts...');
    await db.insert(posts).values(testPosts);
    
    console.log('✅ Test successful! Production script should work.');
    
    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await db.delete(posts).where(sql`author_id LIKE 'test_bot_%'`);
    await db.delete(userProfiles).where(sql`user_id LIKE 'test_bot_%'`);
    await db.delete(users).where(sql`id LIKE 'test_bot_%'`);
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Import sql for cleanup
import { sql } from 'drizzle-orm';

testProductionBotCreation().catch(console.error);