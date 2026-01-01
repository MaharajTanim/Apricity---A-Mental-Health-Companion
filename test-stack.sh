#!/bin/bash

#############################################################################
# Apricity Stack Integration Test Script
#
# This script:
# 1. Starts the Docker stack (docker-compose up -d)
# 2. Waits for services to be healthy
# 3. Tests backend health endpoint
# 4. Tests ML service health endpoint
# 5. Registers a test user
# 6. Logs in to get JWT token
# 7. Creates a diary entry
# 8. Waits for ML analysis to complete
# 9. Retrieves diary with emotion analysis
# 10. Validates emotion data exists
#
# Exit codes:
# 0 - All tests passed
# 1+ - Test failure (exits on first failure)
#############################################################################

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:5000"
ML_SERVICE_URL="http://localhost:8000"
MAX_RETRIES=30
RETRY_INTERVAL=2
ML_ANALYSIS_WAIT=10

# Test data
TEST_EMAIL="testuser_$(date +%s)@apricity.test"
TEST_PASSWORD="SecurePass123!"
TEST_USERNAME="TestUser$(date +%s)"
DIARY_TITLE="Integration Test Diary"
DIARY_CONTENT="I am feeling really anxious about my upcoming presentation. I have been practicing a lot but I still feel nervous and worried that something will go wrong. I hope I can overcome this anxiety."

# Temporary files for responses
RESPONSE_FILE=$(mktemp)
trap "rm -f $RESPONSE_FILE" EXIT

#############################################################################
# Helper Functions
#############################################################################

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${YELLOW}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_dependencies() {
    print_step "Checking dependencies..."
    
    for cmd in docker docker-compose curl jq; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed"
            exit 1
        fi
    done
    
    print_success "All dependencies found"
}

#############################################################################
# Service Management
#############################################################################

start_services() {
    print_step "Starting Docker services..."
    
    # Stop any existing containers
    docker-compose down > /dev/null 2>&1 || true
    
    # Start services in detached mode
    if docker-compose up -d; then
        print_success "Docker services started"
    else
        print_error "Failed to start Docker services"
        exit 1
    fi
}

wait_for_service() {
    local service_name=$1
    local health_url=$2
    local max_retries=$MAX_RETRIES
    local retry_count=0
    
    print_step "Waiting for $service_name to be healthy..."
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        echo -n "."
        sleep $RETRY_INTERVAL
    done
    
    echo ""
    print_error "$service_name failed to become healthy after $((max_retries * RETRY_INTERVAL)) seconds"
    docker-compose logs $service_name
    exit 1
}

#############################################################################
# API Testing Functions
#############################################################################

test_backend_health() {
    print_step "Testing backend health endpoint..."
    
    local response=$(curl -sf "$BACKEND_URL/health" -o $RESPONSE_FILE -w "%{http_code}")
    
    if [ "$response" != "200" ]; then
        print_error "Backend health check failed (HTTP $response)"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    # Check response structure
    local status=$(jq -r '.status' $RESPONSE_FILE 2>/dev/null || echo "")
    
    if [ "$status" != "healthy" ]; then
        print_error "Backend health status is not 'healthy': $status"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    print_success "Backend is healthy"
    echo "   Response: $(cat $RESPONSE_FILE)"
}

test_ml_health() {
    print_step "Testing ML service health endpoint..."
    
    local response=$(curl -sf "$ML_SERVICE_URL/health" -o $RESPONSE_FILE -w "%{http_code}")
    
    if [ "$response" != "200" ]; then
        print_error "ML service health check failed (HTTP $response)"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    # Check response structure
    local status=$(jq -r '.status' $RESPONSE_FILE 2>/dev/null || echo "")
    
    if [ "$status" != "healthy" ]; then
        print_error "ML service health status is not 'healthy': $status"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    print_success "ML service is healthy"
    echo "   Response: $(cat $RESPONSE_FILE)"
}

