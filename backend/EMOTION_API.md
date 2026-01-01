# Emotion API Documentation

## Overview

The Emotion API provides endpoints for retrieving and analyzing emotion data detected from diary entries. It includes aggregated statistics for charting, warnings for negative emotion patterns, and individual emotion lookups.

## Base URL

```
/api/emotion
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Get Emotion Log (Aggregated for Charting)

**GET** `/api/emotion/log`

Returns aggregated emotion scores grouped by day or week for data visualization.

**Query Parameters:**

- `range` (optional): Time range - `weekly` or `monthly` (default: `monthly`)
- `start` (optional): Start date in ISO 8601 format `YYYY-MM-DD` (default: today)
- `groupBy` (optional): Grouping - `day` or `week` (default: `day`)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "range": "weekly",
    "groupBy": "day",
    "startDate": "2025-10-21T00:00:00.000Z",
    "endDate": "2025-10-28T00:00:00.000Z",
    "totalEntries": 7,
    "data": [
      {
        "date": "2025-10-21",
        "count": 3,
        "emotions": {
          "joy": 0.654,
          "gratitude": 0.421,
          "excitement": 0.312,
          "neutral": 0.089
        },
        "categories": {
          "positive": 2,
          "negative": 1,
          "ambiguous": 0,
          "neutral": 0
        },
        "topEmotions": {
          "joy": 2,
          "sadness": 1
        },
        "topEmotionsList": [
          { "emotion": "joy", "score": 0.654 },
          { "emotion": "gratitude", "score": 0.421 },
          { "emotion": "excitement", "score": 0.312 }
        ],
        "dominantEmotion": {
          "emotion": "joy",
          "frequency": 2
        },
        "averageConfidence": 0.823
      }
    ],
    "summary": {
      "totalEmotions": 21,
      "categories": {
        "positive": 14,
        "negative": 5,
        "ambiguous": 2,
        "neutral": 0
      },
      "overallAverageConfidence": 0.786,
      "mostFrequentEmotion": {
        "emotion": "joy",
        "count": 8
      }
    }
  }
}
```

**Response Fields:**

- `data`: Array of aggregated emotion data points
  - `date`: Date key (YYYY-MM-DD)
  - `count`: Number of emotion entries for this period
  - `emotions`: Average scores for each emotion (0-1)
  - `categories`: Count of emotions by category
  - `topEmotionsList`: Top 5 emotions by score
  - `dominantEmotion`: Most frequently occurring emotion
  - `averageConfidence`: Average model confidence
- `summary`: Overall statistics across the entire range

**Empty Data Response:**

```json
{
  "success": true,
  "data": {
    "range": "weekly",
    "groupBy": "day",
    "startDate": "2025-10-21T00:00:00.000Z",
    "endDate": "2025-10-28T00:00:00.000Z",
    "totalEntries": 0,
    "data": [],
    "summary": {
      "totalEmotions": 0,
      "categories": {
        "positive": 0,
        "negative": 0,
        "ambiguous": 0,
        "neutral": 0
      }
    }
  }
}
```

**Use Cases:**

- Line charts showing emotion trends over time
- Bar charts for daily/weekly emotion distributions
- Pie charts for emotion category breakdowns
- Heatmaps of emotional patterns

**cURL Example:**

```bash
# Get daily emotions for the past week
curl -X GET "http://localhost:5000/api/emotion/log?range=weekly&groupBy=day" \
  -H "Authorization: Bearer <your-token>"

# Get weekly aggregations for the past month starting from Oct 1
curl -X GET "http://localhost:5000/api/emotion/log?range=monthly&start=2025-10-01&groupBy=week" \
  -H "Authorization: Bearer <your-token>"
```

---

### 2. Get Suggestions & Warnings

**GET** `/api/emotion/suggest`

Analyzes emotion patterns and returns warnings if negative emotions exceed thresholds, along with actionable suggestions.

**Query Parameters:**

