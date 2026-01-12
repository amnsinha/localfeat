const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

describe('Post Creation Flow', () => {
  let baseUrl = 'http://localhost:5000';
  
  // Test 1: User authentication
  test('User can authenticate successfully', async () => {
    const loginResponse = await execAsync(`curl -s -X POST ${baseUrl}/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"identifier": "demo", "password": "demo123"}' \
      -c test-cookies.txt \
      -w "%{http_code}"`);
    
    console.log('Login Response:', loginResponse.stdout);
    expect(loginResponse.stdout).toContain('200');
  });

  // Test 2: Authenticated user session check
  test('Authenticated user can fetch profile', async () => {
    const userResponse = await execAsync(`curl -s -X GET ${baseUrl}/api/auth/user \
      -b test-cookies.txt \
      -w "%{http_code}"`);
    
    console.log('User Profile Response:', userResponse.stdout);
    expect(userResponse.stdout).not.toContain('null');
  });

  // Test 3: Post creation with authentication
  test('Authenticated user can create post', async () => {
    const postData = {
      content: "Looking for a gym buddy for morning workouts",
      authorName: "Test User",
      authorInitials: "TU",
      latitude: 28.6139,
      longitude: 77.2090,
      locationName: "New Delhi",
      hashtags: ["gym", "morning"]
    };

    const postResponse = await execAsync(`curl -s -X POST ${baseUrl}/api/posts \
      -H "Content-Type: application/json" \
      -b test-cookies.txt \
      -d '${JSON.stringify(postData)}' \
      -w "%{http_code}"`);
    
    console.log('Post Creation Response:', postResponse.stdout);
    expect(postResponse.stdout).toContain('201');
  });

  // Test 4: Post creation without authentication should fail
  test('Unauthenticated user cannot create post', async () => {
    const postData = {
      content: "This should fail",
      authorName: "Anon",
      authorInitials: "AN",
      latitude: 28.6139,
      longitude: 77.2090,
      locationName: "New Delhi",
      hashtags: ["test"]
    };

    const postResponse = await execAsync(`curl -s -X POST ${baseUrl}/api/posts \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify(postData)}' \
      -w "%{http_code}"`);
    
    console.log('Unauthorized Post Response:', postResponse.stdout);
    expect(postResponse.stdout).toContain('401');
  });

  // Test 5: Posts can be retrieved
  test('Posts can be retrieved with location', async () => {
    const postsResponse = await execAsync(`curl -s -X GET "${baseUrl}/api/posts?latitude=28.6139&longitude=77.2090" \
      -w "%{http_code}"`);
    
    console.log('Posts Retrieval Response:', postsResponse.stdout);
    expect(postsResponse.stdout).toContain('200');
  });
});