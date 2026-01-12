# LocalFeat: Replit Production Deployment Guide

## How to Deploy and Populate Your LocalFeat App

Since Replit Deployments don't provide SSH access, I've built the bot creation system directly into your app as admin endpoints.

## Step 1: Deploy Your App

1. Click the **Deploy** button in your Replit workspace
2. Follow the deployment process 
3. Your app will be live at `https://your-app-name.replit.app`

## Step 2: Populate with 5000 Bots (One-Time Setup)

Once deployed, create your bot community using a simple HTTP request:

### Using curl (Command Line)
```bash
curl -X POST https://your-app-name.replit.app/api/admin/create-bots \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: localfeat-admin-2025" \
  -d '{"count": 5000, "batchSize": 50}'
```

### Using Any HTTP Client (Postman, Insomnia, etc.)
- **URL**: `https://your-app-name.replit.app/api/admin/create-bots`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Admin-Secret: localfeat-admin-2025`
- **Body**: `{"count": 5000, "batchSize": 50}`

### Using Your Browser's Developer Console
```javascript
fetch('/api/admin/create-bots', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Secret': 'localfeat-admin-2025'
  },
  body: JSON.stringify({count: 5000, batchSize: 50})
}).then(response => response.text()).then(console.log)
```

## What Happens During Bot Creation

You'll see real-time progress like this:
```
Starting bot creation: 5000 bots in 100 batches

Batch 1/100: Creating 50 bots...
✅ Batch 1 complete: 50 users, 127 posts
📊 Progress: 1.0%

Batch 2/100: Creating 50 bots...
✅ Batch 2 complete: 50 users, 134 posts
📊 Progress: 2.0%

...

🎉 SUCCESS! Created:
👥 Users: 5,000
📝 Posts: 9,847
🏙️ Locations: 15 Delhi/NCR areas

Your LocalFeat app now has a vibrant Indian community!
```

## Step 3: Verify Your Bot Population

Check the status anytime:
```bash
curl https://your-app-name.replit.app/api/admin/bot-status
```

Expected response:
```json
{
  "botUsers": 5000,
  "botPosts": 9847,
  "ready": true
}
```

## Security Notes

- The admin endpoint is protected with a simple secret key
- Only works once per deployment (won't create duplicates)
- Bot accounts are clearly marked and can't be used for login
- All bot emails use `@localfeat.bot` domain for identification

## What You Get

### 🏙️ **15 Delhi/NCR Locations**
- Pocket 42, Rohini
- Sector 15 Pkt 4, Rohini
- Sector 9, Rohini
- Sector 18G, Rohini
- Sector 19, Dwarka
- Sector 3, Dwarka
- Sector 100, Noida
- DLF Ridgewood, Gurugram
- Model Town & Model Town III
- Mayur Vihar (3 phases)
- Naraina Vihar
- Sarita Vihar

### 👥 **5000 Authentic Indian Users**
- Real Indian first/last names (Aarav Sharma, Priya Patel, etc.)
- Local bios mentioning their area
- Generated avatar images
- Unique contact information

### 📝 **~10,000 Realistic Posts**
- "Looking for gym partner to start morning workouts! #gym #workout #fitness"
- "Anyone up for evening walk in the park? #walk #evening #health"
- "Need study buddy for competitive exams #study #exams #motivation"
- "Want to organize weekend cricket matches #cricket #weekend #sports"

## Troubleshooting

### If the bot creation fails:
1. Check that your deployment is fully online
2. Verify the admin secret is correct
3. Try with a smaller batch size: `{"count": 1000, "batchSize": 25}`

### If you need to recreate bots:
The endpoint checks for existing bots and won't create duplicates. To start fresh, you'd need to manually clear the bot data first.

## Result: Instant Community

Your LocalFeat app launches with an active, engaging community that encourages real users to join and participate from day one!

---

**Ready to Launch**: Deploy → Create Bots → Launch with 5000+ Active Community Members!