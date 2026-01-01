# Suggestions API Documentation

## Overview

The Suggestions API provides rule-based mental health suggestions based on aggregated emotion statistics. This is a **placeholder implementation** that will be replaced with a generative model (FLAN-T5 or similar) in future versions.

**Base URL:** `/api/suggestions`

**Authentication:** All endpoints require JWT authentication via Bearer token.

---

## Endpoints

### 1. Generate Suggestions

Generate personalized mental health suggestions based on emotion statistics.

**Endpoint:** `POST /api/suggestions`

**Authentication:** Required (JWT Bearer Token)

#### Request Body

```json
{
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
}
```

#### Request Parameters

| Field                   | Type    | Required | Description                                      |
| ----------------------- | ------- | -------- | ------------------------------------------------ |
| `daysAnalyzed`          | integer | Yes      | Number of days included in the analysis (min: 1) |
| `consecutiveDays`       | integer | No       | Number of consecutive days with similar patterns |
| `emotionScores`         | object  | Yes      | Average scores for each emotion (0-1 scale)      |
| `emotionScores.sadness` | float   | No       | Average sadness score (0.0-1.0)                  |
| `emotionScores.anxiety` | float   | No       | Average anxiety score (0.0-1.0)                  |
| `emotionScores.anger`   | float   | No       | Average anger score (0.0-1.0)                    |
| `emotionScores.fear`    | float   | No       | Average fear score (0.0-1.0)                     |
| `emotionScores.grief`   | float   | No       | Average grief score (0.0-1.0)                    |
| `percentages`           | object  | Yes      | Percentage breakdown by emotion category         |
| `percentages.positive`  | float   | Yes      | Percentage of positive emotions (0-100)          |
| `percentages.negative`  | float   | Yes      | Percentage of negative emotions (0-100)          |
| `percentages.neutral`   | float   | No       | Percentage of neutral emotions (0-100)           |
| `emotionalVariability`  | float   | No       | Measure of emotional volatility (0.0-1.0)        |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "userId": "507f191e810c19729de860ea",
    "generatedAt": "2025-10-28T10:30:00.000Z",
    "period": {
      "daysAnalyzed": 7,
      "consecutiveDays": 7
    },
    "analysis": {
      "severity": "high",
      "criticalEmotionScore": 0.642,
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
    },
    "warnings": [
      {
        "level": "high",
        "message": "Prolonged sadness detected",
        "duration": "7 days"
      }
    ],
    "suggestions": [
      {
        "type": "professional_help",
        "priority": "critical",
        "title": "Consider Professional Support",
        "message": "You've been experiencing persistent sadness for over a week...",
        "action": "Schedule an appointment with a mental health professional",
        "resources": [
          {
            "name": "National Suicide Prevention Lifeline",
            "contact": "988",
            "available": "24/7"
          }
        ],
        "reason": "Sadness score: 65.0% over 7 consecutive days"
      }
    ],
    "totalSuggestions": 1,
    "implementationNote": "TODO: Replace rule-based engine with generative model (FLAN-T5) for more personalized, context-aware suggestions"
  }
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "errors": [
    {
      "field": "daysAnalyzed",
      "message": "daysAnalyzed must be a positive integer"
    }
  ]
}
```

---

### 2. Get Rule Information

Get information about the rule-based suggestion engine and its rules.

**Endpoint:** `GET /api/suggestions/rules`

**Authentication:** Required (JWT Bearer Token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "engineType": "rule-based",
    "version": "1.0.0",
    "status": "active",
    "implementationNote": "This is a placeholder rule-based engine...",
    "rules": [
      {
        "id": 1,
        "name": "Prolonged Sadness",
        "trigger": "sadness > 0.6 for 7+ days AND negative > 60%",
        "severity": "high",
        "suggestion": "Professional mental health support"
      }
    ],
    "severityLevels": {
      "high": "Immediate professional attention recommended",
      "medium": "Consider seeking professional guidance",
      "low": "Monitor and practice self-care",
      "none": "No concerns detected"
    },
    "futureEnhancements": [
      "Integration with FLAN-T5 generative model",
      "Personalized suggestions based on user history"
    ]
  }
}
```

---

## Rule-Based Engine Logic

### Current Rules

The rule-based engine implements 10 rules:

#### 1. **Prolonged Sadness** (Critical Priority)

- **Trigger:** Sadness > 0.6 for 7+ days AND negative emotions > 60%
- **Severity:** High
- **Suggestion:** Professional mental health support
- **Resources:** Crisis hotlines, therapist referrals