register_user() {
    print_step "Registering test user..."
    
    local payload=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD",
    "username": "$TEST_USERNAME"
}
EOF
    )
    
    local response=$(curl -sf "$BACKEND_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -o $RESPONSE_FILE \
        -w "%{http_code}")
    
    if [ "$response" != "201" ]; then
        print_error "User registration failed (HTTP $response)"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    # Check response structure
    local success=$(jq -r '.success' $RESPONSE_FILE 2>/dev/null || echo "false")
    
    if [ "$success" != "true" ]; then
        print_error "User registration response indicates failure"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    print_success "User registered successfully"
    echo "   Email: $TEST_EMAIL"
    echo "   Username: $TEST_USERNAME"
}

login_user() {
    print_step "Logging in..."
    
    local payload=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD"
}
EOF
    )
    
    local response=$(curl -sf "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -o $RESPONSE_FILE \
        -w "%{http_code}")
    
    if [ "$response" != "200" ]; then
        print_error "Login failed (HTTP $response)"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    # Extract JWT token
    JWT_TOKEN=$(jq -r '.data.token' $RESPONSE_FILE 2>/dev/null || echo "")
    
    if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
        print_error "Failed to extract JWT token from login response"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    print_success "Login successful"
    echo "   Token: ${JWT_TOKEN:0:20}..."
}

create_diary() {
    print_step "Creating diary entry..."
    
    local payload=$(cat <<EOF
{
    "title": "$DIARY_TITLE",
    "content": "$DIARY_CONTENT",
    "date": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "mood": "anxious",
    "tags": ["test", "integration", "anxiety"]
}
EOF
    )
    
    local response=$(curl -sf "$BACKEND_URL/api/diary" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "$payload" \
        -o $RESPONSE_FILE \
        -w "%{http_code}")
    
    if [ "$response" != "201" ]; then
        print_error "Diary creation failed (HTTP $response)"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    # Extract diary ID
    DIARY_ID=$(jq -r '.data.diary._id' $RESPONSE_FILE 2>/dev/null || echo "")
    
    if [ -z "$DIARY_ID" ] || [ "$DIARY_ID" = "null" ]; then
        print_error "Failed to extract diary ID from response"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    print_success "Diary created successfully"
    echo "   Diary ID: $DIARY_ID"
    echo "   Title: $DIARY_TITLE"
}

wait_for_ml_analysis() {
    print_step "Waiting for ML analysis to complete (${ML_ANALYSIS_WAIT}s)..."
    
    # Give the ML analysis job queue time to process
    local wait_time=0
    while [ $wait_time -lt $ML_ANALYSIS_WAIT ]; do
        sleep 1
        wait_time=$((wait_time + 1))
        echo -n "."
    done
    
    echo ""
    print_success "ML analysis processing time elapsed"
}

get_diary_with_emotion() {
    print_step "Retrieving diary entry with emotion analysis..."
    
    local response=$(curl -sf "$BACKEND_URL/api/diary/$DIARY_ID" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -o $RESPONSE_FILE \
        -w "%{http_code}")
    
    if [ "$response" != "200" ]; then
        print_error "Failed to retrieve diary entry (HTTP $response)"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    print_success "Diary retrieved successfully"
}

