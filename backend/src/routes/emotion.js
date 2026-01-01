const express = require("express");
const { query, param, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware");
const Emotion = require("../models/Emotion");
const Diary = require("../models/Diary");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Helper function to get date range
 */
const getDateRange = (start, range) => {
  const startDate = start ? new Date(start) : new Date();
  let endDate = new Date(startDate);

  if (range === "weekly") {
    endDate.setDate(startDate.getDate() + 7);
  } else if (range === "monthly") {
    endDate.setMonth(startDate.getMonth() + 1);
  }

  return { startDate, endDate };
};

/**
 * Helper function to aggregate emotions by time period
 */
const aggregateEmotionsByPeriod = (emotions, groupBy = "day") => {
  const aggregated = {};

  emotions.forEach((emotion) => {
    let key;
    const date = new Date(emotion.date);

    if (groupBy === "day") {
      // Group by day (YYYY-MM-DD)
      key = date.toISOString().split("T")[0];
    } else if (groupBy === "week") {
      // Group by week (start of week)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        date: key,
        count: 0,
        emotions: {},
        categories: {
          positive: 0,
          negative: 0,
          ambiguous: 0,
          neutral: 0,
        },
        topEmotions: {},
        averageConfidence: 0,
      };
    }

    const entry = aggregated[key];
    entry.count++;

    // Aggregate emotion scores
    Object.entries(emotion.scores).forEach(([emotionName, score]) => {
      if (!entry.emotions[emotionName]) {
        entry.emotions[emotionName] = 0;
      }
      entry.emotions[emotionName] += score;
    });

    // Count categories
    const category = emotion.getEmotionCategory();
    entry.categories[category]++;

    // Count top emotions
    if (!entry.topEmotions[emotion.topLabel]) {
      entry.topEmotions[emotion.topLabel] = 0;
    }
    entry.topEmotions[emotion.topLabel]++;

    // Sum confidence for averaging
    entry.averageConfidence += emotion.confidence;
  });

  // Calculate averages and format
  Object.values(aggregated).forEach((entry) => {
    // Average emotion scores
    Object.keys(entry.emotions).forEach((emotion) => {
      entry.emotions[emotion] = entry.emotions[emotion] / entry.count;
    });

    // Average confidence
    entry.averageConfidence = entry.averageConfidence / entry.count;

    // Get top 5 emotions by score
    const topEmotionsList = Object.entries(entry.emotions)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, score]) => ({
        emotion,
        score: parseFloat(score.toFixed(3)),
      }));

    entry.topEmotionsList = topEmotionsList;

    // Get most frequent emotion
    const mostFrequent = Object.entries(entry.topEmotions).sort(
      (a, b) => b[1] - a[1]
    )[0];

    entry.dominantEmotion = mostFrequent
      ? {
          emotion: mostFrequent[0],
          frequency: mostFrequent[1],
        }
      : null;

    // Round confidence
    entry.averageConfidence = parseFloat(entry.averageConfidence.toFixed(3));
  });

  return Object.values(aggregated).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

/**
 * @route   GET /api/emotion/log
 * @desc    Get aggregated emotion scores for charting
 * @access  Private
 */
router.get(
  "/log",
  [
    query("range")
      .optional()
      .isIn(["weekly", "monthly"])
      .withMessage("Range must be weekly or monthly"),
    query("start")
      .optional()
      .isISO8601()
      .withMessage("Start date must be in ISO 8601 format (YYYY-MM-DD)"),
    query("groupBy")
      .optional()
      .isIn(["day", "week"])
      .withMessage("GroupBy must be day or week"),
  ],
  async (req, res) => {
    try {
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

      const range = req.query.range || "monthly";
      const groupBy = req.query.groupBy || "day";
      const { startDate, endDate } = getDateRange(req.query.start, range);

      // Fetch emotions for the user within date range
      const emotions = await Emotion.find({
        user: req.userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }).sort({ date: 1 });

      if (emotions.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            range,
            groupBy,
            startDate,
            endDate,
            totalEntries: 0,
            data: [],
            summary: {
              totalEmotions: 0,
              categories: {
                positive: 0,
                negative: 0,
                ambiguous: 0,
                neutral: 0,
              },
            },
          },
        });
      }

      // Aggregate emotions
      const aggregatedData = aggregateEmotionsByPeriod(emotions, groupBy);

      // Calculate overall summary
      const summary = {
        totalEmotions: emotions.length,
        categories: {
          positive: 0,
          negative: 0,
          ambiguous: 0,
          neutral: 0,
        },
        overallAverageConfidence: 0,
        mostFrequentEmotion: null,
      };

      const emotionFrequency = {};

      emotions.forEach((emotion) => {
        const category = emotion.getEmotionCategory();
        summary.categories[category]++;
        summary.overallAverageConfidence += emotion.confidence;

        if (!emotionFrequency[emotion.topLabel]) {
          emotionFrequency[emotion.topLabel] = 0;
        }
        emotionFrequency[emotion.topLabel]++;
      });

      summary.overallAverageConfidence = parseFloat(
        (summary.overallAverageConfidence / emotions.length).toFixed(3)
      );

      const mostFrequent = Object.entries(emotionFrequency).sort(
        (a, b) => b[1] - a[1]
      )[0];

      summary.mostFrequentEmotion = mostFrequent
        ? {
            emotion: mostFrequent[0],
            count: mostFrequent[1],
          }
        : null;

      res.status(200).json({
        success: true,
        data: {
          range,
          groupBy,
          startDate,
          endDate,
          totalEntries: aggregatedData.length,
          data: aggregatedData,
          summary,
        },
      });
    } catch (error) {
      console.error("Error fetching emotion log:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching emotion log",
      });
    }
  }
);

