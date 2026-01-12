#!/bin/bash

# LocalFeat API Test Runner
echo "🧪 LocalFeat API Test Suite"
echo "=========================="
echo ""

# Check if the server is running
echo "Checking if server is running on localhost:5000..."
if curl -s http://localhost:5000/api/auth/user > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start the server first with 'npm run dev'"
    exit 1
fi

echo ""
echo "Running API tests..."
echo ""

# Run the test suite using Node.js
node tests/api.test.js

echo ""
echo "Test execution completed!"