validate_emotion_data() {
    print_step "Validating emotion analysis data..."
    
    # Check if emotionSummary exists
    local has_emotion=$(jq -r '.data.diary.emotionSummary' $RESPONSE_FILE 2>/dev/null)
    
    if [ "$has_emotion" = "null" ] || [ -z "$has_emotion" ]; then
        print_error "No emotion analysis found in diary entry"
        echo "   This may indicate the ML analysis hasn't completed yet or failed"
        cat $RESPONSE_FILE
        exit 1
    fi
    
    # Extract emotion data
    local top_emotion=$(jq -r '.data.diary.emotionSummary.topEmotion' $RESPONSE_FILE 2>/dev/null || echo "")
    local confidence=$(jq -r '.data.diary.emotionSummary.confidence' $RESPONSE_FILE 2>/dev/null || echo "")
    local category=$(jq -r '.data.diary.emotionSummary.category' $RESPONSE_FILE 2>/dev/null || echo "")
    local detected_emotions=$(jq -r '.data.diary.emotionSummary.detectedEmotions | length' $RESPONSE_FILE 2>/dev/null || echo "0")
    
    # Validate emotion data
    if [ -z "$top_emotion" ] || [ "$top_emotion" = "null" ]; then
        print_error "Top emotion is missing or null"
        exit 1
    fi
    
    if [ -z "$confidence" ] || [ "$confidence" = "null" ]; then
        print_error "Confidence score is missing or null"
        exit 1
    fi
    
    # Validate confidence is numeric and in valid range
    if ! echo "$confidence" | grep -qE '^[0-9]+\.?[0-9]*$'; then
        print_error "Confidence is not a valid number: $confidence"
        exit 1
    fi
    
    # Confidence should be between 0 and 1
    local confidence_check=$(echo "$confidence >= 0 && $confidence <= 1" | bc -l 2>/dev/null || echo "0")
    if [ "$confidence_check" != "1" ]; then
        print_error "Confidence value out of range (0-1): $confidence"
        exit 1
    fi
    
    if [ "$detected_emotions" -eq "0" ]; then
        print_error "No emotions detected in analysis"
        exit 1
    fi
    
    print_success "Emotion analysis data validated"
    echo "   Top Emotion: $top_emotion"
    echo "   Confidence: $confidence"
    echo "   Category: $category"
    echo "   Detected Emotions: $detected_emotions"
    echo ""
    echo "   Full Emotion Summary:"
    jq '.data.diary.emotionSummary' $RESPONSE_FILE
}

#############################################################################
# Cleanup
#############################################################################

cleanup() {
    if [ "$1" = "success" ]; then
        print_step "Cleaning up test data..."
        
        # Delete the test diary
        if [ ! -z "$DIARY_ID" ] && [ ! -z "$JWT_TOKEN" ]; then
            curl -sf "$BACKEND_URL/api/diary/$DIARY_ID" \
                -X DELETE \
                -H "Authorization: Bearer $JWT_TOKEN" \
                > /dev/null 2>&1 || true
            print_success "Test diary deleted"
        fi
    fi
}

#############################################################################
# Main Execution
#############################################################################

main() {
    print_header "APRICITY STACK INTEGRATION TEST"
    
    # Check dependencies
    check_dependencies
    
    # Start services
    start_services
    
    # Wait for services to be healthy
    wait_for_service "backend" "$BACKEND_URL/health"
    wait_for_service "ML service" "$ML_SERVICE_URL/health"
    
    # Additional wait for MongoDB to be fully ready
    print_step "Waiting for MongoDB to initialize..."
    sleep 5
    print_success "MongoDB initialization complete"
    
    # Test health endpoints
    print_header "HEALTH CHECKS"
    test_backend_health
    test_ml_health
    
    # User registration and authentication
    print_header "USER AUTHENTICATION"
    register_user
    login_user
    
    # Diary operations
    print_header "DIARY OPERATIONS"
    create_diary
    
    # Wait for ML analysis
    print_header "ML ANALYSIS"
    wait_for_ml_analysis
    
    # Retrieve and validate emotion data
    print_header "EMOTION VALIDATION"
    get_diary_with_emotion
    validate_emotion_data
    
    # Cleanup
    cleanup "success"
    
    # Final success message
    print_header "ALL TESTS PASSED ✓"
    echo -e "${GREEN}The Apricity stack is fully operational!${NC}\n"
    echo "Services tested:"
    echo "  ✓ MongoDB database"
    echo "  ✓ Backend API (Express + MongoDB)"
    echo "  ✓ ML Service (Python + BERT)"
    echo "  ✓ Job Queue (async processing)"
    echo "  ✓ End-to-end flow (register → login → create diary → ML analysis → retrieve emotion)"
    echo ""
    echo "Test artifacts:"
    echo "  • User: $TEST_EMAIL"
    echo "  • Diary ID: $DIARY_ID (deleted)"
    echo ""
    
    exit 0
}

# Run main function
main