#### 2. **High Anxiety** (High Priority)

- **Trigger:** Anxiety > 0.65 for 5+ days
- **Severity:** High
- **Suggestion:** Anxiety management techniques and therapy
- **Techniques:** Breathing exercises, grounding, mindfulness

#### 3. **Grief Detection** (High Priority)

- **Trigger:** Grief > 0.5 for 3+ days
- **Severity:** Medium-High
- **Suggestion:** Grief counseling or support groups
- **Resources:** GriefShare, grief recovery programs

#### 4. **Elevated Anger** (Medium Priority)

- **Trigger:** Anger > 0.6 for 4+ days
- **Severity:** Medium
- **Suggestion:** Anger management strategies
- **Techniques:** Timeouts, exercise, assertive communication

#### 5. **Persistent Fear** (High Priority)

- **Trigger:** Fear > 0.55 for 5+ days
- **Severity:** High
- **Suggestion:** Therapy for fear/anxiety (CBT, exposure therapy)
- **Approaches:** CBT, exposure therapy, EMDR, ACT

#### 6. **Overall Negative Pattern** (High Priority)

- **Trigger:** Negative emotions > 70% for 5+ days
- **Severity:** High
- **Suggestion:** Mental health evaluation
- **Action:** Talk to primary care, seek referral

#### 7. **Low Positive Emotions** (Medium Priority)

- **Trigger:** Positive emotions < 10% for 7+ days
- **Severity:** Medium
- **Suggestion:** Increase pleasant activities
- **Activities:** Social connection, hobbies, nature, gratitude

#### 8. **Emotional Volatility** (Medium Priority)

- **Trigger:** Emotional variability > 0.7
- **Severity:** Medium
- **Suggestion:** Emotional regulation skills (DBT)
- **Techniques:** Mood diary, mindfulness, DBT skills, routine

#### 9. **Positive Trends** (Low Priority)

- **Trigger:** Positive emotions > 60%
- **Severity:** None
- **Suggestion:** Maintain current practices
- **Encouragement:** Positive reinforcement

#### 10. **Emotional Balance** (Low Priority)

- **Trigger:** Negative < 40%, Positive > 30%, Variability < 0.4
- **Severity:** None
- **Suggestion:** Continue self-care routine
- **Tips:** Maintenance strategies

### Severity Calculation

Severity is calculated based on:

1. **High Severity:**

   - Negative percentage > 70%
   - Consecutive negative days ≥ 7
   - Critical emotion score > 0.7

2. **Medium Severity:**

   - Negative percentage > 50%
   - Consecutive negative days ≥ 5
   - Critical emotion score > 0.5

3. **Low Severity:**

   - Negative percentage > 30%
   - Consecutive negative days ≥ 3
   - Critical emotion score > 0.3

4. **None:**
   - Below all thresholds

### Critical Emotion Score

The critical emotion score is a weighted average:

```
score = (sadness * 1.5 + grief * 1.5 + fear * 1.2 + anxiety * 1.0 + anger * 0.8) / 6.0
```

Higher weights are given to emotions that typically indicate more severe distress.

---

## Integration with Frontend

### Example: Fetch Suggestions

```javascript
// Calculate emotion statistics from user's diary entries
const emotionStats = {
  daysAnalyzed: 7,
  consecutiveDays: 5,
  emotionScores: {
    sadness: 0.65,
    anxiety: 0.42,
    anger: 0.28,
    fear: 0.35,
    grief: 0.15,
  },
  percentages: {
    positive: 15.2,
    negative: 68.3,
    neutral: 16.5,
  },
  emotionalVariability: 0.45,
};

// Request suggestions
const response = await fetch("http://localhost:5000/api/suggestions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(emotionStats),
});

const data = await response.json();

if (data.success) {
  // Display suggestions to user
  data.data.suggestions.forEach((suggestion) => {
    console.log(`[${suggestion.priority}] ${suggestion.title}`);
    console.log(suggestion.message);

    if (suggestion.resources) {
      console.log("Resources:", suggestion.resources);
    }
  });
}
```

### Example: Display in UI

