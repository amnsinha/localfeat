#!/bin/bash

# LocalFeat Production Bot Deployment Script
# Creates 5000 authentic Indian bot accounts for production

echo "🚀 LocalFeat Production Bot Deployment"
echo "======================================"
echo "This will create 5000 Indian bot users with ~10k posts across Delhi/NCR"
echo ""

# Check if we're in production environment
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found. Make sure you're running this on production."
    exit 1
fi

echo "✅ Database connection detected"
echo "📍 Target locations: 15 Delhi/NCR areas"
echo "👥 Bot profiles: Authentic Indian names with local bios"
echo "📝 Content: Realistic community posts with hashtags"
echo ""

# Confirm deployment
read -p "Continue with bot creation? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🎬 Starting bot creation..."

# Run the production bot creator
npx tsx scripts/production-bot-creator.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Your LocalFeat app now has a vibrant Indian community!"
    echo "📊 Verification commands:"
    echo "   • Total bots: SELECT COUNT(*) FROM users WHERE id LIKE 'bot_%';"
    echo "   • Posts by location: SELECT location_name, COUNT(*) FROM posts WHERE author_id LIKE 'bot_%' GROUP BY location_name;"
    echo "   • Sample content: SELECT author_name, content FROM posts WHERE author_id LIKE 'bot_%' LIMIT 5;"
else
    echo "❌ Bot creation failed. Check the error logs above."
    exit 1
fi