- `start` (optional): Start date in ISO 8601 format (default: 7 days ago)
- `end` (optional): End date in ISO 8601 format (default: today)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "startDate": "2025-10-21T00:00:00.000Z",
    "endDate": "2025-10-28T00:00:00.000Z",
    "totalEmotions": 25,
    "analysis": {
      "percentages": {
        "positive": 56.0,
        "negative": 32.0,
        "ambiguous": 8.0,
        "neutral": 4.0
      },
      "criticalEmotionsCount": 2,
      "consecutiveNegativeDays": 0,
      "mostFrequentEmotion": {
        "emotion": "joy",
        "count": 8
      }
    },
    "warnings": [],
    "suggestions": [
      {
        "type": "positive_trend",
        "message": "Great job maintaining a positive emotional state!",
        "priority": "low",
        "encouragement": "Keep up the practices that bring you joy and peace"
      }
    ],
    "severity": "none"
  }
}
```

**With Warnings Response:**

```json
{
  "success": true,
  "data": {
    "startDate": "2025-10-21T00:00:00.000Z",
    "endDate": "2025-10-28T00:00:00.000Z",
    "totalEmotions": 25,
    "analysis": {
      "percentages": {
        "positive": 28.0,
        "negative": 68.0,
        "ambiguous": 4.0,
        "neutral": 0.0
      },
      "criticalEmotionsCount": 8,
      "consecutiveNegativeDays": 5,
      "mostFrequentEmotion": {
        "emotion": "sadness",
        "count": 9
      }
    },
    "warnings": [
      {
        "type": "high_negative_emotions",
        "message": "68.0% of your emotions are negative",
        "severity": "high",
        "details": "You've experienced predominantly negative emotions in the past 7 days"
      },
      {
        "type": "critical_emotions_detected",
        "message": "Detected 8 instances of concerning emotions",
        "severity": "high",
        "details": "Emotions like sadness, grief, and fear have appeared frequently"
      },
      {
        "type": "prolonged_negative_pattern",
        "message": "5 consecutive days with predominantly negative emotions",
        "severity": "high",
        "details": "Extended periods of negative emotions may indicate a need for additional support"
      }
    ],
    "suggestions": [
      {
        "type": "seek_support",
        "message": "Consider reaching out to a mental health professional",
        "priority": "high",
        "resources": [
          "National Suicide Prevention Lifeline: 988",
          "Crisis Text Line: Text HOME to 741741"
        ]
      },
      {
        "type": "coping_strategies",
        "message": "Try grounding techniques and mindfulness exercises",
        "priority": "medium",
        "activities": [
          "Deep breathing exercises",
          "Progressive muscle relaxation",
          "Mindful walking",
          "Journaling about your feelings"
        ]
      },
      {
        "type": "emotion_specific",
        "message": "Your most frequent emotion is \"sadness\"",
        "priority": "medium",
        "suggestion": "Consider CBT techniques specifically for managing sadness"
      }
    ],
    "severity": "high"
  }
}
```

**Severity Levels:**

- `none`: No concerning patterns detected
- `medium`: Elevated negative emotions (40-60%) or some critical emotions
- `high`: High negative emotions (>60%), multiple critical emotions, or prolonged negative patterns

**Warning Thresholds:**

- **High Negative Emotions**: >60% of emotions are negative
- **Elevated Negative**: 40-60% negative
- **Critical Emotions**: 3+ instances of sadness, grief, fear, or remorse
- **Prolonged Pattern**: 5+ consecutive days with negative emotions

**Suggestion Types:**

- `seek_support`: Professional help recommended
- `coping_strategies`: CBT techniques and activities
- `emotion_specific`: Targeted advice for specific emotions
- `positive_trend`: Encouragement for positive patterns

**cURL Example:**

```bash
# Get suggestions for last 7 days (default)
curl -X GET "http://localhost:5000/api/emotion/suggest" \
  -H "Authorization: Bearer <your-token>"

# Get suggestions for specific date range
curl -X GET "http://localhost:5000/api/emotion/suggest?start=2025-10-01&end=2025-10-28" \
  -H "Authorization: Bearer <your-token>"
```

---

### 3. Get Emotion for Diary Entry

**GET** `/api/emotion/:diaryId`

Retrieve the emotion analysis for a specific diary entry.

**URL Parameters:**

- `diaryId` (required): MongoDB ObjectId of the diary entry

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "emotion": {
      "id": "507f1f77bcf86cd799439012",
      "diaryId": "507f1f77bcf86cd799439011",
      "date": "2025-10-28T10:00:00.000Z",
      "topLabel": "joy",
      "detectedEmotions": ["joy", "gratitude", "excitement"],
      "confidence": 0.87,
      "category": "positive",
      "scores": {
        "joy": 0.87,
        "gratitude": 0.65,
        "excitement": 0.54,
        "neutral": 0.12,
        "admiration": 0.08
      },
      "topEmotions": [
        { "emotion": "joy", "score": 0.87 },
        { "emotion": "gratitude", "score": 0.65 },
        { "emotion": "excitement", "score": 0.54 },
        { "emotion": "neutral", "score": 0.12 },
        { "emotion": "admiration", "score": 0.08 }
      ],
      "modelVersion": "1.0.0",
      "createdAt": "2025-10-28T10:15:30.000Z"
    }
  }
}
```

