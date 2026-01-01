# Test Scripts for Apricity ML Service

Quick test scripts to verify the ML service is working correctly.

## Available Test Scripts

### 1. `test_predict.py` - Simple Python Test

Single test with detailed output and formatted results.

**Usage:**

```bash
python test_predict.py
```

**Features:**

- Health check before testing
- Single prediction request
- Formatted JSON output
- Friendly results display
- Clear success/failure indicators

**Example output:**

```
📊 ANALYSIS RESULTS:
Top Emotion: anxiety
   Confidence: 78.50%

🔍 All Detected Emotions:
   - anxiety: 78.50%
   - nervousness: 54.20%
   - fear: 42.30%

💬 Supportive Response:
   I understand you're feeling anxious right now...
```

### 2. `test_predict_all.py` - Comprehensive Test Suite

Tests multiple scenarios with different emotional contexts.

**Usage:**

```bash
python test_predict_all.py
```

**Test Cases:**

1. Anxiety/Stress
2. Joy/Happiness
3. Sadness/Disappointment
4. Mixed Emotions
5. Neutral/Reflective

**Example output:**

```
TEST SUMMARY
============
✓ PASS: Anxiety/Stress
✓ PASS: Joy/Happiness
✓ PASS: Sadness/Disappointment
✓ PASS: Mixed Emotions
✓ PASS: Neutral/Reflective

Total: 5/5 tests passed
🎉 All tests passed!
```

### 3. `test_predict.sh` - Bash Script (curl)

Quick bash script using curl for testing without Python.

**Usage:**

```bash
bash test_predict.sh
# or
chmod +x test_predict.sh
./test_predict.sh
```

**Features:**

- No Python dependencies (except for JSON formatting)
- Uses curl for requests
- Color-coded output
- Works on Linux/Mac/WSL

## Prerequisites

### For Python Scripts

```bash
pip install requests
```

### For Bash Script

```bash
# curl (usually pre-installed)
# Optional: python3 for JSON formatting
```

## Quick Start

1. **Start the ML service:**

   ```bash
   # Option A: Direct Python
   python predict_server.py

   # Option B: Docker
   docker run -p 8000:8000 apricity-ml-service

   # Option C: Docker Compose
   docker-compose up ml-service
   ```

2. **Run a test script:**

   ```bash
   # Simple test
   python test_predict.py

   # Comprehensive test
   python test_predict_all.py

   # Bash test
   bash test_predict.sh
   ```

## Configuration

Change the service URL if needed:

**Python scripts:**

```python
ML_SERVICE_URL = "http://localhost:8000"  # Change port if different
```

**Bash script:**

```bash
ML_SERVICE_URL="http://localhost:8000"  # Change port if different
```

## Troubleshooting

### Connection Error

```
❌ ERROR: Could not connect to ML service
```

**Solution:**

- Make sure the service is running
- Check the port (default: 8000)
- Verify with: `curl http://localhost:8000/health`

### Timeout Error

```
❌ ERROR: Request timed out
```

**Solution:**

- Service may be loading models (first request takes longer)
- Wait 30-60 seconds and try again
- Check service logs for errors

### Invalid Response

```
❌ ERROR: Invalid JSON response
```

**Solution:**

- Service may not be fully started
- Check service logs: `docker logs apricity-ml -f`
- Verify models are loaded correctly

## Testing Different Scenarios

### Test with Custom Text

**Python:**

```python
import requests
import json

response = requests.post(
    "http://localhost:8000/predict",
    json={
        "userId": "custom-user",
        "diaryId": "custom-diary",
        "text": "Your custom text here"
    }
)

print(json.dumps(response.json(), indent=2))
```

**Bash:**

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "custom-user",
    "diaryId": "custom-diary",
    "text": "Your custom text here"
  }'
```

### Test Performance

```bash
# Time a single request
time python test_predict.py

# Time multiple requests
time python test_predict_all.py

# Benchmark with Apache Bench (if installed)
ab -n 100 -c 10 -p payload.json -T application/json \
  http://localhost:8000/predict
```

## Integration with Other Tools

### Use in CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Test ML Service
  run: |
    docker-compose up -d ml-service
    sleep 30  # Wait for service to start
    python ml_service/test_predict_all.py
```

### Use in Monitoring

```bash
# Create a simple health monitor
while true; do
  python test_predict.py
  if [ $? -eq 0 ]; then
    echo "Service OK at $(date)"
  else
    echo "Service FAILED at $(date)"
    # Send alert
  fi
  sleep 300  # Check every 5 minutes
done
```

## Expected Response Format

```json
{
  "diaryId": "test-diary-456",
  "userId": "test-user-123",
  "top_label": "joy",
  "scores": {
    "joy": 0.85,
    "admiration": 0.42,
    "gratitude": 0.38,
    "optimism": 0.25,
    ...
  },
  "summary_suggestion": "I'm glad to hear you're feeling joyful...",
  "confidence": 0.85,
  "all_detected": ["joy", "admiration", "gratitude"]
}
```

## Exit Codes

All scripts use standard exit codes:

- `0` - All tests passed
- `1` - One or more tests failed

Use in scripts:

```bash
python test_predict.py
if [ $? -eq 0 ]; then
    echo "Tests passed!"
else
    echo "Tests failed!"
    exit 1
fi
```
