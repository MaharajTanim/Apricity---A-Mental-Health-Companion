# TODO: Generative Model Integration Plan

## Overview

This document outlines the plan to replace the current rule-based suggestion engine with a generative model (FLAN-T5) for more personalized, context-aware mental health suggestions.

**Current Status:** Rule-based placeholder ✅  
**Target:** ML-powered generative suggestions ⏳  
**Priority:** Medium (rule-based is functional but limited)

---

## Why Replace Rule-Based with Generative?

### Current Limitations (Rule-Based)

❌ **Fixed templates** - Same suggestion text for everyone  
❌ **No context awareness** - Doesn't consider diary content  
❌ **Binary thresholds** - Misses nuanced emotional patterns  
❌ **Limited flexibility** - Can only suggest predefined responses  
❌ **Not personalized** - Ignores user history and preferences

### Benefits of Generative Model

✅ **Personalized** - Uses user's actual diary entries for context  
✅ **Natural language** - More empathetic, human-like responses  
✅ **Context-aware** - Understands complex emotional narratives  
✅ **Flexible** - Can generate novel, situation-specific advice  
✅ **Adaptive** - Learns from user feedback over time  
✅ **Nuanced** - Captures subtle emotional patterns

---

## Architecture

### Current Architecture (Rule-Based)

```
Frontend
    ↓
POST /api/suggestions
    ↓
Rule Engine
  - if (sadness > 0.6 && days >= 7)
  - return fixed template
    ↓
Response
```

### Target Architecture (Generative)

```
Frontend
    ↓
POST /api/suggestions
    ↓
Gather Context:
  - Emotion statistics
  - Recent diary entries (last 7 days)
  - User preferences/history
  - Previous suggestions
    ↓
Build Prompt
    ↓
POST http://ml-service:8000/api/v1/generate-suggestion
    ↓
FLAN-T5 Model
  - Generate personalized suggestion
  - Consider emotional context
  - Maintain empathetic tone
    ↓
Post-Process:
  - Safety checks (rule-based fallback for crisis)
  - Format resources
  - Add crisis hotlines if needed
    ↓
Response
```

---

## Implementation Steps

### Phase 1: ML Service Endpoint (ml_service)

**File:** `ml_service/src/routes/suggestion.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch

router = APIRouter()

class SuggestionRequest(BaseModel):
    emotion_stats: dict
    diary_excerpts: list[str]
    days_analyzed: int
    user_context: dict = {}

class SuggestionResponse(BaseModel):
    suggestion: str
    confidence: float
    reasoning: str

# Load FLAN-T5 model (or use existing model from memory)
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")
tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-base")

@router.post("/generate-suggestion", response_model=SuggestionResponse)
async def generate_suggestion(request: SuggestionRequest):
    """
    Generate personalized mental health suggestion using FLAN-T5
    """
    try:
        # Build context-aware prompt
        prompt = build_prompt(
            request.emotion_stats,
            request.diary_excerpts,
            request.days_analyzed,
            request.user_context
        )

        # Generate suggestion with FLAN-T5
        inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)

        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=200,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                num_return_sequences=1
            )

        suggestion = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Calculate confidence based on model's output logits
        confidence = calculate_confidence(outputs)

        # Generate reasoning/explanation
        reasoning = generate_reasoning(request.emotion_stats)

        return SuggestionResponse(
            suggestion=suggestion,
            confidence=confidence,
            reasoning=reasoning
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def build_prompt(emotion_stats, diary_excerpts, days_analyzed, user_context):
    """
    Build a comprehensive prompt for FLAN-T5
    """
    # Extract emotion percentages
    sadness = emotion_stats.get("sadness", 0) * 100
    anxiety = emotion_stats.get("anxiety", 0) * 100
    positive_pct = emotion_stats.get("positive_percentage", 0)
    negative_pct = emotion_stats.get("negative_percentage", 0)

    # Get diary context (last 3 entries, anonymized)
    diary_context = "\n".join([
        f"Day {i+1}: {excerpt[:100]}..."
        for i, excerpt in enumerate(diary_excerpts[:3])
    ])

    # Build structured prompt
    prompt = f"""You are a compassionate mental health companion AI.
Based on the user's emotional patterns and diary entries, provide a brief,
actionable mental health suggestion in 2-3 sentences.

Emotional Profile (Last {days_analyzed} Days):
- Sadness: {sadness:.1f}%
- Anxiety: {anxiety:.1f}%
- Positive emotions: {positive_pct:.1f}%
- Negative emotions: {negative_pct:.1f}%

Recent Diary Entries:
{diary_context}

Provide a suggestion that is:
1. Compassionate and non-judgmental
2. Specific and actionable
3. Appropriate for the emotional pattern observed
4. Encouraging but realistic

Suggestion:"""

    return prompt

def calculate_confidence(outputs):
    """
    Calculate confidence score based on model outputs
    """
    # Simple confidence based on sequence length and token probabilities
    # In production, use more sophisticated methods
    return 0.85  # Placeholder

def generate_reasoning(emotion_stats):
    """
    Generate human-readable reasoning for why this suggestion was made
    """
    sadness = emotion_stats.get("sadness", 0)
    anxiety = emotion_stats.get("anxiety", 0)

    if sadness > 0.6:
        return "Based on elevated sadness levels over multiple days"
    elif anxiety > 0.6:
        return "In response to persistent anxiety patterns"
    else:
        return "To support your overall emotional well-being"
```

