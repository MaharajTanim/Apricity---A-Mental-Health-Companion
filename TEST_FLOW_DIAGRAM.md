# Apricity Integration Test - Visual Flow Diagram

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    APRICITY STACK INTEGRATION TEST                       ║
║                         test-stack.sh / test-stack.ps1                   ║
╚══════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: DEPENDENCY CHECK                                                 │
└──────────────────────────────────────────────────────────────────────────┘
   ✓ docker            → Container runtime
   ✓ docker-compose    → Multi-container orchestration
   ✓ curl              → HTTP client
   ✓ jq                → JSON parser
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2: START SERVICES                                                   │
└──────────────────────────────────────────────────────────────────────────┘
   $ docker-compose down           # Clean slate
   $ docker-compose up -d          # Start detached
                 │
                 ▼
   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐
   │   MongoDB (27017)   │  │  Backend (5000)     │  │ ML Service      │
   │   ─────────────     │  │  ─────────────      │  │ (8000)          │
   │   • Database        │  │  • Express API      │  │ ───────         │
   │   • Replica Set     │  │  • JWT Auth         │  │ • FastAPI       │
   │   • Health Check    │  │  • Job Queue        │  │ • BERT Model    │
   └─────────────────────┘  └─────────────────────┘  └─────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 3: WAIT FOR HEALTH (Max 60s per service)                           │
└──────────────────────────────────────────────────────────────────────────┘
   Backend:      GET /health  → {"status":"healthy"}  ✓
   ML Service:   GET /health  → {"status":"healthy"}  ✓
   MongoDB:      Connection test                      ✓
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 4: REGISTER USER                                                    │
└──────────────────────────────────────────────────────────────────────────┘
   POST /api/auth/register
   ┌────────────────────────────────────┐
   │ {                                  │
   │   "email": "test@apricity.test",   │
   │   "password": "SecurePass123!",    │
   │   "username": "TestUser"           │
   │ }                                  │
   └────────────────────────────────────┘
                 │
                 ▼
   Response: 201 Created
   ┌────────────────────────────────────┐
   │ {                                  │
   │   "success": true,                 │
   │   "data": {                        │
   │     "user": { ... }                │
   │   }                                │
   │ }                                  │
   └────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 5: LOGIN USER                                                       │
└──────────────────────────────────────────────────────────────────────────┘
   POST /api/auth/login
   ┌────────────────────────────────────┐
   │ {                                  │
   │   "email": "test@apricity.test",   │
   │   "password": "SecurePass123!"     │
   │ }                                  │
   └────────────────────────────────────┘
                 │
                 ▼
   Response: 200 OK
   ┌────────────────────────────────────┐
   │ {                                  │
   │   "success": true,                 │
   │   "data": {                        │
   │     "token": "eyJhbGc...",         │ ← JWT Token Extracted
   │     "user": { ... }                │
   │   }                                │
   │ }                                  │
   └────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 6: CREATE DIARY ENTRY                                              │
└──────────────────────────────────────────────────────────────────────────┘
   POST /api/diary
   Headers: Authorization: Bearer eyJhbGc...
   ┌────────────────────────────────────┐
   │ {                                  │
   │   "title": "Test Diary",           │
   │   "content": "I feel anxious...",  │
   │   "mood": "anxious",               │
   │   "tags": ["test", "anxiety"]      │
   │ }                                  │
   └────────────────────────────────────┘
                 │
                 ▼
   Response: 201 Created
   ┌────────────────────────────────────┐
   │ {                                  │
   │   "success": true,                 │
   │   "data": {                        │
   │     "diary": {                     │
   │       "_id": "507f1f77...",        │ ← Diary ID Extracted
   │       "title": "Test Diary",       │
   │       "aiAnalyzed": false          │
   │     }                              │
   │   }                                │
   │ }                                  │
   └────────────────────────────────────┘
                 │
                 ▼
   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   ┃ BACKGROUND: Job Enqueued for ML Analysis                            ┃
   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   Backend → Job Queue → ML Worker
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 7: ML ANALYSIS PROCESSING (Async)                                  │
└──────────────────────────────────────────────────────────────────────────┘
   Job Queue Worker picks up job:
   ┌────────────────────────────────────────────────┐
   │ Job: {                                         │
   │   type: "ml-analysis",                         │
   │   diaryId: "507f1f77...",                      │
   │   userId: "...",                               │
   │   content: "I feel anxious..."                 │
   │ }                                              │
   └────────────────────────────────────────────────┘
                 │
                 ▼
   POST to ML Service: http://ml_service:8000/predict
   ┌────────────────────────────────────────────────┐
   │ {                                              │
   │   "diaryId": "507f1f77...",                    │
   │   "userId": "...",                             │
   │   "text": "I feel anxious..."                  │
   │ }                                              │
   └────────────────────────────────────────────────┘
                 │
                 ▼
   ╔════════════════════════════════════════════════╗
   ║  ML SERVICE: BERT Emotion Detection            ║
   ╚════════════════════════════════════════════════╝
   1. Text Preprocessing (clean, normalize)
   2. Tokenization (BERT tokenizer)
   3. Model Inference (emotion_model.forward())
   4. Sigmoid Activation
   5. Top Emotion Selection
   6. Response Generation (FLAN-T5 - optional)
                 │
                 ▼
   Response: 200 OK
   ┌────────────────────────────────────────────────┐
   │ {                                              │
   │   "top_label": "fear",                         │
   │   "confidence": 0.856,                         │
   │   "scores": {                                  │
   │     "fear": 0.856,                             │
   │     "sadness": 0.623,                          │
   │     "neutral": 0.412,                          │
   │     ...                                        │
   │   },                                           │
   │   "summary_suggestion": "..."                  │
   │ }                                              │
   └────────────────────────────────────────────────┘
                 │
                 ▼
   Emotion saved to MongoDB:
   ┌────────────────────────────────────────────────┐
   │ Emotion Model:                                 │
   │ {                                              │
   │   diary: "507f1f77...",                        │
   │   user: "...",                                 │
   │   topLabel: "fear",                            │
   │   confidence: 0.856,                           │
   │   detectedEmotions: ["fear", "sadness"],       │
   │   allScores: { ... }                           │
   │ }                                              │
   └────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 8: WAIT FOR ML PROCESSING (10 seconds)                             │
