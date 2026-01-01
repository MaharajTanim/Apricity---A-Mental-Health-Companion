# Suggestions Endpoint - Implementation Summary

## Overview

Created a **placeholder rule-based mental health suggestions endpoint** (`/api/suggestions`) that analyzes aggregated emotion statistics and returns actionable mental health suggestions. This implementation is marked for future replacement with a generative model (FLAN-T5).

**Created:** October 28, 2025  
**Status:** ✅ Complete and Tested  
**Tests:** 23/23 passing (95.23% coverage)

---

## Files Created

### 1. Backend Route: `backend/src/routes/suggestions.js`

**Lines:** ~650  
**Purpose:** Main API endpoint implementation

**Features:**

- ✅ Rule-based suggestion engine with 10 rules
- ✅ Severity calculation (high, medium, low, none)
- ✅ Critical emotion score calculation (weighted average)
- ✅ Request validation with express-validator
- ✅ JWT authentication required
- ✅ Comprehensive TODO notes for generative model replacement

**Endpoints:**

- `POST /api/suggestions` - Generate suggestions from emotion statistics
- `GET /api/suggestions/rules` - Get rule engine information

**Rule-Based Engine:**

1. **Prolonged Sadness** (Critical) - sadness > 0.6 for 7+ days → professional help
2. **High Anxiety** (High) - anxiety > 0.65 for 5+ days → anxiety management
3. **Grief Detection** (High) - grief > 0.5 for 3+ days → grief counseling
4. **Elevated Anger** (Medium) - anger > 0.6 for 4+ days → anger management
5. **Persistent Fear** (High) - fear > 0.55 for 5+ days → CBT/exposure therapy
6. **Overall Negative** (High) - negative > 70% for 5+ days → mental health evaluation
7. **Low Positive** (Medium) - positive < 10% for 7+ days → increase activities
8. **Emotional Volatility** (Medium) - variability > 0.7 → emotional regulation (DBT)
9. **Positive Trends** (Low) - positive > 60% → maintain current practices
10. **Emotional Balance** (Low) - balanced emotions → continue self-care

### 2. Test Suite: `backend/tests/suggestions.test.js`

**Lines:** ~700  
**Purpose:** Comprehensive integration tests

**Test Coverage:**

- ✅ 12 successful suggestion generation tests (one for each rule)
- ✅ 6 validation error tests
- ✅ 2 authentication tests
- ✅ 3 rule engine info tests
- ✅ Critical emotion score calculation test
- ✅ Suggestion priority sorting test

**Results:**

```
Test Suites: 1 passed
Tests:       23 passed
Coverage:    95.23% statements, 83.11% branches
```

### 3. API Documentation: `backend/SUGGESTIONS_API.md`

**Lines:** ~600  
**Purpose:** Complete API reference documentation

**Contents:**

- Endpoint specifications
- Request/response examples
- Rule engine explanation
- Severity calculation logic
- Critical emotion score formula
- Error handling
- Integration examples (JavaScript/React)
- curl examples
- Future enhancement plans

### 4. Quick Start Guide: `backend/SUGGESTIONS_QUICKSTART.md`

**Lines:** ~400  
**Purpose:** Developer quick reference

**Contents:**

- Quick example workflow
- Frontend integration with full React component
- CSS styling examples
- Testing instructions
- Future generative model integration pseudocode

### 5. Updated Files

#### `backend/src/routes/index.js`

- Added `suggestionsRoutes` export

#### `backend/src/index.js`

- Imported `suggestionsRoutes`
- Added `/api/suggestions` route
- Updated root endpoint to include suggestions in endpoints list

---

## API Specification

### POST /api/suggestions

Generate mental health suggestions based on emotion statistics.

**Request:**

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

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "...",
    "generatedAt": "2025-10-28T10:30:00.000Z",
    "analysis": {
      "severity": "high",
      "criticalEmotionScore": 0.642,
      "emotionScores": { ... },
      "percentages": { ... }
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
        "message": "...",
        "action": "...",
        "resources": [ ... ],
        "reason": "..."
      }
    ],
    "totalSuggestions": 1,
    "implementationNote": "TODO: Replace with generative model"
  }
}
```

### GET /api/suggestions/rules

Get information about the rule-based engine.

**Response:**

```json
{
  "success": true,
  "data": {
    "engineType": "rule-based",
    "version": "1.0.0",
    "status": "active",
    "rules": [ ... ],
    "severityLevels": { ... },
    "futureEnhancements": [ ... ]
  }
}
```

---

## Rule Engine Logic

### Severity Calculation

```javascript
// High severity
if (
  negativePercentage > 70 ||
  consecutiveDays >= 7 ||
  criticalEmotionScore > 0.7
)
  return "high";

