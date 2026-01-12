import { db } from '../server/db.js';
import { users, posts, userProfiles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { writeFileSync } from 'fs';

async function exportBotData() {
  console.log('🔄 Exporting bot data...');
  
  // Export bot users
  const botUsers = await db.select().from(users);
  const filteredBotUsers = botUsers.filter(user => user.id.startsWith('bot_'));
  console.log(`📊 Found ${filteredBotUsers.length} bot users`);
  
  // Export bot profiles  
  const botProfiles = await db.select().from(userProfiles);
  const filteredBotProfiles = botProfiles.filter(profile => profile.userId.startsWith('bot_'));
  console.log(`📊 Found ${filteredBotProfiles.length} bot profiles`);
  
  // Export bot posts
  const botPosts = await db.select().from(posts);
  const filteredBotPosts = botPosts.filter(post => post.authorId.startsWith('bot_'));
  console.log(`📊 Found ${filteredBotPosts.length} bot posts`);
  
  // Create export data
  const exportData = {
    users: filteredBotUsers,
    profiles: filteredBotProfiles,
    posts: filteredBotPosts,
    exported_at: new Date().toISOString(),
    total_records: filteredBotUsers.length + filteredBotProfiles.length + filteredBotPosts.length
  };
  
  // Write to file
  writeFileSync('bot-data-export.json', JSON.stringify(exportData, null, 2));
  
  // Generate SQL insert statements
  let sqlScript = '-- Bot Data Export SQL Script\n\n';
  
  // Users
  sqlScript += '-- Insert Bot Users\n';
  filteredBotUsers.forEach(user => {
    sqlScript += `INSERT INTO users (id, username, email, phone, password_hash, first_name, last_name) VALUES ('${user.id}', '${user.username}', '${user.email}', '${user.phone}', '${user.passwordHash}', '${user.firstName}', '${user.lastName}');\n`;
  });
  
  sqlScript += '\n-- Insert Bot Profiles\n';
  filteredBotProfiles.forEach(profile => {
    sqlScript += `INSERT INTO user_profiles (user_id, display_name, bio, profile_image_url) VALUES ('${profile.userId}', '${profile.displayName}', '${profile.bio}', '${profile.profileImageUrl}');\n`;
  });
  
  sqlScript += '\n-- Insert Bot Posts\n';
  filteredBotPosts.forEach(post => {
    const hashtags = JSON.stringify(post.hashtags).replace(/'/g, "''");
    sqlScript += `INSERT INTO posts (id, content, author_id, author_name, author_initials, latitude, longitude, location_name, hashtags, likes, created_at) VALUES ('${post.id}', '${post.content.replace(/'/g, "''")}', '${post.authorId}', '${post.authorName}', '${post.authorInitials}', ${post.latitude}, ${post.longitude}, '${post.locationName}', '${hashtags}'::json, ${post.likes}, '${post.createdAt?.toISOString()}');\n`;
  });
  
  writeFileSync('bot-data-export.sql', sqlScript);
  
  console.log('✅ Export complete:');
  console.log('📄 bot-data-export.json (JSON format)');
  console.log('📄 bot-data-export.sql (SQL format)');
  console.log(`📊 Total records: ${exportData.total_records}`);
}

exportBotData().catch(console.error);