### Phase 2: Backend Integration (backend)

**File:** `backend/src/services/suggestionService.js`

```javascript
const axios = require("axios");
const Diary = require("../models/Diary");

/**
 * Generate ML-powered suggestions
 */
async function generateMLSuggestions(userId, emotionStats) {
  try {
    // 1. Gather diary context (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDiaries = await Diary.find({
      user: userId,
      createdAt: { $gte: sevenDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(7)
      .select("content");

    const diaryExcerpts = recentDiaries.map((d) => d.content);

    // 2. Call ML service
    const mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL}/api/v1/generate-suggestion`,
      {
        emotion_stats: emotionStats.emotionScores,
        diary_excerpts: diaryExcerpts,
        days_analyzed: emotionStats.daysAnalyzed,
        user_context: {
          consecutive_days: emotionStats.consecutiveDays,
          positive_percentage: emotionStats.percentages.positive,
          negative_percentage: emotionStats.percentages.negative,
        },
      },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const { suggestion, confidence, reasoning } = mlResponse.data;

    // 3. Apply safety checks (use rule-based for crisis detection)
    const safetyCheck = performSafetyCheck(emotionStats);

    // 4. Format response
    const formattedSuggestion = {
      type: "generative",
      priority: safetyCheck.priority,
      title: "Personalized Suggestion",
      message: suggestion,
      action: extractActionableStep(suggestion),
      reasoning: reasoning,
      confidence: confidence,
      resources: safetyCheck.needsCrisisResources ? getCrisisResources() : null,
      generatedBy: "FLAN-T5",
      fallback: false,
    };

    return {
      suggestions: [formattedSuggestion, ...safetyCheck.criticalSuggestions],
      warnings: safetyCheck.warnings,
      severity: safetyCheck.severity,
    };
  } catch (error) {
    console.error("ML suggestion generation failed:", error);

    // Fallback to rule-based
    console.log("Falling back to rule-based suggestions");
    return generateRuleBasedSuggestions(emotionStats);
  }
}

/**
 * Safety checks using rule-based logic
 * Always applied even with ML suggestions
 */