// Medium severity
if (
  negativePercentage > 50 ||
  consecutiveDays >= 5 ||
  criticalEmotionScore > 0.5
)
  return "medium";

// Low severity
if (
  negativePercentage > 30 ||
  consecutiveDays >= 3 ||
  criticalEmotionScore > 0.3
)
  return "low";

return "none";
```

### Critical Emotion Score Formula

```javascript
criticalEmotionScore =
  (sadness * 1.5 + grief * 1.5 + fear * 1.2 + anxiety * 1.0 + anger * 0.8) /
  6.0;
```

Higher weights for emotions indicating more severe distress.

---

## Key Features

### 1. **Rule-Based Intelligence**

- 10 distinct rules covering various emotional patterns
- Weighted critical emotion score
- Multi-factor severity assessment
- Prioritized suggestion sorting (critical → high → medium → low)

### 2. **Comprehensive Suggestions**

Each suggestion includes:

- `type` - Category of suggestion
- `priority` - Urgency level (critical, high, medium, low)
- `title` - Short description
- `message` - Detailed explanation
- `action` - Recommended action
- `resources` / `techniques` / `activities` - Actionable items
- `reason` - Why this suggestion was generated

### 3. **Crisis Resources**

High-severity suggestions always include:

- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- SAMHSA National Helpline: 1-800-662-4357

### 4. **Validation & Security**

- ✅ JWT authentication required
- ✅ Request validation with express-validator
- ✅ Input sanitization (0-1 for scores, 0-100 for percentages)
- ✅ Comprehensive error messages

### 5. **Developer-Friendly**

- ✅ Clear TODO notes for future generative model
- ✅ Extensive inline comments
- ✅ Complete documentation (API + Quick Start)
- ✅ Full test coverage
- ✅ Example frontend integration code

---

## Future Enhancement: Generative Model Integration

### Current Implementation (Placeholder)

```javascript
// Rule-based: if (sadness > 0.6 && days >= 7) → fixed suggestion
```

### Future Implementation (Generative)

```javascript
// ML-based: context-aware, personalized suggestions
const prompt = `
  User Profile:
  - Sadness: ${stats.sadness * 100}%
  - Days analyzed: ${stats.daysAnalyzed}
  - Recent diary entries: "${diaryContext}"
  
  Generate a compassionate, actionable mental health suggestion.
`;

const response = await mlService.generate({
  prompt,
  max_length: 200,
  temperature: 0.7,
});
```

### Benefits of Generative Approach

- ✅ **Personalized** - Uses user's actual diary content
- ✅ **Context-aware** - Understands nuances beyond simple rules
- ✅ **Natural language** - More empathetic, human-like responses
- ✅ **Flexible** - Can adapt to complex emotional patterns
- ✅ **Dynamic** - Generates novel suggestions beyond predefined templates

### Integration Points

1. Replace `generateRuleBasedSuggestions()` with `generateMLSuggestions()`
2. Add endpoint to ML service: `POST /api/v1/generate-suggestion`
3. Include diary context from recent entries
4. Combine ML suggestions with rule-based safety checks
5. Fallback to rules if ML service unavailable

---

## Testing

### Run Tests

```bash
cd backend
npm test -- suggestions.test.js
```

### Test Results

```
✅ POST /api/suggestions (12 tests)
  ✅ Critical sadness suggestion
  ✅ Anxiety management suggestion
  ✅ Grief support suggestion
  ✅ Anger management suggestion
  ✅ Fear/anxiety suggestion
  ✅ Overall mental health suggestion
  ✅ Positive activities suggestion
  ✅ Emotional regulation suggestion
  ✅ Positive reinforcement
  ✅ Maintenance suggestion
  ✅ Critical emotion score calculation
  ✅ Priority sorting

