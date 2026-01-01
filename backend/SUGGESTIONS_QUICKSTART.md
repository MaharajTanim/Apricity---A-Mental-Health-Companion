# Suggestions API - Quick Start Guide

## Overview

The `/api/suggestions` endpoint provides rule-based mental health suggestions based on aggregated emotion statistics. This is a **placeholder implementation** that will be replaced with a generative model (FLAN-T5) in future versions.

---

## Quick Example

### Step 1: Gather Emotion Statistics

First, collect emotion data from the user's recent diary entries using the emotion log endpoint:

```bash
# Get emotion log for last 7 days
curl -X GET "http://localhost:5000/api/emotion/log?range=weekly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 2: Calculate Aggregated Statistics

From the emotion log response, calculate:

- Average emotion scores for key emotions (sadness, anxiety, anger, fear, grief)
- Percentage breakdown (positive, negative, neutral)
- Number of consecutive days with similar patterns
- Optional: Emotional variability

### Step 3: Request Suggestions

```bash
curl -X POST "http://localhost:5000/api/suggestions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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
```

### Response

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
      }
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
        "message": "You've been experiencing persistent sadness for over a week. This could indicate depression or other concerns that would benefit from professional support.",
        "action": "Schedule an appointment with a mental health professional",
        "resources": [
          {
            "name": "National Suicide Prevention Lifeline",
            "contact": "988",
            "available": "24/7"
          },
          {
            "name": "Crisis Text Line",
            "contact": "Text HOME to 741741",
            "available": "24/7"
          }
        ],
        "reason": "Sadness score: 65.0% over 7 consecutive days"
      }
    ],
    "totalSuggestions": 1,
    "implementationNote": "TODO: Replace rule-based engine with generative model (FLAN-T5)"
  }
}
```

---

## Frontend Integration Example

### React Component

```jsx
import React, { useState, useEffect } from "react";

function SuggestionsPanel({ userId, token }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("none");

  useEffect(() => {
    fetchSuggestions();
  }, [userId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      // Step 1: Get emotion log
      const emotionLogResponse = await fetch(
        "http://localhost:5000/api/emotion/log?range=weekly",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const emotionLog = await emotionLogResponse.json();

      // Step 2: Calculate statistics
      const stats = calculateEmotionStatistics(emotionLog.data);

      // Step 3: Get suggestions
      const suggestionsResponse = await fetch(
        "http://localhost:5000/api/suggestions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(stats),
        }
      );
      const result = await suggestionsResponse.json();

      if (result.success) {
        setSuggestions(result.data.suggestions);
        setSeverity(result.data.analysis.severity);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEmotionStatistics = (emotionData) => {
    // Calculate averages from emotion log data
    const { data: entries, summary } = emotionData;

    // Calculate average emotion scores
    const emotionScores = {
      sadness: 0,
      anxiety: 0,
      anger: 0,
      fear: 0,
      grief: 0,
    };

    let consecutiveDays = 0;
    let maxConsecutive = 0;

    entries.forEach((entry, index) => {
      // Accumulate emotion scores
      Object.keys(emotionScores).forEach((emotion) => {
        emotionScores[emotion] += entry.emotions[emotion] || 0;
      });

      // Count consecutive negative days
      const negativeRatio = entry.categories.negative / entry.count;
      if (negativeRatio > 0.5) {
        consecutiveDays++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
      } else {
        consecutiveDays = 0;
      }
    });

    // Average emotion scores
    Object.keys(emotionScores).forEach((emotion) => {
      emotionScores[emotion] /= entries.length;
    });

    // Calculate percentages
    const percentages = {
      positive: (summary.categories.positive / summary.totalEmotions) * 100,
      negative: (summary.categories.negative / summary.totalEmotions) * 100,
      neutral: (summary.categories.neutral / summary.totalEmotions) * 100,
    };

    return {
      daysAnalyzed: entries.length,
      consecutiveDays: maxConsecutive,
      emotionScores,
      percentages,
    };
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: "#dc2626",
      high: "#ea580c",
      medium: "#f59e0b",
      low: "#3b82f6",
    };
    return colors[priority] || "#6b7280";
  };

  const getSeverityBadge = () => {
    const badges = {
      high: { color: "red", text: "High Priority" },
      medium: { color: "orange", text: "Moderate" },
      low: { color: "yellow", text: "Low Priority" },
      none: { color: "green", text: "Stable" },
    };
    return badges[severity] || badges.none;
  };

  if (loading) {
    return <div className="loading">Loading suggestions...</div>;
  }

  return (
    <div className="suggestions-panel">
      <div
        className="severity-badge"
        style={{ backgroundColor: getSeverityBadge().color }}
      >
        {getSeverityBadge().text}
      </div>

      {suggestions.length === 0 ? (
        <div className="no-suggestions">
          <p>
            No specific suggestions at this time. Keep up your self-care
            routine!
          </p>
        </div>
      ) : (
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-card"
              style={{
                borderLeft: `4px solid ${getPriorityColor(
                  suggestion.priority
                )}`,
              }}
            >
              <div className="suggestion-header">
                <h3>{suggestion.title}</h3>
                <span
                  className={`priority-badge priority-${suggestion.priority}`}
                >
                  {suggestion.priority.toUpperCase()}
                </span>
              </div>

              <p className="suggestion-message">{suggestion.message}</p>

              <div className="suggestion-action">
                <strong>Action:</strong> {suggestion.action}
              </div>

              {suggestion.resources && (
                <div className="resources">
                  <h4>Resources:</h4>
                  <ul>
                    {suggestion.resources.map((resource, i) => (
                      <li key={i}>
                        <strong>{resource.name}:</strong> {resource.contact}
                        {resource.available && (
                          <span> ({resource.available})</span>
                        )}
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

              {suggestion.activities && (
                <div className="activities">
                  <h4>Suggested Activities:</h4>
                  <ul>
                    {suggestion.activities.map((activity, i) => (
                      <li key={i}>{activity}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="suggestion-reason">
                <small>
                  <em>{suggestion.reason}</em>
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestionsPanel;
```

