/**
 * Comprehensive API Test Suite for LocalFeat
 * Tests all endpoints including authentication, posts, comments, and messaging
 */

const BASE_URL = 'http://localhost:5000';

// Test utilities
const makeRequest = async (method, endpoint, data = null, cookies = '') => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json().catch(() => null);
  
  return {
    status: response.status,
    data: responseData,
    cookies: response.headers.get('set-cookie') || ''
  };
};

const log = (testName, result) => {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (!result.passed && result.error) {
    console.log(`   Error: ${result.error}`);
  }
  if (result.data) {
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
  }
};

// Test data
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  phone: '+1234567890',
  password: 'testpassword123'
};

const testPost = {
  content: 'Test post for API testing #test #api',
  authorName: 'Test Author',
  authorInitials: 'TA',
  latitude: 40.7128,
  longitude: -74.0060,
  locationName: 'Test Location, NY',
  hashtags: ['test', 'api']
};

const testComment = {
  content: 'This is a test comment for API testing',
  authorName: 'Test Commenter',
  authorInitials: 'TC'
};

// Test suite
const runTests = async () => {
  console.log('🚀 Starting LocalFeat API Test Suite\n');
  
  let userCookies = '';
  let testPostId = '';
  let testCommentId = '';
  
  // ===== AUTHENTICATION TESTS =====
  console.log('📝 AUTHENTICATION TESTS');
  
  // Test 1: Get user when not authenticated
  try {
    const result = await makeRequest('GET', '/api/auth/user');
    log('Get user when not authenticated', {
      passed: result.status === 200 && result.data === null,
      data: result.data
    });
  } catch (error) {
    log('Get user when not authenticated', { passed: false, error: error.message });
  }
  
  // Test 2: Register new user
  try {
    const result = await makeRequest('POST', '/api/auth/register', testUser);
    log('Register new user', {
      passed: result.status === 201 && result.data.username === testUser.username,
      data: result.data
    });
    if (result.cookies) {
      userCookies = result.cookies;
    }
  } catch (error) {
    log('Register new user', { passed: false, error: error.message });
  }
  
  // Test 3: Register duplicate user (should fail)
  try {
    const result = await makeRequest('POST', '/api/auth/register', testUser);
    log('Register duplicate user (should fail)', {
      passed: result.status === 400,
      data: result.data
    });
  } catch (error) {
    log('Register duplicate user (should fail)', { passed: false, error: error.message });
  }
  
  // Test 4: Login with valid credentials
  try {
    const loginData = { identifier: testUser.email, password: testUser.password };
    const result = await makeRequest('POST', '/api/auth/login', loginData);
    log('Login with valid credentials', {
      passed: result.status === 200 && result.data.username === testUser.username,
      data: result.data
    });
    if (result.cookies) {
      userCookies = result.cookies;
    }
  } catch (error) {
    log('Login with valid credentials', { passed: false, error: error.message });
  }
  
  // Test 5: Login with invalid credentials
  try {
    const invalidLogin = { identifier: testUser.email, password: 'wrongpassword' };
    const result = await makeRequest('POST', '/api/auth/login', invalidLogin);
    log('Login with invalid credentials (should fail)', {
      passed: result.status === 401,
      data: result.data
    });
  } catch (error) {
    log('Login with invalid credentials (should fail)', { passed: false, error: error.message });
  }
  
  // Test 6: Get user when authenticated
  try {
    const result = await makeRequest('GET', '/api/auth/user', null, userCookies);
    log('Get user when authenticated', {
      passed: result.status === 200 && result.data && result.data.username === testUser.username,
      data: result.data
    });
  } catch (error) {
    log('Get user when authenticated', { passed: false, error: error.message });
  }
  
  // ===== POSTS TESTS =====
  console.log('\n📮 POSTS TESTS');
  
  // Test 7: Get posts with valid coordinates
  try {
    const result = await makeRequest('GET', `/api/posts?latitude=${testPost.latitude}&longitude=${testPost.longitude}`);
    log('Get posts with valid coordinates', {
      passed: result.status === 200 && Array.isArray(result.data),
      data: `Found ${result.data?.length || 0} posts`
    });
  } catch (error) {
    log('Get posts with valid coordinates', { passed: false, error: error.message });
  }
  
  // Test 8: Get posts without coordinates (should fail)
  try {
    const result = await makeRequest('GET', '/api/posts');
    log('Get posts without coordinates (should fail)', {
      passed: result.status === 400,
      data: result.data
    });
  } catch (error) {
    log('Get posts without coordinates (should fail)', { passed: false, error: error.message });
  }
  
  // Test 9: Create new post (requires authentication)
  try {
    const result = await makeRequest('POST', '/api/posts', testPost, userCookies);
    log('Create new post (authenticated)', {
      passed: result.status === 201 && result.data.content === testPost.content,
      data: result.data
    });
    if (result.data && result.data.id) {
      testPostId = result.data.id;
    }
  } catch (error) {
    log('Create new post (authenticated)', { passed: false, error: error.message });
  }
  
  // Test 10: Create post without authentication (should fail)
  try {
    const result = await makeRequest('POST', '/api/posts', testPost);
    log('Create post without authentication (should fail)', {
      passed: result.status === 401,
      data: result.data
    });
  } catch (error) {
    log('Create post without authentication (should fail)', { passed: false, error: error.message });
  }
  
  // Test 11: Create post with invalid data
  try {
    const invalidPost = { content: '', latitude: 'invalid', longitude: 'invalid' };
    const result = await makeRequest('POST', '/api/posts', invalidPost, userCookies);
    log('Create post with invalid data (should fail)', {
      passed: result.status === 400,
      data: result.data
    });
  } catch (error) {
    log('Create post with invalid data (should fail)', { passed: false, error: error.message });
  }
  
  // Test 12: Like a post
  if (testPostId) {
    try {
      const result = await makeRequest('POST', `/api/posts/${testPostId}/like`, null, userCookies);
      log('Like a post', {
        passed: result.status === 200 && result.data.id === testPostId,
        data: result.data
      });
    } catch (error) {
      log('Like a post', { passed: false, error: error.message });
    }
  }
  
  // Test 13: Like non-existent post (should fail)
  try {
    const result = await makeRequest('POST', '/api/posts/non-existent-id/like', null, userCookies);
    log('Like non-existent post (should fail)', {
      passed: result.status === 404,
      data: result.data
    });
  } catch (error) {
    log('Like non-existent post (should fail)', { passed: false, error: error.message });
  }
  
  // ===== COMMENTS TESTS =====
  console.log('\n💬 COMMENTS TESTS');
  
  // Test 14: Get comments for a post
  if (testPostId) {
    try {
      const result = await makeRequest('GET', `/api/posts/${testPostId}/comments`, null, userCookies);
      log('Get comments for a post', {
        passed: result.status === 200 && Array.isArray(result.data),
        data: `Found ${result.data?.length || 0} comments`
      });
    } catch (error) {
      log('Get comments for a post', { passed: false, error: error.message });
    }
  }
  
  // Test 15: Create a comment (requires authentication)
  if (testPostId) {
    try {
      const commentData = { ...testComment, postId: testPostId };
      const result = await makeRequest('POST', '/api/comments', commentData, userCookies);
      log('Create a comment (authenticated)', {
        passed: result.status === 201 && result.data.content === testComment.content,
        data: result.data
      });
      if (result.data && result.data.id) {
        testCommentId = result.data.id;
      }
    } catch (error) {
      log('Create a comment (authenticated)', { passed: false, error: error.message });
    }
  }
  
  // Test 16: Create comment without authentication (should fail)
  try {
    const commentData = { ...testComment, postId: 'some-id' };
    const result = await makeRequest('POST', '/api/comments', commentData);
    log('Create comment without authentication (should fail)', {
      passed: result.status === 401,
      data: result.data
    });
  } catch (error) {
    log('Create comment without authentication (should fail)', { passed: false, error: error.message });
  }
  
  // Test 17: Create comment with invalid data
  try {
    const invalidComment = { content: '', postId: 'invalid-id' };
    const result = await makeRequest('POST', '/api/comments', invalidComment, userCookies);
    log('Create comment with invalid data (should fail)', {
      passed: result.status === 400,
      data: result.data
    });
  } catch (error) {
    log('Create comment with invalid data (should fail)', { passed: false, error: error.message });
  }
  
  // Test 16: Like a comment
  if (testCommentId) {
    try {
      const result = await makeRequest('POST', `/api/comments/${testCommentId}/like`, null, userCookies);
      log('Like a comment', {
        passed: result.status === 200 && result.data.id === testCommentId,
        data: result.data
      });
    } catch (error) {
      log('Like a comment', { passed: false, error: error.message });
    }
  }
  
  // ===== SEARCH AND FILTER TESTS =====
  console.log('\n🔍 SEARCH AND FILTER TESTS');
  
  // Test 17: Search posts by hashtag
  try {
    const result = await makeRequest('GET', `/api/posts?latitude=${testPost.latitude}&longitude=${testPost.longitude}&hashtag=test`);
    log('Search posts by hashtag', {
      passed: result.status === 200 && Array.isArray(result.data),
      data: `Found ${result.data?.length || 0} posts with hashtag`
    });
  } catch (error) {
    log('Search posts by hashtag', { passed: false, error: error.message });
  }
  
  // Test 18: Search posts by content
  try {
    const result = await makeRequest('GET', `/api/posts?latitude=${testPost.latitude}&longitude=${testPost.longitude}&search=test`);
    log('Search posts by content', {
      passed: result.status === 200 && Array.isArray(result.data),
      data: `Found ${result.data?.length || 0} posts with search term`
    });
  } catch (error) {
    log('Search posts by content', { passed: false, error: error.message });
  }
  
  // ===== MESSAGING TESTS =====
  console.log('\n📨 MESSAGING TESTS');
  
  // Test 19: Get conversations (requires authentication)
  try {
    const result = await makeRequest('GET', '/api/conversations', null, userCookies);
    log('Get conversations', {
      passed: result.status === 200 && Array.isArray(result.data),
      data: `Found ${result.data?.length || 0} conversations`
    });
  } catch (error) {
    log('Get conversations', { passed: false, error: error.message });
  }
  
  // Test 20: Create conversation without authentication (should fail)
  try {
    const result = await makeRequest('POST', '/api/conversations', { participantId: 'some-user-id' });
    log('Create conversation without authentication (should fail)', {
      passed: result.status === 401,
      data: result.data
    });
  } catch (error) {
    log('Create conversation without authentication (should fail)', { passed: false, error: error.message });
  }
  
  // ===== LOGOUT TEST =====
  console.log('\n🚪 LOGOUT TESTS');
  
  // Test 21: Logout
  try {
    const result = await makeRequest('POST', '/api/auth/logout', null, userCookies);
    log('Logout', {
      passed: result.status === 200,
      data: result.data
    });
  } catch (error) {
    log('Logout', { passed: false, error: error.message });
  }
  
  // Test 22: Get user after logout
  try {
    const result = await makeRequest('GET', '/api/auth/user', null, userCookies);
    log('Get user after logout', {
      passed: result.status === 200 && result.data === null,
      data: result.data
    });
  } catch (error) {
    log('Get user after logout', { passed: false, error: error.message });
  }
  
  console.log('\n🏁 API Test Suite Completed');
};

// Run the tests
runTests().catch(console.error);