```jsx
function SuggestionsPanel({ suggestions }) {
  const priorityColors = {
    critical: "red",
    high: "orange",
    medium: "yellow",
    low: "blue",
  };

  return (
    <div className="suggestions-panel">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`suggestion-card priority-${suggestion.priority}`}
          style={{
            borderLeft: `4px solid ${priorityColors[suggestion.priority]}`,
          }}
        >
          <h3>{suggestion.title}</h3>
          <p>{suggestion.message}</p>
          <p className="action">
            <strong>Action:</strong> {suggestion.action}
          </p>

          {suggestion.resources && (
            <div className="resources">
              <h4>Resources:</h4>
              <ul>
                {suggestion.resources.map((resource, i) => (
                  <li key={i}>
                    <strong>{resource.name}:</strong> {resource.contact}
                    {resource.available && ` (${resource.available})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestion.techniques && (
            <div className="techniques">
              <h4>Techniques to Try:</h4>
              <ul>
                {suggestion.techniques.map((technique, i) => (
                  <li key={i}>{technique}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Future Enhancements (TODO)

### Replace with Generative Model

The current rule-based system is a placeholder. Future versions will integrate with a generative model for more sophisticated suggestions:

#### Planned Integration with FLAN-T5

```javascript
// Future implementation (pseudocode)
async function generatePersonalizedSuggestion(userContext) {
  const prompt = `
    User Emotion Profile (Last 7 Days):
    - Sadness: ${userContext.sadness * 100}%
    - Anxiety: ${userContext.anxiety * 100}%
    - Recent Diary Excerpts: "${userContext.recentEntries}"
    
    Based on this emotional profile, provide a compassionate, 
    actionable mental health suggestion in 2-3 sentences.
  `;

  const response = await fetch("http://ml-service:8000/api/v1/generate", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      max_length: 150,
      temperature: 0.7,
    }),
  });

  return response.json();
}
```

#### Benefits of Generative Model

- **Personalization:** Context-aware suggestions based on diary content
- **Natural Language:** More human-like, empathetic responses
- **Flexibility:** Can adapt to nuanced emotional patterns
- **Multi-modal:** Can incorporate user preferences, history, goals
- **Dynamic:** Can generate novel suggestions beyond predefined rules

---

## Error Handling

### Common Errors

| Status Code | Error                 | Cause                     | Solution                                           |
| ----------- | --------------------- | ------------------------- | -------------------------------------------------- |
| 400         | Validation Error      | Invalid request format    | Check request body matches schema                  |
| 401         | Unauthorized          | Missing/invalid JWT token | Include valid Bearer token in Authorization header |
| 500         | Internal Server Error | Server processing error   | Check server logs, retry request                   |

### Error Response Format

```json
{
  "success": false,
  "message": "Error generating suggestions",
  "errors": [
    {
      "field": "emotionScores",
      "message": "emotionScores must be an object"
    }
  ]
}
```

---

## Testing

### Example Test with curl

```bash
# Get JWT token first
TOKEN="your-jwt-token-here"

# Generate suggestions
curl -X POST http://localhost:5000/api/suggestions \
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
  }'

# Get rule information
curl -X GET http://localhost:5000/api/suggestions/rules \
  -H "Authorization: Bearer $TOKEN"
```

### Example Test with Jest

```javascript
describe("POST /api/suggestions", () => {
  it("should generate suggestions for high sadness", async () => {
    const emotionStats = {
      daysAnalyzed: 7,
      consecutiveDays: 7,
      emotionScores: {
        sadness: 0.65,
        anxiety: 0.42,
      },
      percentages: {
        positive: 15.2,
        negative: 68.3,
        neutral: 16.5,
      },
    };

    const response = await request(app)
      .post("/api/suggestions")
      .set("Authorization", `Bearer ${token}`)
      .send(emotionStats);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.suggestions).toBeDefined();
    expect(response.body.data.suggestions.length).toBeGreaterThan(0);
    expect(response.body.data.suggestions[0].priority).toBe("critical");
  });
});
```

---

## Notes

- This is a **temporary rule-based implementation**
- Rules are based on common mental health indicators
- **Not a replacement for professional mental health diagnosis**
- Crisis resources are always provided for high-severity cases
- Will be replaced with ML-based generative suggestions in future versions

---

## Support Resources

The API always includes these critical resources in high-severity suggestions:

- **National Suicide Prevention Lifeline:** 988 (24/7)
- **Crisis Text Line:** Text HOME to 741741 (24/7)
- **SAMHSA National Helpline:** 1-800-662-4357 (24/7)

---

**Last Updated:** October 28, 2025  
**API Version:** 1.0.0  
**Status:** Placeholder Implementation (Rule-Based)