└──────────────────────────────────────────────────────────────────────────┘
   Sleep 10s to allow job queue to complete
   ..........  (progress dots)
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 9: RETRIEVE DIARY WITH EMOTION                                     │
└──────────────────────────────────────────────────────────────────────────┘
   GET /api/diary/507f1f77...
   Headers: Authorization: Bearer eyJhbGc...
                 │
                 ▼
   Response: 200 OK
   ┌────────────────────────────────────────────────────────────┐
   │ {                                                          │
   │   "success": true,                                         │
   │   "data": {                                                │
   │     "diary": {                                             │
   │       "_id": "507f1f77...",                                │
   │       "title": "Test Diary",                               │
   │       "content": "I feel anxious...",                      │
   │       "aiAnalyzed": true,                                  │
   │       "emotionSummary": {                   ┌──────────────┤
   │         "topEmotion": "fear",               │ VALIDATED    │
   │         "confidence": 0.856,                │ IN STEP 10   │
   │         "detectedEmotions": ["fear", ...],  │              │
   │         "category": "negative"              └──────────────┤
   │       }                                                    │
   │     }                                                      │
   │   }                                                        │
   │ }                                                          │
   └────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 10: VALIDATE EMOTION DATA                                          │
└──────────────────────────────────────────────────────────────────────────┘
   ✓ emotionSummary exists (not null)
   ✓ topEmotion is string
   ✓ confidence is number
   ✓ confidence in range [0.0, 1.0]
   ✓ detectedEmotions is array
   ✓ detectedEmotions.length > 0
   ✓ category exists
                 │
                 ▼
   ┌──────────────────────────────────────────────────┐
   │ Validation Results:                              │
   │ ✓ Top Emotion: fear                              │
   │ ✓ Confidence: 0.856                              │
   │ ✓ Category: negative                             │
   │ ✓ Detected Emotions: 3                           │
   │                                                  │
   │ Full Emotion Summary:                            │
   │ {                                                │
   │   "topEmotion": "fear",                          │
   │   "detectedEmotions": ["fear", "sadness", ...],  │
   │   "confidence": 0.856,                           │
   │   "category": "negative"                         │
   │ }                                                │
   └──────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 11: CLEANUP                                                         │
└──────────────────────────────────────────────────────────────────────────┘
   DELETE /api/diary/507f1f77...
   Headers: Authorization: Bearer eyJhbGc...
                 │
                 ▼
   ✓ Test diary deleted
   ✓ Test data cleaned up
                 │
                 ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                          ALL TESTS PASSED ✓                              ║
╚══════════════════════════════════════════════════════════════════════════╝

Services Validated:
  ✓ MongoDB database connectivity
  ✓ Backend API (Express + MongoDB)
  ✓ ML Service (Python + BERT + FLAN-T5)
  ✓ Job Queue (async processing)
  ✓ End-to-end flow (register → login → diary → ML → emotion)

Test Artifacts:
  • User: testuser_1730149230@apricity.test
  • Diary ID: 507f1f77bcf86cd799439011 (deleted)
  • Duration: 87 seconds
  • Exit Code: 0

```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ANY STEP FAILS                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                 │
                 ▼
   Print error message (RED)
   Show relevant logs
   Exit with code 1
                 │
                 ▼
   Example errors:
   • Service not healthy → Show docker logs
   • Registration fails → Show API response
   • No emotion data → Check ML service logs
   • Validation fails → Show expected vs actual

Exit Code 1 → CI/CD Pipeline Fails ❌
```

## Success Flow Summary

```
Dependencies → Services → Health → Auth → Diary → ML → Validate → Cleanup → ✓

Total Time: 60-90 seconds
Exit Code: 0
All Assertions: Passed
```
