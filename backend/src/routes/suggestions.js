const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Rule-Based Suggestion Engine
 *
 * TODO: Replace this with a generative model (FLAN-T5 or similar) for more
 * personalized and contextual suggestions. This is a placeholder implementation
 * that uses simple rule-based logic to generate mental health suggestions based
 * on aggregated emotion statistics.
 *
 * Future improvements:
 * - Integrate with ml_service for generative suggestions
 * - Use user's diary history for context-aware suggestions
 * - Implement more sophisticated emotion pattern detection
 * - Add personalization based on user preferences and history
 */

/**
 * Calculate suggestion severity based on emotion patterns
 */
const calculateSeverity = (stats) => {
  const { negativePercentage, consecutiveDays, criticalEmotionScore } = stats;

  // High severity: Potential crisis indicators
  if (
    negativePercentage > 70 ||
    consecutiveDays >= 7 ||
    criticalEmotionScore > 0.7
  ) {
    return "high";
  }

  // Medium severity: Concerning patterns
  if (
    negativePercentage > 50 ||
    consecutiveDays >= 5 ||
    criticalEmotionScore > 0.5
  ) {
    return "medium";
  }

  // Low severity: Minor concerns
  if (
    negativePercentage > 30 ||
    consecutiveDays >= 3 ||
    criticalEmotionScore > 0.3
  ) {
    return "low";
  }

  return "none";
};

/**
 * Generate rule-based suggestions
 */