### CSS Styling

```css
.suggestions-panel {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.severity-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
  margin-bottom: 20px;
}

.suggestion-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.suggestion-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
}

.priority-critical {
  background: #dc2626;
}

.priority-high {
  background: #ea580c;
}

.priority-medium {
  background: #f59e0b;
}

.priority-low {
  background: #3b82f6;
}

.suggestion-message {
  line-height: 1.6;
  margin-bottom: 15px;
}

.suggestion-action {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.resources,
.techniques,
.activities {
  margin-top: 15px;
}

.resources h4,
.techniques h4,
.activities h4 {
  font-size: 1rem;
  margin-bottom: 10px;
  color: #374151;
}

.resources ul,
.techniques ul,
.activities ul {
  list-style: none;
  padding: 0;
}

.resources li,
.techniques li,
.activities li {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.suggestion-reason {
  margin-top: 15px;
  color: #6b7280;
  font-size: 0.875rem;
}
```

---

## Rule Engine Information

To see what rules trigger which suggestions:

```bash
curl -X GET "http://localhost:5000/api/suggestions/rules" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing

Run the test suite:

```bash
cd backend
npm test -- suggestions.test.js
```

**Test Coverage:**

- ✅ 23 tests passing
- ✅ 95.23% statement coverage
- ✅ 83.11% branch coverage

---

## TODO: Future Generative Model Integration

The current rule-based engine will be replaced with a generative model:

```javascript
// Future implementation (pseudocode)
async function getGenerativeSuggestions(emotionStats, diaryContext) {
  const response = await fetch("http://ml-service:8000/api/v1/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `
        User emotional profile over ${emotionStats.daysAnalyzed} days:
        - Sadness: ${emotionStats.sadnessScore * 100}%
        - Anxiety: ${emotionStats.anxietyScore * 100}%
        - Negative emotions: ${emotionStats.negativePercentage}%
        
        Recent diary excerpts:
        "${diaryContext.recentEntries}"
        
        Provide a compassionate, actionable mental health suggestion.
      `,
      max_length: 200,
      temperature: 0.7,
    }),
  });

  return response.json();
}
```

---

## Support Resources

High-severity suggestions always include crisis resources:

- **National Suicide Prevention Lifeline:** 988 (24/7)
- **Crisis Text Line:** Text HOME to 741741 (24/7)
- **SAMHSA National Helpline:** 1-800-662-4357 (24/7)

---

**Last Updated:** October 28, 2025  
**Status:** Placeholder Implementation (Rule-Based)  
**Future:** Will integrate with FLAN-T5 generative model
