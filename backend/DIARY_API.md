# Diary API Documentation

## Overview

The Diary API allows users to create, read, update, and delete personal journal entries. All entries are automatically analyzed by the ML service for emotion detection.

## Base URL

```
/api/diary
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. List Diaries (Paginated)

**GET** `/api/diary`

Get all diary entries for the authenticated user with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)
- `sort` (optional): Sort field (options: `date`, `createdAt`, `-date`, `-createdAt`, default: `-date`)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "diaries": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "My Day Today",
        "content": "Had a wonderful day at the park with friends...",
        "snippet": "Had a wonderful day at the park with friends. We played frisbee and had a picnic. The weather was perfect and I felt really grateful for these moments...",
        "date": "2025-10-28T10:00:00.000Z",
        "mood": "good",
        "tags": ["friends", "outdoors", "gratitude"],
        "isPrivate": true,
        "aiAnalyzed": true,
        "emotionSummary": {
          "topEmotion": "joy",
          "detectedEmotions": ["joy", "gratitude", "excitement"],
          "confidence": 0.87,
          "category": "positive"
        },
        "createdAt": "2025-10-28T10:15:00.000Z",
        "updatedAt": "2025-10-28T10:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasMore": true
    }
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/diary?page=1&limit=10&sort=-date" \
  -H "Authorization: Bearer <your-token>"
```

---

### 2. Create Diary Entry

**POST** `/api/diary`

Create a new diary entry. Automatically triggers asynchronous ML emotion analysis.

**Request Body:**

```json
{
  "title": "My Day Today",
  "content": "Had a wonderful day at the park with friends. We played frisbee and had a picnic. The weather was perfect and I felt really grateful for these moments.",
  "date": "2025-10-28T10:00:00.000Z",
  "mood": "good",
  "tags": ["friends", "outdoors", "gratitude"]
}
```

**Field Requirements:**

- `title` (required): 1-200 characters
- `content` (required): 1-10000 characters
- `date` (optional): ISO 8601 date format (defaults to current date/time)
- `mood` (optional): One of `very_bad`, `bad`, `neutral`, `good`, `very_good`
- `tags` (optional): Array of strings

**Success Response (201):**

```json
{
  "success": true,
  "message": "Diary entry created successfully. Emotion analysis in progress.",
  "data": {
    "diary": {
      "id": "507f1f77bcf86cd799439011",
      "title": "My Day Today",
      "content": "Had a wonderful day at the park with friends...",
      "snippet": "Had a wonderful day at the park with friends. We played frisbee and had a picnic. The weather was perfect and I felt really grateful for these moments...",
      "date": "2025-10-28T10:00:00.000Z",
      "mood": "good",
      "tags": ["friends", "outdoors", "gratitude"],
      "isPrivate": true,
      "aiAnalyzed": false,
      "createdAt": "2025-10-28T10:15:00.000Z",
      "updatedAt": "2025-10-28T10:15:00.000Z"
    }
  }
}
```

**Notes:**

- Emotion analysis happens asynchronously in the background
- The response returns immediately (non-blocking)
- `aiAnalyzed` will be `false` initially, then updated to `true` once analysis completes
- Check the diary again later to see `emotionSummary`

**Error Responses:**

_400 - Validation Error:_

```json
{
  "success": false,
  "errors": [
    {
      "field": "content",
      "message": "Content is required"
    }
  ]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/diary \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Day Today",
    "content": "Had a wonderful day...",
    "mood": "good",
    "tags": ["friends", "outdoors"]
  }'
```

---

### 3. Get Single Diary Entry

**GET** `/api/diary/:id`

Retrieve a specific diary entry by ID. Only the owner can access their own entries.

**URL Parameters:**