const generateRuleBasedSuggestions = (stats) => {
  const suggestions = [];
  const warnings = [];

  // Rule 1: Prolonged sadness (>60% for 7+ days)
  if (
    stats.sadnessScore > 0.6 &&
    stats.consecutiveDays >= 7 &&
    stats.negativePercentage > 60
  ) {
    suggestions.push({
      type: "professional_help",
      priority: "critical",
      title: "Consider Professional Support",
      message:
        "You've been experiencing persistent sadness for over a week. This could indicate depression or other concerns that would benefit from professional support.",
      action: "Schedule an appointment with a mental health professional",
      resources: [
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
      ],
      reason: `Sadness score: ${(stats.sadnessScore * 100).toFixed(1)}% over ${
        stats.consecutiveDays
      } consecutive days`,
    });

    warnings.push({
      level: "high",
      message: "Prolonged sadness detected",
      duration: `${stats.consecutiveDays} days`,
    });
  }

  // Rule 2: High anxiety levels (>65% for 5+ days)
  if (
    stats.anxietyScore > 0.65 &&
    stats.consecutiveDays >= 5 &&
    stats.daysAnalyzed >= 5
  ) {
    suggestions.push({
      type: "anxiety_management",
      priority: "high",
      title: "Manage Anxiety",
      message:
        "Your anxiety levels have been consistently high. Consider speaking with a therapist about anxiety management techniques.",
      action: "Try anxiety-reduction techniques and consider therapy",
      techniques: [
        "Deep breathing exercises (4-7-8 technique)",
        "Progressive muscle relaxation",
        "Grounding techniques (5-4-3-2-1 method)",
        "Mindfulness meditation (10-15 minutes daily)",
        "Limit caffeine and alcohol intake",
      ],
      reason: `Anxiety score: ${(stats.anxietyScore * 100).toFixed(1)}% over ${
        stats.consecutiveDays
      } days`,
    });

    warnings.push({
      level: "high",
      message: "Elevated anxiety levels",
      duration: `${stats.consecutiveDays} days`,
    });
  }

  // Rule 3: Grief or loss indicators (>50% for 3+ days)
  if (stats.griefScore > 0.5 && stats.daysAnalyzed >= 3) {
    suggestions.push({
      type: "grief_support",
      priority: "high",
      title: "Grief Support",
      message:
        "It appears you're experiencing significant grief. This is a natural response to loss, but you don't have to go through it alone.",
      action: "Consider grief counseling or support groups",
      resources: [
        {
          name: "GriefShare Support Groups",
          info: "Find local support groups at griefshare.org",
        },
        {
          name: "The Grief Recovery Method",
          info: "Evidence-based grief recovery program",
        },
      ],
      reason: `Grief detected: ${(stats.griefScore * 100).toFixed(1)}%`,
    });

    warnings.push({
      level: "medium",
      message: "Grief or loss detected",
    });
  }

  // Rule 4: High anger levels (>60% for 4+ days)
  if (stats.angerScore > 0.6 && stats.consecutiveDays >= 4) {
    suggestions.push({
      type: "anger_management",
      priority: "medium",
      title: "Anger Management",
      message:
        "You've been experiencing elevated anger. Learning anger management techniques can help you respond more constructively.",
      action: "Practice anger management strategies",
      techniques: [
        "Take a timeout when feeling angry",
        "Exercise regularly to release tension",
        "Practice assertive communication",
        "Identify anger triggers in your journal",
        "Consider anger management therapy or classes",
      ],
      reason: `Anger score: ${(stats.angerScore * 100).toFixed(1)}% over ${
        stats.consecutiveDays
      } days`,
    });

    warnings.push({
      level: "medium",
      message: "Elevated anger levels",
      duration: `${stats.consecutiveDays} days`,
    });
  }

  // Rule 5: Fear patterns (>55% for 5+ days)
  if (stats.fearScore > 0.55 && stats.consecutiveDays >= 5) {
    suggestions.push({
      type: "fear_anxiety",
      priority: "high",
      title: "Address Fear and Anxiety",
      message:
        "Persistent fear can be exhausting and may indicate anxiety or trauma-related concerns.",
      action: "Consider therapy for fear and anxiety",
      approaches: [
        "Cognitive Behavioral Therapy (CBT)",
        "Exposure therapy for specific fears",
        "EMDR for trauma-related fear",
        "Acceptance and Commitment Therapy (ACT)",
      ],
      reason: `Fear score: ${(stats.fearScore * 100).toFixed(1)}% over ${
        stats.consecutiveDays
      } days`,
    });

    warnings.push({
      level: "high",
      message: "Persistent fear detected",
      duration: `${stats.consecutiveDays} days`,
    });
  }

  // Rule 6: Mixed negative emotions (>70% negative overall)
  if (stats.negativePercentage > 70 && stats.daysAnalyzed >= 5) {
    suggestions.push({
      type: "overall_mental_health",
      priority: "high",
      title: "Overall Mental Health Check",
      message:
        "You've been experiencing predominantly negative emotions. This pattern suggests you might benefit from professional mental health support.",
      action: "Schedule a mental health evaluation",
      nextSteps: [
        "Talk to your primary care doctor about your mood",
        "Seek a referral to a mental health professional",
        "Consider online therapy if in-person isn't accessible",
        "Reach out to your support network (friends, family)",
      ],
      reason: `${stats.negativePercentage.toFixed(1)}% negative emotions over ${
        stats.daysAnalyzed
      } days`,
    });

    warnings.push({
      level: "high",
      message: "Predominantly negative emotional pattern",
      percentage: `${stats.negativePercentage.toFixed(1)}%`,
    });
  }

  // Rule 7: Low positive emotions (<10% positive for 7+ days)
  if (stats.positivePercentage < 10 && stats.daysAnalyzed >= 7) {
    suggestions.push({
      type: "positive_activities",
      priority: "medium",
      title: "Increase Positive Activities",
      message:
        "Your recent entries show very few positive emotions. Engaging in activities you enjoy can help improve your mood.",
      action: "Schedule pleasant activities into your day",
      activities: [
        "Spend time with supportive friends or family",
        "Engage in a hobby you enjoy",
        "Get outside in nature for 20+ minutes",
        "Listen to uplifting music",
        "Practice gratitude journaling",
        "Do something kind for someone else",
      ],
      reason: `Only ${stats.positivePercentage.toFixed(
        1
      )}% positive emotions over ${stats.daysAnalyzed} days`,
    });
  }

  // Rule 8: Emotional volatility (high variation)
  if (stats.emotionalVariability && stats.emotionalVariability > 0.7) {
    suggestions.push({
      type: "emotional_regulation",
      priority: "medium",
      title: "Emotional Regulation",
      message:
        "Your emotions have been fluctuating significantly. Learning emotional regulation skills can help.",
      action: "Practice emotional regulation techniques",
      techniques: [
        "Keep a mood diary to identify patterns",
        "Practice mindfulness to observe emotions without judgment",
        "Learn DBT skills for emotional regulation",
        "Maintain consistent sleep and eating schedules",
        "Limit alcohol and substance use",
      ],
      reason: "High emotional variability detected",
    });
  }

  // Rule 9: Positive trends (>60% positive)
  if (stats.positivePercentage > 60) {
    suggestions.push({
      type: "positive_reinforcement",
      priority: "low",
      title: "Maintain Your Positive Momentum",
      message:
        "You're doing great! Your recent emotional patterns show healthy positive emotions.",
      action: "Keep up the good work",
      encouragement: [
        "Continue the practices that bring you joy",
        "Share your strategies with others who might benefit",
        "Remember these positive times during harder days",
        "Celebrate your emotional well-being",
      ],
      reason: `${stats.positivePercentage.toFixed(1)}% positive emotions`,
    });
  }

  // Rule 10: Stable and balanced emotions
  if (
    stats.negativePercentage < 40 &&
    stats.positivePercentage > 30 &&
    stats.emotionalVariability < 0.4
  ) {
    suggestions.push({
      type: "maintenance",
      priority: "low",
      title: "Emotional Balance Maintained",
      message:
        "Your emotions appear balanced and stable. Continue your current self-care practices.",
      action: "Maintain your routine",
      tips: [
        "Keep journaling regularly",
        "Maintain healthy sleep habits",
        "Continue social connections",
        "Stay physically active",
        "Practice preventive self-care",
      ],
    });
  }

  return {
    suggestions: suggestions.sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority] - priority[b.priority];
    }),
    warnings,
  };
};