/**
 * @route   GET /api/emotion/suggest
 * @desc    Get warnings if negative emotions exceed thresholds
 * @access  Private
 */
router.get(
  "/suggest",
  [
    query("start")
      .optional()
      .isISO8601()
      .withMessage("Start date must be in ISO 8601 format"),
    query("end")
      .optional()
      .isISO8601()
      .withMessage("End date must be in ISO 8601 format"),
  ],
  async (req, res) => {
    try {
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

      // Default to last 7 days if no dates provided
      const endDate = req.query.end ? new Date(req.query.end) : new Date();
      const startDate = req.query.start
        ? new Date(req.query.start)
        : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch emotions for the user within date range
      const emotions = await Emotion.find({
        user: req.userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      if (emotions.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            startDate,
            endDate,
            totalEmotions: 0,
            warnings: [],
            suggestions: [],
            severity: "none",
          },
        });
      }

      // Define thresholds
      const THRESHOLDS = {
        negativePercentage: 60, // Warning if >60% negative
        criticalEmotions: ["sadness", "grief", "fear", "remorse"],
        criticalThreshold: 3, // Warning if 3+ critical emotions in period
        consecutiveNegative: 5, // Warning if 5+ consecutive days negative
      };

      // Analyze emotions
      const analysis = {
        total: emotions.length,
        byCategory: {
          positive: 0,
          negative: 0,
          ambiguous: 0,
          neutral: 0,
        },
        criticalEmotionCount: 0,
        emotionFrequency: {},
        dailyCategories: {},
      };

      emotions.forEach((emotion) => {
        const category = emotion.getEmotionCategory();
        analysis.byCategory[category]++;

        // Track critical emotions
        if (THRESHOLDS.criticalEmotions.includes(emotion.topLabel)) {
          analysis.criticalEmotionCount++;
        }

        // Track emotion frequency
        if (!analysis.emotionFrequency[emotion.topLabel]) {
          analysis.emotionFrequency[emotion.topLabel] = 0;
        }
        analysis.emotionFrequency[emotion.topLabel]++;

        // Track daily categories
        const dateKey = emotion.date.toISOString().split("T")[0];
        if (!analysis.dailyCategories[dateKey]) {
          analysis.dailyCategories[dateKey] = { positive: 0, negative: 0 };
        }
        if (category === "positive") {
          analysis.dailyCategories[dateKey].positive++;
        } else if (category === "negative") {
          analysis.dailyCategories[dateKey].negative++;
        }
      });

      // Calculate percentages
      const negativePercentage =
        (analysis.byCategory.negative / analysis.total) * 100;
      const positivePercentage =
        (analysis.byCategory.positive / analysis.total) * 100;

      // Check for consecutive negative days
      const sortedDays = Object.keys(analysis.dailyCategories).sort();
      let consecutiveNegativeDays = 0;
      let maxConsecutiveNegative = 0;

      sortedDays.forEach((day) => {
        const dayData = analysis.dailyCategories[day];
        if (dayData.negative > dayData.positive) {
          consecutiveNegativeDays++;
          maxConsecutiveNegative = Math.max(
            maxConsecutiveNegative,
            consecutiveNegativeDays
          );
        } else {
          consecutiveNegativeDays = 0;
        }
      });

      // Generate warnings
      const warnings = [];
      const suggestions = [];
      let severity = "none";

      if (negativePercentage > THRESHOLDS.negativePercentage) {
        severity = "high";
        warnings.push({
          type: "high_negative_emotions",
          message: `${negativePercentage.toFixed(
            1
          )}% of your emotions are negative`,
          severity: "high",
          details: `You've experienced predominantly negative emotions in the past ${Math.ceil(
            (endDate - startDate) / (24 * 60 * 60 * 1000)
          )} days`,
        });
        suggestions.push({
          type: "seek_support",
          message: "Consider reaching out to a mental health professional",
          priority: "high",
          resources: [
            "National Suicide Prevention Lifeline: 988",
            "Crisis Text Line: Text HOME to 741741",
          ],
        });
      } else if (negativePercentage > 40) {
        severity = "medium";
        warnings.push({
          type: "elevated_negative_emotions",
          message: `${negativePercentage.toFixed(
            1
          )}% of your emotions are negative`,
          severity: "medium",
          details: "Your negative emotions are elevated",
        });
      }

      if (analysis.criticalEmotionCount >= THRESHOLDS.criticalThreshold) {
        if (severity !== "high") severity = "medium";
        warnings.push({
          type: "critical_emotions_detected",
          message: `Detected ${analysis.criticalEmotionCount} instances of concerning emotions`,
          severity: "high",
          details: `Emotions like sadness, grief, and fear have appeared frequently`,
        });
        suggestions.push({
          type: "coping_strategies",
          message: "Try grounding techniques and mindfulness exercises",
          priority: "medium",
          activities: [
            "Deep breathing exercises",
            "Progressive muscle relaxation",
            "Mindful walking",
            "Journaling about your feelings",
          ],
        });
      }

      if (maxConsecutiveNegative >= THRESHOLDS.consecutiveNegative) {
        if (severity !== "high") severity = "medium";
        warnings.push({
          type: "prolonged_negative_pattern",
          message: `${maxConsecutiveNegative} consecutive days with predominantly negative emotions`,
          severity: "high",
          details:
            "Extended periods of negative emotions may indicate a need for additional support",
        });
      }

      // Positive suggestions
      if (positivePercentage > 60) {
        suggestions.push({
          type: "positive_trend",
          message: "Great job maintaining a positive emotional state!",
          priority: "low",
          encouragement: "Keep up the practices that bring you joy and peace",
        });
      }

      // Most frequent emotion suggestions
      const topEmotion = Object.entries(analysis.emotionFrequency).sort(
        (a, b) => b[1] - a[1]
      )[0];

      if (topEmotion) {
        const [emotion, count] = topEmotion;
        if (["sadness", "anger", "fear", "grief"].includes(emotion)) {
          suggestions.push({
            type: "emotion_specific",
            message: `Your most frequent emotion is "${emotion}"`,
            priority: "medium",
            suggestion: `Consider CBT techniques specifically for managing ${emotion}`,
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          startDate,
          endDate,
          totalEmotions: analysis.total,
          analysis: {
            percentages: {
              positive: parseFloat(positivePercentage.toFixed(1)),
              negative: parseFloat(negativePercentage.toFixed(1)),
              ambiguous: parseFloat(
                (
                  (analysis.byCategory.ambiguous / analysis.total) *
                  100
                ).toFixed(1)
              ),
              neutral: parseFloat(
                ((analysis.byCategory.neutral / analysis.total) * 100).toFixed(
                  1
                )
              ),
            },
            criticalEmotionsCount: analysis.criticalEmotionCount,
            consecutiveNegativeDays: maxConsecutiveNegative,
            mostFrequentEmotion: topEmotion
              ? {
                  emotion: topEmotion[0],
                  count: topEmotion[1],
                }
              : null,
          },
          warnings,
          suggestions,
          severity,
        },
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({
        success: false,
        message: "Error generating suggestions",
      });
    }
  }
);

/**
 * @route   GET /api/emotion/:diaryId
 * @desc    Get emotion entry for a specific diary
 * @access  Private
 */
router.get(
  "/:diaryId",
  [param("diaryId").isMongoId().withMessage("Invalid diary ID")],
  async (req, res) => {
    try {
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

      // Check if diary exists and belongs to user
      const diary = await Diary.findById(req.params.diaryId);

      if (!diary) {
        return res.status(404).json({
          success: false,
          message: "Diary entry not found",
        });
      }

      if (diary.user.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only view emotions for your own diary entries.",
        });
      }

      // Find emotion for this diary
      const emotion = await Emotion.findOne({ diary: req.params.diaryId });

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: "No emotion analysis found for this diary entry",
          note: "Analysis may still be in progress or failed",
        });
      }

      // Format response
      const topEmotions = emotion.getTopEmotions(5);
      const category = emotion.getEmotionCategory();

      res.status(200).json({
        success: true,
        data: {
          emotion: {
            id: emotion._id,
            diaryId: emotion.diary,
            date: emotion.date,
            topLabel: emotion.topLabel,
            detectedEmotions: emotion.detectedEmotions,
            confidence: emotion.confidence,
            category,
            scores: emotion.scores,
            topEmotions,
            modelVersion: emotion.modelVersion,
            createdAt: emotion.createdAt,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching emotion for diary:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching emotion data",
      });
    }
  }
);

module.exports = router;