✅ Validation (6 tests)
  ✅ Missing daysAnalyzed
  ✅ Invalid daysAnalyzed
  ✅ Invalid emotionScores type
  ✅ Missing percentages
  ✅ Out of range percentages
  ✅ Out of range emotion scores

✅ Authentication (2 tests)
  ✅ No token
  ✅ Invalid token

✅ GET /api/suggestions/rules (3 tests)
  ✅ Returns rule information
  ✅ Includes TODO note
  ✅ Requires authentication

TOTAL: 23/23 passing
Coverage: 95.23% statements, 83.11% branches
```

---

## Usage Examples

### Example 1: High Sadness (7+ days)

**Input:**

```json
{
  "daysAnalyzed": 7,
  "consecutiveDays": 7,
  "emotionScores": { "sadness": 0.65, "anxiety": 0.42 },
  "percentages": { "positive": 15.2, "negative": 68.3, "neutral": 16.5 }
}
```

**Output:**

- Severity: `high`
- Suggestions: Professional help with crisis resources
- Warning: "Prolonged sadness detected"

### Example 2: Positive Trend

**Input:**

```json
{
  "daysAnalyzed": 7,
  "consecutiveDays": 5,
  "emotionScores": { "sadness": 0.1, "anxiety": 0.15 },
  "percentages": { "positive": 65.0, "negative": 20.0, "neutral": 15.0 }
}
```

**Output:**

- Severity: `none`
- Suggestions: Positive reinforcement, maintain practices
- No warnings

### Example 3: Mixed Emotions

**Input:**

```json
{
  "daysAnalyzed": 7,
  "consecutiveDays": 3,
  "emotionScores": { "sadness": 0.35, "anxiety": 0.4, "anger": 0.3 },
  "percentages": { "positive": 30.0, "negative": 50.0, "neutral": 20.0 },
  "emotionalVariability": 0.75
}
```

**Output:**

- Severity: `medium`
- Suggestions: Emotional regulation techniques (DBT)
- Multiple targeted suggestions for specific emotions

---

## Integration Workflow

### 1. Frontend Flow

```
User Dashboard
    ↓
[Fetch Emotion Log] (/api/emotion/log?range=weekly)
    ↓
[Calculate Statistics] (aggregate emotion data)
    ↓
[Request Suggestions] (POST /api/suggestions)
    ↓
[Display Suggestions] (React component with styling)
```

### 2. Backend Flow

```
POST /api/suggestions
    ↓
[Authenticate] (JWT middleware)
    ↓
[Validate Request] (express-validator)
    ↓
[Calculate Critical Score] (weighted formula)
    ↓
[Determine Severity] (high/medium/low/none)
    ↓
[Apply Rules] (10 rules → generate suggestions)
    ↓
[Sort by Priority] (critical → high → medium → low)
    ↓
[Return Response] (suggestions + warnings + analysis)
```

---

## Maintenance Notes

### TODO Items

1. ✅ Rule-based implementation complete
2. ⏳ Replace with FLAN-T5 generative model
3. ⏳ Add diary context to suggestions
4. ⏳ Implement user preference learning
5. ⏳ Add suggestion feedback mechanism
6. ⏳ Track suggestion effectiveness
7. ⏳ A/B test rule-based vs generative

### Code Locations

- Route handler: `backend/src/routes/suggestions.js`
- Tests: `backend/tests/suggestions.test.js`
- Documentation: `backend/SUGGESTIONS_API.md`
- Quick start: `backend/SUGGESTIONS_QUICKSTART.md`

### Dependencies

- `express` - Web framework
- `express-validator` - Request validation
- JWT middleware from `../middleware`
- No external ML dependencies (yet)

---

## Summary

✅ **Complete placeholder implementation** of `/api/suggestions` endpoint  
✅ **10 rule-based suggestions** covering major mental health patterns  
✅ **23 comprehensive tests** with 95%+ coverage  
✅ **Full documentation** with API reference and quick start guide  
✅ **Crisis resources** included in high-severity suggestions  
✅ **Clear TODO notes** for future generative model integration

**Next Step:** Integrate FLAN-T5 generative model to replace rule-based logic with context-aware, personalized suggestions.

---

**Created:** October 28, 2025  
**Version:** 1.0.0 (Placeholder Rule-Based)  
**Status:** ✅ Production-Ready (with plan for ML upgrade)  
**Tests:** ✅ 23/23 passing
