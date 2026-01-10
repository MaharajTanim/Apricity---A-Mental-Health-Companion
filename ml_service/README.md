# Apricity ML Service

Machine Learning inference service for emotion detection and response generation.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file or set environment variables:

```bash
# Model Configuration
MODEL_PATH=microsoft/deberta-v3-base
# Or use local fine-tuned model:
# MODEL_PATH=./models/apricity-emotion-deberta/best

GENERATION_MODEL_NAME=google/flan-t5-base

# Server Configuration
PORT=8000
HOST=0.0.0.0

# Model Parameters
MAX_LENGTH=192
MAX_NEW_TOKENS=160
NUM_BEAMS=4
TEMPERATURE=0.7
TOP_P=0.92
```

### 4. Download Models

Place your trained models in the `models/` directory:

```
models/
└── apricity-emotion-deberta/
    └── best/
        ├── config.json
        ├── pytorch_model.bin
        ├── tokenizer_config.json
        ├── vocab.txt
        └── labels.json
```

## Running the Service

### Development

```bash
python predict_server.py
```

### Production (with Uvicorn)

```bash
uvicorn predict_server:app --host 0.0.0.0 --port 8000 --workers 4
```

### With Docker

```bash
# Build image
docker build -t apricity-ml-service:latest .

# Run container
docker run -d -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  --name apricity-ml \
  apricity-ml-service:latest
```

## API Endpoints

### Core Endpoints

- **GET** `/` - Service info and available endpoints
- **GET** `/health` - Health check with model status
- **POST** `/predict` - **Main endpoint for backend integration** (emotion analysis + supportive response)

### Additional Endpoints

- **POST** `/api/v1/detect-emotion` - Emotion detection only
- **POST** `/api/v1/generate-support` - Response generation only
- **POST** `/api/v1/chat` - Full pipeline (emotion + response)

### /predict Endpoint (Backend Integration)

This is the main endpoint used by the Apricity backend for diary analysis.

**Request:**

```json
{
  "userId": "507f191e810c19729de860ea",
  "diaryId": "507f1f77bcf86cd799439011",
  "text": "Today was really challenging. I felt overwhelmed at work."
}
```

**Response:**

```json
{
  "userId": "507f191e810c19729de860ea",
  "diaryId": "507f1f77bcf86cd799439011",
  "top_label": "anxiety",
  "scores": {
    "anxiety": 0.78,
    "sadness": 0.45,
    "disappointment": 0.32,
    "neutral": 0.15,
    ...
  },
  "summary_suggestion": "I understand you're feeling anxious right now...",
  "confidence": 0.78,
  "all_detected": ["anxiety", "sadness", "disappointment"]
}
```

## API Documentation

Once running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Test /predict endpoint (backend integration)
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f191e810c19729de860ea",
    "diaryId": "507f1f77bcf86cd799439011",
    "text": "Today was really challenging. I felt overwhelmed at work."
  }'

# Test emotion detection only
curl -X POST "http://localhost:8000/api/v1/detect-emotion" \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel anxious about tomorrow"}'

# Test full chat pipeline
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel anxious about tomorrow", "user_name": "Alex"}'
```

## Model Loading

The service supports loading models from:

1. **Local checkpoint** (default):
   ```bash
   MODEL_PATH=./models/apricity-emotion-bert/best
   ```
2. **HuggingFace Hub**:
   ```bash
   MODEL_PATH=bhadresh-savani/bert-base-uncased-emotion
   ```

On startup, the service will automatically download models from HuggingFace if they're not found locally.

## Model Updates

To update ML models in production or development, use the automated update script:

```bash
# Update from local directory
./update_model.sh ./new_models/

# Update from AWS S3
./update_model.sh s3://apricity-ml-models/production/v2/

# Update from Google Cloud Storage
./update_model.sh gs://apricity-ml-models/production/v2/

# Update without backup (not recommended)
./update_model.sh --no-backup ./new_models/

# Update without restarting container (for testing)
./update_model.sh --no-restart ./test_models/
```

The script will:

1. ✅ Create a timestamped backup of existing models
2. ✅ Download/copy new models from source (local, S3, or GCS)
3. ✅ Verify model files are present
4. ✅ Restart the ml_service container
5. ✅ Wait for health check to pass
6. ✅ Rollback automatically if any step fails

**For complete documentation**, see [MODEL_UPDATE_README.md](./MODEL_UPDATE_README.md).

## Error Handling

The service includes comprehensive error handling:

- **503 Service Unavailable**: Models not loaded yet
- **500 Internal Server Error**: Error during prediction
- **422 Validation Error**: Invalid request format

All errors are logged with detailed context for debugging.

## Logging

Logs are written to:

- **Console** (stdout) - for development and Docker
- **ml_service.log** - for persistent logging

Log format includes timestamps, log level, and detailed error traces.

## Performance Notes

- **Cold start**: First request may take 1-2 seconds (model loading to GPU/CPU)
- **Warm requests**: ~100-500ms depending on text length and hardware
- **GPU recommended** for production use (10x faster than CPU)
- **Memory requirements**: ~2GB RAM for models + PyTorch
