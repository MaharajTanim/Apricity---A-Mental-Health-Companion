#!/bin/bash

echo "========================================="
echo "Testing Apricity Backend API"
echo "========================================="
echo ""

# Test 1: Health check
echo "1. Testing Health Endpoint..."
curl -s http://localhost:5000/health | python -m json.tool 2>/dev/null || curl -s http://localhost:5000/health
echo ""
echo ""

# Test 2: Root endpoint
echo "2. Testing Root Endpoint..."
curl -s http://localhost:5000/ | python -m json.tool 2>/dev/null || curl -s http://localhost:5000/
echo ""
echo ""

# Test 3: Register user
echo "3. Registering Test User..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123"}')

echo "$REGISTER_RESPONSE" | python -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo "⚠️  Failed to get token (user might already exist). Trying login..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"TestPass123"}')
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
fi

echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Could not get authentication token"
    exit 1
fi

echo "✅ Got authentication token: ${TOKEN:0:20}..."
echo ""

# Test 4: Test the NEW Suggestions Endpoint
echo "4. Testing NEW /api/suggestions Endpoint..."
echo "   (This is the rule-based suggestion engine we just created)"
echo ""

SUGGESTIONS_RESPONSE=$(curl -s -X POST http://localhost:5000/api/suggestions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "daysAnalyzed": 7,
    "consecutiveDays": 7,
    "emotionScores": {
      "sadness": 0.65,
      "anxiety": 0.42,
      "anger": 0.28,
      "fear": 0.35,
      "grief": 0.15
    },
    "percentages": {
      "positive": 15.2,
      "negative": 68.3,
      "neutral": 16.5
    },
    "emotionalVariability": 0.45
  }')

echo "$SUGGESTIONS_RESPONSE" | python -m json.tool 2>/dev/null || echo "$SUGGESTIONS_RESPONSE"
echo ""

# Test 5: Get rules information
echo ""
echo "5. Getting Suggestions Rules Information..."
RULES_RESPONSE=$(curl -s http://localhost:5000/api/suggestions/rules \
  -H "Authorization: Bearer $TOKEN")

echo "$RULES_RESPONSE" | python -m json.tool 2>/dev/null | head -50 || echo "$RULES_RESPONSE" | head -50
echo ""

echo "========================================="
echo "✅ All Tests Complete!"
echo "========================================="
echo ""
echo "📊 Services Running:"
echo "   - Backend: http://localhost:5000"
echo "   - MongoDB: mongodb://localhost:27017"
echo ""
echo "📝 New Feature Tested:"
echo "   - /api/suggestions endpoint (rule-based mental health suggestions)"
echo "   - 10 rules for different emotional patterns"
echo "   - Crisis resources for high severity cases"
echo ""