function performSafetyCheck(emotionStats) {
  const checks = {
    priority: "low",
    severity: "none",
    needsCrisisResources: false,
    warnings: [],
    criticalSuggestions: [],
  };

  // Critical: Prolonged high sadness
  if (
    emotionStats.sadnessScore > 0.6 &&
    emotionStats.consecutiveDays >= 7 &&
    emotionStats.negativePercentage > 60
  ) {
    checks.priority = "critical";
    checks.severity = "high";
    checks.needsCrisisResources = true;
    checks.warnings.push({
      level: "high",
      message: "Prolonged sadness detected",
      duration: `${emotionStats.consecutiveDays} days`,
    });

    // Always add professional help suggestion for crisis
    checks.criticalSuggestions.push({
      type: "professional_help",
      priority: "critical",
      title: "Immediate Support Recommended",
      message:
        "Based on your emotional patterns, we strongly encourage speaking with a mental health professional.",
      action: "Contact a mental health provider or crisis line",
      resources: getCrisisResources(),
      reason: "Safety protocol for sustained negative emotions",
    });
  }

  // Add other critical checks...

  return checks;
}

function getCrisisResources() {
  return [
    {
      name: "National Suicide Prevention Lifeline",
      contact: "988",
      available: "24/7",
    },
    {
      name: "Crisis Text Line",
      contact: "Text HOME to 741741",
      available: "24/7",
    },
    {
      name: "SAMHSA National Helpline",
      contact: "1-800-662-4357",
      available: "24/7",
    },
  ];
}

function extractActionableStep(suggestion) {
  // Extract the most actionable sentence from the suggestion
  // Simple implementation: return first sentence with action words
  const sentences = suggestion.split(/[.!?]+/);
  const actionWords = [
    "try",
    "consider",
    "practice",
    "reach out",
    "schedule",
    "talk to",
  ];

  for (const sentence of sentences) {
    if (actionWords.some((word) => sentence.toLowerCase().includes(word))) {
      return sentence.trim();
    }
  }

  return sentences[0]?.trim() || suggestion;
}

module.exports = {
  generateMLSuggestions,
};
```

**Update:** `backend/src/routes/suggestions.js`

```javascript
const { generateMLSuggestions } = require("../services/suggestionService");

