# Apricity Stack Integration Test

## Overview

`test-stack.sh` is a comprehensive end-to-end integration test script that validates the entire Apricity Mental Health Companion stack is working correctly.

## What It Tests

### 1. Service Health Checks

- ✓ Backend API health endpoint (`/health`)
- ✓ ML Service health endpoint (`/health`)
- ✓ MongoDB connectivity
- ✓ Service inter-communication

### 2. User Authentication Flow

- ✓ User registration (`POST /api/auth/register`)
- ✓ User login (`POST /api/auth/login`)
- ✓ JWT token generation and validation

### 3. Diary Management

- ✓ Create diary entry (`POST /api/diary`)
- ✓ Retrieve diary entry (`GET /api/diary/:id`)
- ✓ Authorization with JWT

### 4. ML Analysis Pipeline

- ✓ Async job queue processing
- ✓ ML service emotion detection (BERT model)
- ✓ Emotion data persistence
- ✓ Response generation

### 5. Data Validation

- ✓ Emotion analysis structure validation
- ✓ Numeric confidence scores (0-1 range)
- ✓ Top emotion detection
- ✓ Multiple emotions detection
- ✓ Emotion category classification

## Prerequisites

### Required Tools

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **curl** (for HTTP requests)
- **jq** (for JSON parsing)
- **bash** (v4.0+)

### Install jq (if not installed)

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Windows (Git Bash)
# jq is usually included, or download from https://stedolan.github.io/jq/
```

### Environment Setup

Ensure you have a `.env` file in the root directory with required configurations:

```bash
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=changeme123

# Backend
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# ML Service
ML_LOG_LEVEL=info
```

## Usage

### Basic Run

```bash
./test-stack.sh
```

### With Verbose Docker Logs

```bash
./test-stack.sh 2>&1 | tee test-output.log
```

### Stop Services After Test

```bash
./test-stack.sh && docker-compose down
```

## Test Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    APRICITY STACK INTEGRATION TEST              │
└─────────────────────────────────────────────────────────────────┘

1. Check Dependencies
   └─ Verify: docker, docker-compose, curl, jq

2. Start Services
   └─ Run: docker-compose up -d
   └─ Services: mongo, backend, ml_service

3. Wait for Health
   └─ Backend:     Retry up to 60s
   └─ ML Service:  Retry up to 60s

4. Test Health Endpoints
   └─ GET /health (Backend)
   └─ GET /health (ML Service)

5. Register User
   └─ POST /api/auth/register
   └─ Email: testuser_<timestamp>@apricity.test
   └─ Password: SecurePass123!

6. Login User
   └─ POST /api/auth/login
   └─ Extract JWT token

7. Create Diary Entry
   └─ POST /api/diary
   └─ Content: Anxious diary text
   └─ Extract Diary ID

8. Wait for ML Analysis
   └─ Sleep 10s for job queue processing
   └─ ML worker analyzes diary content

9. Retrieve Diary
   └─ GET /api/diary/:id
   └─ Include emotion analysis

10. Validate Emotion Data
    └─ Check: topEmotion exists
    └─ Check: confidence (0-1 range)
    └─ Check: detectedEmotions array
    └─ Check: category classification

11. Cleanup
    └─ DELETE /api/diary/:id
    └─ Remove test data

✓ ALL TESTS PASSED
```

## Expected Output

### Success Output

```
═══════════════════════════════════════════════════════
APRICITY STACK INTEGRATION TEST
═══════════════════════════════════════════════════════

▶ Checking dependencies...
✓ All dependencies found

▶ Starting Docker services...
✓ Docker services started

▶ Waiting for backend to be healthy...
✓ backend is healthy

▶ Waiting for ML service to be healthy...
✓ ML service is healthy

═══════════════════════════════════════════════════════
HEALTH CHECKS
═══════════════════════════════════════════════════════

▶ Testing backend health endpoint...
✓ Backend is healthy
   Response: {"status":"healthy","service":"apricity-backend",...}

▶ Testing ML service health endpoint...
✓ ML service is healthy
   Response: {"status":"healthy","service":"ml-service",...}

═══════════════════════════════════════════════════════
USER AUTHENTICATION
═══════════════════════════════════════════════════════

▶ Registering test user...
✓ User registered successfully
   Email: testuser_1730149230@apricity.test
   Username: TestUser1730149230

▶ Logging in...
✓ Login successful
   Token: eyJhbGciOiJIUzI1NiIs...

═══════════════════════════════════════════════════════
DIARY OPERATIONS
═══════════════════════════════════════════════════════

▶ Creating diary entry...
✓ Diary created successfully
   Diary ID: 507f1f77bcf86cd799439011
   Title: Integration Test Diary

═══════════════════════════════════════════════════════
ML ANALYSIS
═══════════════════════════════════════════════════════

▶ Waiting for ML analysis to complete (10s)...
✓ ML analysis processing time elapsed

═══════════════════════════════════════════════════════
EMOTION VALIDATION
═══════════════════════════════════════════════════════

▶ Retrieving diary entry with emotion analysis...
✓ Diary retrieved successfully

▶ Validating emotion analysis data...
✓ Emotion analysis data validated
   Top Emotion: fear
   Confidence: 0.856
   Category: negative
   Detected Emotions: 3

   Full Emotion Summary:
   {
     "topEmotion": "fear",
     "detectedEmotions": ["fear", "sadness", "neutral"],
     "confidence": 0.856,
     "category": "negative"
   }

▶ Cleaning up test data...
✓ Test diary deleted

═══════════════════════════════════════════════════════
ALL TESTS PASSED ✓
═══════════════════════════════════════════════════════

The Apricity stack is fully operational!

Services tested:
  ✓ MongoDB database
  ✓ Backend API (Express + MongoDB)
  ✓ ML Service (Python + BERT)
  ✓ Job Queue (async processing)
  ✓ End-to-end flow (register → login → create diary → ML analysis → retrieve emotion)

Test artifacts:
  • User: testuser_1730149230@apricity.test
  • Diary ID: 507f1f77bcf86cd799439011 (deleted)
```

