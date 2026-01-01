# ML Service Integration for Diary API

## Overview

The POST /api/diary endpoint now integrates with the ML service to perform emotion analysis on diary entries. The integration is asynchronous and non-blocking to ensure diary creation succeeds even if ML analysis fails.

## Implementation Details

### HTTP Request to ML Service

When a diary entry is created, the backend makes an HTTP POST request to the ML service:

**Endpoint**: `{ML_SERVICE_URL}/predict`

**Request Body**:

```json
{
  "diaryId": "507f1f77bcf86cd799439011",
  "userId": "507f191e810c19729de860ea",
  "text": "The diary content text..."
}
```

**Expected Response**:

```json
{
  "top_label": "joy",
  "scores": {
    "joy": 0.85,
    "admiration": 0.42,
    "optimism": 0.38,
    "gratitude": 0.25,
    "neutral": 0.15
    // ... other emotion scores
  },
  "summary_suggestion": "AI-generated supportive response"
}
```

### Emotion Model Mapping

The ML service response is saved to the Emotion model with the following mapping:

- `top_label` → `topLabel` (String)
- `scores` → `scores` (Object with 28 emotion fields)
- `scores[top_label]` → `confidence` (Number)
- Top 5 emotions with score > 0.1 → `detectedEmotions` (Array)
- Diary content (first 5000 chars) → `sourceText` (String)

### Error Handling

The integration uses comprehensive error handling:

1. **Try/Catch**: All ML service calls are wrapped in try/catch blocks
2. **Non-blocking**: Uses fire-and-forget pattern - diary creation succeeds even if ML fails
3. **Detailed Logging**: Logs success/failure with context for debugging
4. **Timeout**: 30-second timeout on HTTP requests to prevent hanging
5. **Graceful Degradation**: If ML service is down, diary is still created without emotion analysis

### Error Log Examples

```
[ML Analysis Error] Failed to analyze diary 507f1f77bcf86cd799439011: timeout of 30000ms exceeded
[ML Analysis Error] No response received from ML service at http://localhost:8000
[ML Analysis Error] ML service responded with status 500
```

### Success Log Examples

```
[ML Analysis] Starting analysis for diary 507f1f77bcf86cd799439011
[ML Analysis] Successfully saved emotion analysis for diary 507f1f77bcf86cd799439011
[ML Analysis] Top emotion: joy, Confidence: 0.85
[ML Analysis] Summary: Your entry shows positive energy and gratitude...
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
ML_SERVICE_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`.

### ML Service Requirements

The ML service must:

1. Accept POST requests at `/predict` endpoint
2. Return JSON with `top_label` and `scores` fields
3. Use GoEmotions 28-label emotion taxonomy
4. Return scores as object with emotion names as keys (0-1 range)

## Flow Diagram

```
User → POST /api/diary
  ↓
Create Diary Entry (MongoDB)
  ↓
Return 201 Response (immediate)
  ↓
Background Task: performMLAnalysis()
  ↓
POST to ML_SERVICE_URL/predict
  ↓
Receive emotion analysis results
  ↓
Save to Emotion model (MongoDB)
  ↓
Update diary.aiAnalyzed = true
```

## API Response

**Immediate Response** (before ML analysis completes):

```json
{
  "success": true,
  "message": "Diary entry created successfully. Emotion analysis in progress.",
  "data": {
    "diary": {
      "id": "507f1f77bcf86cd799439011",
      "title": "A Great Day",
      "content": "Today was wonderful...",
      "snippet": "Today was wonderful...",
      "date": "2025-01-15T00:00:00.000Z",
      "mood": "good",
      "tags": ["grateful", "happy"],
      "isPrivate": true,
      "aiAnalyzed": false,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Later GET Request** (after ML analysis completes):

The diary will include emotion summary:

```json
{
  "diary": {
    "id": "507f1f77bcf86cd799439011",
    "aiAnalyzed": true,
    "emotionSummary": {
      "topEmotion": "joy",
      "detectedEmotions": ["joy", "admiration", "optimism", "gratitude"],
      "confidence": 0.85,
      "category": "positive"
    }
  }
}
```

## Testing

### Manual Testing

1. **Start ML Service**:

   ```bash
   cd ml_service
   python predict_server.py
   ```

2. **Create Diary Entry**:

   ```bash
   curl -X POST http://localhost:5000/api/diary \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Entry",
       "content": "I feel really happy and grateful today!"
     }'
   ```

3. **Check Logs**: Watch backend console for ML analysis logs

4. **Verify Emotion Saved**:
   ```bash
   curl http://localhost:5000/api/diary/DIARY_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Testing ML Service Failure

1. **Stop ML Service**: Kill the Python process

2. **Create Diary Entry**: Should still succeed with 201 response

3. **Check Logs**: Should see error logs but diary creation succeeds

4. **Verify**: `aiAnalyzed` will remain `false`, no emotion record created

## Dependencies

- **axios** (^1.6.2): HTTP client for ML service requests
- **mongoose**: MongoDB ODM for Emotion model
- **express-validator**: Input validation

## Related Files

- `backend/src/routes/diary.js`: Main implementation
- `backend/src/models/Emotion.js`: Emotion schema definition
- `backend/src/models/Diary.js`: Diary schema definition
- `backend/.env.example`: Environment configuration template
- `ml_service/predict_server.py`: ML service implementation

## Future Enhancements

1. **Retry Logic**: Implement exponential backoff for failed requests
2. **Queue System**: Use Bull/Redis for robust background job processing
3. **Webhooks**: ML service could callback when analysis completes
4. **Batch Processing**: Analyze multiple diaries in single request
5. **Caching**: Cache ML results for duplicate content
6. **Monitoring**: Add metrics for ML service health and performance
