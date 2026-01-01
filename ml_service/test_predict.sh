#!/bin/bash
# Quick test script for Apricity ML Service using curl
# Tests the /predict endpoint with sample data

ML_SERVICE_URL="http://localhost:8000"

echo "=================================="
echo "Testing Apricity ML Service"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo "1. Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$ML_SERVICE_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$HEALTH_BODY" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_BODY"
else
    echo -e "${RED}✗ Health check failed (Status: $HEALTH_CODE)${NC}"
    echo "$HEALTH_BODY"
    exit 1
fi

echo ""
echo "=================================="
echo ""

# Test 2: Predict endpoint
echo "2. Testing /predict endpoint..."

# Sample data
read -r -d '' PAYLOAD << EOF
{
  "userId": "test-user-123",
  "diaryId": "test-diary-456",
  "text": "I'm feeling really happy today! Everything went well at work and I spent quality time with my family."
}
EOF

echo "Request payload:"
echo "$PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$PAYLOAD"
echo ""

# Send request
PREDICT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ML_SERVICE_URL/predict" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

PREDICT_CODE=$(echo "$PREDICT_RESPONSE" | tail -n 1)
PREDICT_BODY=$(echo "$PREDICT_RESPONSE" | head -n -1)

if [ "$PREDICT_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Prediction successful${NC}"
    echo ""
    echo "Response:"
    echo "$PREDICT_BODY" | python3 -m json.tool 2>/dev/null || echo "$PREDICT_BODY"
    
    # Extract key fields using python
    echo ""
    echo "=================================="
    echo "Key Results:"
    echo "=================================="
    echo "$PREDICT_BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f\"Top Emotion: {data.get('top_label', 'N/A')}\")
    print(f\"Confidence: {data.get('confidence', 0):.2%}\")
    print(f\"All Detected: {', '.join(data.get('all_detected', []))}\")
    print(f\"\\nSupportive Response:\\n{data.get('summary_suggestion', 'N/A')}\")
except:
    pass
" 2>/dev/null
    
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Prediction failed (Status: $PREDICT_CODE)${NC}"
    echo "$PREDICT_BODY"
    exit 1
fi