// In POST /api/suggestions route handler:
router.post("/", [...validators], async (req, res) => {
  try {
    // Validate...

    // Prepare stats...

    // Generate suggestions
    let result;

    if (process.env.USE_ML_SUGGESTIONS === "true") {
      // Use ML-powered suggestions
      result = await generateMLSuggestions(req.userId, stats);
    } else {
      // Use rule-based suggestions (current implementation)
      result = generateRuleBasedSuggestions(stats);
    }

    // Return response...
  } catch (error) {
    // Error handling...
  }
});
```

### Phase 3: Frontend Integration

**Update:** Add loading states and display generated suggestions

```jsx
function SuggestionsPanel({ userId, token }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMLGenerated, setIsMLGenerated] = useState(false);

  // ... existing code ...

  return (
    <div className="suggestions-panel">
      {isMLGenerated && (
        <div className="ml-badge">
          <span>✨ AI-Generated Personalized Suggestion</span>
        </div>
      )}

      {/* ... existing suggestion display ... */}

      {suggestions.map((suggestion) => (
        <div key={index} className="suggestion-card">
          {suggestion.generatedBy === "FLAN-T5" && (
            <div className="generator-badge">Powered by FLAN-T5</div>
          )}

          {/* ... rest of suggestion display ... */}

          {suggestion.confidence && (
            <div className="confidence-meter">
              <span>
                Confidence: {(suggestion.confidence * 100).toFixed(0)}%
              </span>
              <div
                className="confidence-bar"
                style={{ width: `${suggestion.confidence * 100}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

```javascript
// backend/tests/suggestionService.test.js
describe("ML Suggestion Service", () => {
  it("should call ML service with diary context", async () => {
    // Test ML service integration
  });

  it("should fall back to rule-based on ML service failure", async () => {
    // Test fallback mechanism
  });

  it("should always apply safety checks", async () => {
    // Test safety protocol
  });

  it("should include crisis resources for high severity", async () => {
    // Test crisis resource inclusion
  });
});
```

### Integration Tests

```python
# ml_service/tests/test_suggestion_generation.py
def test_generate_suggestion_with_diary_context():
    """Test FLAN-T5 suggestion generation"""
    request = {
        "emotion_stats": {"sadness": 0.65, "anxiety": 0.42},
        "diary_excerpts": ["Today was hard...", "Feeling anxious..."],
        "days_analyzed": 7
    }

    response = client.post("/api/v1/generate-suggestion", json=request)

    assert response.status_code == 200
    assert "suggestion" in response.json()
    assert len(response.json()["suggestion"]) > 0
    assert response.json()["confidence"] > 0
```

---

## Configuration

### Environment Variables

```bash
# backend/.env
USE_ML_SUGGESTIONS=true  # Toggle between ML and rule-based
ML_SERVICE_URL=http://localhost:8000
ML_SUGGESTION_TIMEOUT=10000  # 10 seconds
```

### Feature Flag

Allow gradual rollout:

```javascript
// backend/src/config/features.js
module.exports = {
  mlSuggestions: {
    enabled: process.env.USE_ML_SUGGESTIONS === "true",
    rolloutPercentage: 100, // Start at 10%, gradually increase
    fallbackOnError: true,
  },
};
```

---

## Deployment Plan

### Stage 1: Development (Week 1-2)

- [ ] Implement ML service endpoint
- [ ] Train/fine-tune FLAN-T5 on mental health data (if needed)
- [ ] Create backend integration service
- [ ] Write comprehensive tests

### Stage 2: Staging (Week 3)

- [ ] Deploy to staging environment
- [ ] A/B test: 50% ML, 50% rule-based
- [ ] Collect user feedback
- [ ] Monitor quality metrics

### Stage 3: Production (Week 4+)

- [ ] Gradual rollout: 10% → 25% → 50% → 100%
- [ ] Monitor error rates and fallback frequency
- [ ] Track user satisfaction metrics
- [ ] Iterate based on feedback

---

## Quality Metrics

### Measure Success

- **User satisfaction** - Feedback ratings on suggestions
- **Engagement** - Do users act on ML suggestions more?
- **Accuracy** - Are suggestions contextually appropriate?
- **Safety** - Are crisis cases caught and handled correctly?
- **Performance** - Response time < 2 seconds

### A/B Testing

Compare ML vs Rule-based:

- User ratings (1-5 stars)
- Click-through on resources
- Time spent reading suggestions
- Repeat usage patterns

---

## Risks & Mitigation

### Risk 1: ML Service Downtime

**Mitigation:** Always fallback to rule-based suggestions

### Risk 2: Inappropriate Suggestions

**Mitigation:** Safety checks + human review + feedback mechanism

### Risk 3: Slow Response Times

**Mitigation:** Cache common patterns, optimize model, timeout fallback

### Risk 4: Model Bias

**Mitigation:** Diverse training data, bias detection, regular audits

### Risk 5: Privacy Concerns

**Mitigation:** Anonymize diary content, local inference option, clear privacy policy

---

## Timeline

| Week | Milestone                                |
| ---- | ---------------------------------------- |
| 1-2  | ML service implementation + tests        |
| 3    | Backend integration + staging deployment |
| 4    | 10% rollout to production                |
| 5-6  | Monitor, iterate, increase to 50%        |
| 7-8  | 100% rollout if metrics positive         |

---

## Success Criteria

✅ ML service generates suggestions < 2s  
✅ Fallback rate < 5%  
✅ User satisfaction > 4.0/5.0  
✅ Zero inappropriate suggestions for crisis cases  
✅ 95% uptime for ML service

---

## Next Steps

1. **Immediate:** Set up ML service endpoint structure
2. **Short-term:** Implement FLAN-T5 integration
3. **Medium-term:** A/B testing in staging
4. **Long-term:** Full production rollout

---

**Status:** Planning Document  
**Priority:** Medium (rule-based works, but ML is better)  
**Estimated Effort:** 4-8 weeks  
**Owner:** Backend + ML Service teams
