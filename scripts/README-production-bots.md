# Production Bot Creation Guide

## Overview
This script creates 5000 authentic Indian bot accounts with realistic posts across 15 Delhi/NCR locations for your LocalFeat production deployment.

## Features
- **Optimized for Production**: Smaller batch sizes (50 vs 100) for better stability
- **Error Handling**: Comprehensive error tracking and recovery
- **Performance Monitoring**: Real-time progress tracking and performance metrics
- **Authentic Data**: Realistic Indian names and local community content
- **Geographic Distribution**: Even distribution across all Delhi/NCR locations

## Usage

### After Production Deployment:

1. **SSH/Terminal Access to Production**
```bash
# Navigate to your project directory
cd /path/to/your/localfeat-app

# Run the production bot creation script
npx tsx scripts/production-bot-creator.ts
```

2. **Monitor Progress**
The script provides real-time feedback:
- Batch completion status
- Performance metrics (users/second)
- Progress percentage
- Error reporting

## Expected Results
- **5000 Bot Users**: With authentic Indian first/last names
- **5000 User Profiles**: With local bios and avatar images
- **~10,000 Posts**: Realistic community content with hashtags
- **15 Locations**: Even distribution across Delhi/NCR areas
- **Completion Time**: 8-12 minutes depending on database performance

## Location Coverage
- Pocket 42, Rohini
- Sector 15 Pkt 4, Rohini  
- Sector 9, Rohini
- Sector 18G, Rohini
- Sector 19, Dwarka
- Sector 3, Dwarka
- Sector 100, Noida
- DLF Ridgewood, Gurugram
- Model Town
- Model Town III
- Mayur Vihar Phase 1
- Mayur Vihar (gen.)
- Mayur Vihar Phase 3
- Naraina Vihar
- Sarita Vihar

## Sample Generated Content
- "Looking for a gym partner to start morning workouts! #gym #workout #fitness"
- "Anyone up for evening walk in the park? #walk #evening #health"  
- "Need study buddy for competitive exams #study #exams #motivation"
- "Want to organize weekend cricket matches #cricket #weekend #sports"

## Performance Optimizations
- **Batch Processing**: 50 users per batch for optimal memory usage
- **Connection Pooling**: Efficient database connection management
- **Error Recovery**: Individual batch failure doesn't stop entire process
- **Memory Efficient**: Processes data in chunks to avoid memory issues

## Verification Commands
After completion, verify the data:

```sql
-- Check total bot users
SELECT COUNT(*) FROM users WHERE id LIKE 'bot_%';

-- Check posts distribution by location  
SELECT location_name, COUNT(*) as posts 
FROM posts WHERE author_id LIKE 'bot_%' 
GROUP BY location_name 
ORDER BY posts DESC;

-- Check sample posts
SELECT author_name, content, hashtags 
FROM posts WHERE author_id LIKE 'bot_%' 
LIMIT 10;
```

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure DATABASE_URL is properly configured
2. **Memory Limits**: Script uses small batches to prevent memory issues
3. **Timeout**: Increase database timeout settings if needed

### Error Recovery:
The script tracks progress and can be safely restarted if interrupted. It will skip existing bot users to avoid duplicates.

## Security Notes
- Bot accounts use placeholder passwords and cannot be used for authentication
- All bot emails use `@localfeat.bot` domain for easy identification
- Bot posts are clearly identifiable for content moderation if needed

---

**Ready for Production**: This script is optimized for production environments and will give your LocalFeat app an active, engaging community from day one!