- `id` (required): MongoDB ObjectId of the diary entry

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "diary": {
      "id": "507f1f77bcf86cd799439011",
      "title": "My Day Today",
      "content": "Had a wonderful day at the park with friends. We played frisbee and had a picnic. The weather was perfect and I felt really grateful for these moments.",
      "snippet": "Had a wonderful day at the park with friends. We played frisbee and had a picnic. The weather was perfect and I felt really grateful for these moments.",
      "date": "2025-10-28T10:00:00.000Z",
      "mood": "good",
      "tags": ["friends", "outdoors", "gratitude"],
      "isPrivate": true,
      "aiAnalyzed": true,
      "emotionSummary": {
        "topEmotion": "joy",
        "detectedEmotions": ["joy", "gratitude", "excitement"],
        "confidence": 0.87,
        "category": "positive"
      },
      "createdAt": "2025-10-28T10:15:00.000Z",
      "updatedAt": "2025-10-28T10:15:00.000Z"
    }
  }
}
```

**Error Responses:**

_400 - Invalid ID:_

```json
{
  "success": false,
  "errors": [
    {
      "field": "id",
      "message": "Invalid diary ID"
    }
  ]
}
```

_403 - Access Denied:_

```json
{
  "success": false,
  "message": "Access denied. You can only view your own diary entries."
}
```

_404 - Not Found:_

```json
{
  "success": false,
  "message": "Diary entry not found"
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/diary/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <your-token>"
```

---

### 4. Update Diary Entry

**PUT** `/api/diary/:id`

Update an existing diary entry. Only the owner can update their entries.

**URL Parameters:**

- `id` (required): MongoDB ObjectId of the diary entry

**Request Body (all fields optional):**

```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "date": "2025-10-28T12:00:00.000Z",
  "mood": "very_good",
  "tags": ["updated", "tags"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Diary entry updated successfully",
  "data": {
    "diary": {
      "id": "507f1f77bcf86cd799439011",
      "title": "Updated Title",
      "content": "Updated content...",
      "snippet": "Updated content...",
      "date": "2025-10-28T12:00:00.000Z",
      "mood": "very_good",
      "tags": ["updated", "tags"],
      "isPrivate": true,
      "aiAnalyzed": true,
      "emotionSummary": {
        "topEmotion": "joy",
        "detectedEmotions": ["joy", "gratitude", "excitement"],
        "confidence": 0.87,
        "category": "positive"
      },
      "createdAt": "2025-10-28T10:15:00.000Z",
      "updatedAt": "2025-10-28T12:30:00.000Z"
    }
  }
}
```

**Error Responses:**

_403 - Access Denied:_

```json
{
  "success": false,
  "message": "Access denied. You can only update your own diary entries."
}
```

_404 - Not Found:_

```json
{
  "success": false,
  "message": "Diary entry not found"
}
```

**cURL Example:**

```bash
curl -X PUT http://localhost:5000/api/diary/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "mood": "very_good"
  }'
```

---

### 5. Delete Diary Entry

**DELETE** `/api/diary/:id`

Delete a diary entry and its associated emotion data. Only the owner can delete their entries.

**URL Parameters:**

- `id` (required): MongoDB ObjectId of the diary entry

**Success Response (200):**

```json
{
  "success": true,
  "message": "Diary entry and associated emotion data deleted successfully"
}
```

**Error Responses:**

_403 - Access Denied:_

```json
{
  "success": false,
  "message": "Access denied. You can only delete your own diary entries."
}
```

_404 - Not Found:_

```json
{
  "success": false,
  "message": "Diary entry not found"
}
```

**cURL Example:**

```bash
curl -X DELETE http://localhost:5000/api/diary/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <your-token>"
```

---

## Response Fields

### Diary Object

- `id`: Unique identifier
- `title`: Entry title
- `content`: Full entry content
- `snippet`: First 200 characters (+ "..." if longer)
- `date`: Entry date/time
- `mood`: User's self-reported mood
- `tags`: Array of tags
- `isPrivate`: Privacy flag (always true by default)
- `aiAnalyzed`: Whether ML analysis has completed
- `emotionSummary`: Emotion analysis results (if available)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Emotion Summary Object

- `topEmotion`: Primary detected emotion
- `detectedEmotions`: Array of all detected emotions
- `confidence`: Model confidence score (0-1)
- `category`: Emotion category (positive/negative/ambiguous/neutral)

---

## ML Service Integration

### Automatic Emotion Analysis

When a diary entry is created:

1. Entry is saved to database immediately
2. ML service is called asynchronously (non-blocking)
3. Emotion detection happens in background
4. Results are saved and linked to diary entry
5. `aiAnalyzed` flag is set to `true`

### ML Service Endpoint Used

```
POST http://localhost:8000/api/v1/detect-emotion
```

**Request:**

```json
{
  "text": "Title. Content combined for analysis"
}
```

**Response:**

```json
{
  "emotions": "joy, gratitude, excitement",
  "confidence": 0.87,
  "all_emotions": ["joy", "gratitude", "excitement"]
}
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

**HTTP Status Codes:**

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (No/invalid token)
- `403` - Forbidden (Not owner)
- `404` - Not Found
- `500` - Internal Server Error

---

## JavaScript/Fetch Examples

**Create Entry:**

```javascript
const response = await fetch("http://localhost:5000/api/diary", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "My Day",
    content: "Had a great day...",
    mood: "good",
    tags: ["happy", "friends"],
  }),
});
const data = await response.json();
```

**List Entries:**

```javascript
const response = await fetch(
  "http://localhost:5000/api/diary?page=1&limit=10",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const data = await response.json();
const diaries = data.data.diaries;
```

**Update Entry:**

```javascript
const response = await fetch(`http://localhost:5000/api/diary/${diaryId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Updated Title",
    mood: "very_good",
  }),
});
```

---

## Best Practices

1. **Always check `aiAnalyzed` flag** before expecting emotion data
2. **Use pagination** for list queries to improve performance
3. **Include date** when creating entries for accurate timeline
4. **Use meaningful tags** for better organization and searching
5. **Handle 403 errors** properly (user doesn't own resource)
6. **Implement retry logic** if ML service is temporarily unavailable

---

## Environment Variables

Required in `.env`:

```
ML_SERVICE_URL=http://localhost:8000
```