**Error Responses:**

_403 - Access Denied:_

```json
{
  "success": false,
  "message": "Access denied. You can only view emotions for your own diary entries."
}
```

_404 - Diary Not Found:_

```json
{
  "success": false,
  "message": "Diary entry not found"
}
```

_404 - No Emotion Data:_

```json
{
  "success": false,
  "message": "No emotion analysis found for this diary entry",
  "note": "Analysis may still be in progress or failed"
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:5000/api/emotion/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <your-token>"
```

---

## Emotion Categories

Emotions are categorized into four groups:

### Positive Emotions (12)

`admiration`, `amusement`, `approval`, `caring`, `desire`, `excitement`, `gratitude`, `joy`, `love`, `optimism`, `pride`, `relief`

### Negative Emotions (13)

`anger`, `annoyance`, `disappointment`, `disapproval`, `disgust`, `embarrassment`, `fear`, `grief`, `nervousness`, `remorse`, `sadness`

### Ambiguous Emotions (4)

`confusion`, `curiosity`, `realization`, `surprise`

### Neutral (1)

`neutral`

---

## Use Cases

### 1. Emotion Dashboard

Combine `/log` and `/suggest` endpoints:

```javascript
// Fetch emotion trends
const logResponse = await fetch("/api/emotion/log?range=monthly&groupBy=day");
const logData = await logResponse.json();

// Get suggestions
const suggestResponse = await fetch("/api/emotion/suggest");
const suggestions = await suggestResponse.json();

// Display charts + warnings on dashboard
```

### 2. Diary Detail View

Show emotion analysis alongside diary content:

```javascript
const emotionResponse = await fetch(`/api/emotion/${diaryId}`);
const emotionData = await emotionResponse.json();

// Display top emotions, confidence, category
```

### 3. Weekly Reports

Generate weekly emotion summaries:

```javascript
const response = await fetch("/api/emotion/log?range=weekly&groupBy=week");
const data = await response.json();

// Email or display weekly emotion report
```

---

## Error Handling

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (No/invalid token)
- `403` - Forbidden (Not owner)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**

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

---

## JavaScript Examples

### Fetch Weekly Emotion Log

```javascript
const fetchEmotionLog = async (token) => {
  const response = await fetch(
    "http://localhost:5000/api/emotion/log?range=weekly&groupBy=day",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (data.success) {
    // Use data.data.data for chart
    const chartData = data.data.data.map((entry) => ({
      date: entry.date,
      positive: entry.categories.positive,
      negative: entry.categories.negative,
      confidence: entry.averageConfidence,
    }));

    return chartData;
  }
};
```

### Get Mental Health Suggestions

```javascript
const getSuggestions = async (token) => {
  const response = await fetch("http://localhost:5000/api/emotion/suggest", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.success) {
    const { warnings, suggestions, severity } = data.data;

    // Display warnings with appropriate UI
    if (severity === "high") {
      showCriticalAlert(warnings, suggestions);
    } else if (severity === "medium") {
      showWarningAlert(warnings, suggestions);
    } else {
      showPositiveFeedback(suggestions);
    }
  }
};
```

### Chart.js Integration Example

```javascript
// Prepare data for Chart.js
const prepareChartData = (emotionLog) => {
  return {
    labels: emotionLog.map((entry) => entry.date),
    datasets: [
      {
        label: "Positive",
        data: emotionLog.map((entry) => entry.categories.positive),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
      {
        label: "Negative",
        data: emotionLog.map((entry) => entry.categories.negative),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
      },
    ],
  };
};
```

---

## Best Practices

1. **Caching**: Cache emotion log data for a short period to reduce API calls
2. **Date Ranges**: Use appropriate date ranges for your visualizations
3. **Grouping**: Use `day` for detailed views, `week` for broader trends
4. **Warnings**: Display warnings prominently with crisis resources
5. **Privacy**: Never expose emotion data to unauthorized users
6. **Updates**: Poll for diary emotion updates if `aiAnalyzed` is false

---

## Crisis Resources

Always display these resources when high-severity warnings are present:

- **National Suicide Prevention Lifeline** (US): 988
- **Crisis Text Line** (US): Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/