### Failure Output Examples

#### Service Not Healthy

```
✗ backend failed to become healthy after 60 seconds
[Container logs shown]
```

#### Registration Failed

```
✗ User registration failed (HTTP 400)
{"success":false,"message":"Email already exists"}
```

#### No Emotion Data

```
✗ No emotion analysis found in diary entry
   This may indicate the ML analysis hasn't completed yet or failed
```

## Exit Codes

| Code | Meaning                               |
| ---- | ------------------------------------- |
| 0    | All tests passed ✓                    |
| 1    | Dependency missing (docker, curl, jq) |
| 1    | Service startup failed                |
| 1    | Health check timeout                  |
| 1    | API request failed                    |
| 1    | Validation failed                     |

The script uses `set -e`, so it exits immediately on the first error.

## Troubleshooting

### Services Won't Start

```bash
# Check if ports are already in use
netstat -an | grep "5000\|8000\|27017"

# Kill existing containers
docker-compose down -v

# Restart
./test-stack.sh
```

### Health Checks Timeout

```bash
# Check service logs
docker-compose logs backend
docker-compose logs ml_service
docker-compose logs mongo

# Increase wait time in script
MAX_RETRIES=60  # Increase from 30
```

### ML Analysis Not Completing

```bash
# Increase wait time for ML processing
ML_ANALYSIS_WAIT=20  # Increase from 10

# Check ML service is processing jobs
docker-compose logs ml_service | grep "analysis"
docker-compose logs backend | grep "ML Worker"
```

### MongoDB Connection Issues

```bash
# Ensure MongoDB is fully initialized
docker-compose logs mongo | grep "Waiting for connections"

# Check MongoDB auth
docker exec -it apricity-mongo mongosh -u admin -p changeme123 --authenticationDatabase admin
```

### jq Command Not Found

```bash
# Install jq
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Or use Python as fallback (edit script)
# Replace: jq -r '.field'
# With: python3 -c "import sys, json; print(json.load(sys.stdin)['field'])"
```

## Customization

### Test Different Emotions

Edit the `DIARY_CONTENT` variable to test different emotions:

```bash
# Test happiness
DIARY_CONTENT="I had an amazing day! Everything went perfectly and I feel so grateful."

# Test sadness
DIARY_CONTENT="I'm feeling really down today. Nothing seems to be going right."

# Test anger
DIARY_CONTENT="I am so frustrated and angry about what happened. This is unacceptable!"
```

### Change Timeouts

```bash
MAX_RETRIES=30          # Service health check retries
RETRY_INTERVAL=2        # Seconds between retries
ML_ANALYSIS_WAIT=10     # Wait for ML processing (seconds)
```

### Test with Frontend

```bash
# Start full stack including frontend
docker-compose --profile full up -d

# Frontend will be at http://localhost:3000
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Integration Test

on: [push, pull_request]

jobs:
  test-stack:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: sudo apt-get install -y jq

      - name: Run integration test
        run: ./test-stack.sh
        timeout-minutes: 10

      - name: Cleanup
        if: always()
        run: docker-compose down -v
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Integration Test') {
            steps {
                sh './test-stack.sh'
            }
        }
    }
    post {
        always {
            sh 'docker-compose down -v'
        }
    }
}
```

## Performance Metrics

Typical execution times:

- Service startup: 20-40 seconds
- Health checks: 5-10 seconds
- User registration: < 1 second
- Diary creation: < 1 second
- ML analysis: 5-10 seconds
- Total runtime: **60-90 seconds**

## Related Scripts

- `docker-compose.yml` - Service orchestration
- `.github/workflows/ci.yml` - CI/CD pipeline
- `backend/tests/` - Backend unit tests
- `ml_service/tests/` - ML service unit tests

## Contributing

When modifying the test script:

1. Maintain colored output for readability
2. Always exit non-zero on failures
3. Add descriptive error messages
4. Clean up test data after success
5. Update this README with new test cases

## License

Part of the Apricity Mental Health Companion project.