/**
 * @route   POST /api/suggestions
 * @desc    Generate suggestions based on aggregated emotion statistics
 * @access  Private
 *
 * Request body should contain:
 * {
 *   "daysAnalyzed": 7,
 *   "consecutiveDays": 7,
 *   "emotionScores": {
 *     "sadness": 0.65,
 *     "anxiety": 0.42,
 *     "anger": 0.28,
 *     ...
 *   },
 *   "percentages": {
 *     "positive": 15.2,
 *     "negative": 68.3,
 *     "neutral": 16.5
 *   },
 *   "emotionalVariability": 0.45  // optional
 * }
 */
router.post(
  "/",
  [
    body("daysAnalyzed")
      .isInt({ min: 1 })
      .withMessage("daysAnalyzed must be a positive integer"),
    body("consecutiveDays")
      .optional()
      .isInt({ min: 0 })
      .withMessage("consecutiveDays must be a non-negative integer"),
    body("emotionScores")
      .isObject()
      .withMessage("emotionScores must be an object"),
    body("emotionScores.sadness")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("sadness score must be between 0 and 1"),
    body("emotionScores.anxiety")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("anxiety score must be between 0 and 1"),
    body("emotionScores.anger")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("anger score must be between 0 and 1"),
    body("emotionScores.fear")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("fear score must be between 0 and 1"),
    body("emotionScores.grief")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("grief score must be between 0 and 1"),
    body("percentages").isObject().withMessage("percentages must be an object"),
    body("percentages.positive")
      .isFloat({ min: 0, max: 100 })
      .withMessage("positive percentage must be between 0 and 100"),
    body("percentages.negative")
      .isFloat({ min: 0, max: 100 })
      .withMessage("negative percentage must be between 0 and 100"),
    body("percentages.neutral")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("neutral percentage must be between 0 and 100"),
    body("emotionalVariability")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("emotionalVariability must be between 0 and 1"),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
          })),
        });
      }

      const {
        daysAnalyzed,
        consecutiveDays = 0,
        emotionScores,
        percentages,
        emotionalVariability,
      } = req.body;

      // Prepare statistics for rule engine
      const stats = {
        daysAnalyzed,
        consecutiveDays,
        sadnessScore: emotionScores.sadness || 0,
        anxietyScore: emotionScores.anxiety || 0,
        angerScore: emotionScores.anger || 0,
        fearScore: emotionScores.fear || 0,
        griefScore: emotionScores.grief || 0,
        negativePercentage: percentages.negative,
        positivePercentage: percentages.positive,
        neutralPercentage: percentages.neutral || 0,
        emotionalVariability: emotionalVariability || null,
      };

      // Calculate critical emotion score (weighted average of concerning emotions)
      stats.criticalEmotionScore =
        (stats.sadnessScore * 1.5 +
          stats.griefScore * 1.5 +
          stats.fearScore * 1.2 +
          stats.anxietyScore * 1.0 +
          stats.angerScore * 0.8) /
        6.0;

      // Calculate overall severity
      const severity = calculateSeverity(stats);

      // Generate rule-based suggestions
      const { suggestions, warnings } = generateRuleBasedSuggestions(stats);

      // Response
      res.status(200).json({
        success: true,
        data: {
          userId: req.userId,
          generatedAt: new Date().toISOString(),
          period: {
            daysAnalyzed,
            consecutiveDays,
          },
          analysis: {
            severity,
            criticalEmotionScore: parseFloat(
              stats.criticalEmotionScore.toFixed(3)
            ),
            emotionScores: {
              sadness: stats.sadnessScore,
              anxiety: stats.anxietyScore,
              anger: stats.angerScore,
              fear: stats.fearScore,
              grief: stats.griefScore,
            },
            percentages: {
              positive: percentages.positive,
              negative: percentages.negative,
              neutral: percentages.neutral || 0,
            },
            emotionalVariability,
          },
          warnings,
          suggestions,
          totalSuggestions: suggestions.length,
          implementationNote:
            "TODO: Replace rule-based engine with generative model (FLAN-T5) for more personalized, context-aware suggestions",
        },
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({
        success: false,
        message: "Error generating suggestions",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/suggestions/rules
 * @desc    Get information about the rule-based suggestion engine
 * @access  Private
 */
router.get("/rules", async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      engineType: "rule-based",
      version: "1.0.0",
      status: "active",
      implementationNote:
        "This is a placeholder rule-based engine. Future versions will integrate with generative models for personalized suggestions.",
      rules: [
        {
          id: 1,
          name: "Prolonged Sadness",
          trigger: "sadness > 0.6 for 7+ days AND negative > 60%",
          severity: "high",
          suggestion: "Professional mental health support",
        },
        {
          id: 2,
          name: "High Anxiety",
          trigger: "anxiety > 0.65 for 5+ days",
          severity: "high",
          suggestion: "Anxiety management techniques and therapy",
        },
        {
          id: 3,
          name: "Grief Detection",
          trigger: "grief > 0.5 for 3+ days",
          severity: "medium-high",
          suggestion: "Grief counseling or support groups",
        },
        {
          id: 4,
          name: "Elevated Anger",
          trigger: "anger > 0.6 for 4+ days",
          severity: "medium",
          suggestion: "Anger management strategies",
        },
        {
          id: 5,
          name: "Persistent Fear",
          trigger: "fear > 0.55 for 5+ days",
          severity: "high",
          suggestion: "Therapy for fear/anxiety (CBT, exposure therapy)",
        },
        {
          id: 6,
          name: "Overall Negative Pattern",
          trigger: "negative > 70% for 5+ days",
          severity: "high",
          suggestion: "Mental health evaluation",
        },
        {
          id: 7,
          name: "Low Positive Emotions",
          trigger: "positive < 10% for 7+ days",
          severity: "medium",
          suggestion: "Increase pleasant activities and social connection",
        },
        {
          id: 8,
          name: "Emotional Volatility",
          trigger: "emotionalVariability > 0.7",
          severity: "medium",
          suggestion: "Emotional regulation skills (DBT)",
        },
        {
          id: 9,
          name: "Positive Trends",
          trigger: "positive > 60%",
          severity: "none",
          suggestion: "Maintain current practices",
        },
        {
          id: 10,
          name: "Emotional Balance",
          trigger: "negative < 40% AND positive > 30% AND variability < 0.4",
          severity: "none",
          suggestion: "Continue self-care routine",
        },
      ],
      severityLevels: {
        high: "Immediate professional attention recommended",
        medium: "Consider seeking professional guidance",
        low: "Monitor and practice self-care",
        none: "No concerns detected",
      },
      futureEnhancements: [
        "Integration with FLAN-T5 generative model",
        "Personalized suggestions based on user history",
        "Context-aware recommendations using diary content",
        "User preference learning and adaptation",
        "Multi-modal input (text, audio, images)",
      ],
    },
  });
});

module.exports = router;
