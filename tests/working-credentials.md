# Working Test Credentials for LocalFeat

## Authentication Testing

### Demo User Credentials
- **Username:** `demo`
- **Email:** `demo@localfeat.com`
- **Password:** `demo123`

### Test Results ✅

**✅ Login Flow:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "demo", "password": "demo123"}' \
  -c cookies.txt
# Returns: HTTP 200 OK with session cookie
```

**✅ User Profile:**
```bash
curl -X GET http://localhost:5000/api/auth/user -b cookies.txt
# Returns: {"id":"745c49ed-9c78-4fc7-ac23-94c867045445","username":"demo",...}
```

**✅ Post Creation:**
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "content": "Looking for a gym buddy for morning workouts",
    "authorName": "Demo User",
    "authorInitials": "DU",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "locationName": "New Delhi",
    "hashtags": ["gym", "morning"]
  }'
# Returns: HTTP 201 Created with post data
```

**✅ Post Retrieval:**
```bash
curl -X GET "http://localhost:5000/api/posts?latitude=28.6139&longitude=77.2090"
# Returns: HTTP 200 OK with array of posts
```

## Security Validation ✅

**✅ Unauthenticated post creation blocked:**
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'
# Returns: HTTP 401 Unauthorized
```

## Browser Testing
- Navigate to the application
- Click "Login" and use credentials: `demo@localfeat.com` / `demo123`
- Try creating a post - should work perfectly!