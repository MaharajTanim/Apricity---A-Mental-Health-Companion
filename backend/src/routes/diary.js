const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware");
const Diary = require("../models/Diary");
const Emotion = require("../models/Emotion");
const User = require("../models/User");
const axios = require("axios");
const jobQueue = require("../services/jobQueue");

const router = express.Router();

/**
 * Helper function to perform ML analysis
 * Makes HTTP POST to ML service and saves results to Emotion model
 * @param {ObjectId} diaryId - The diary entry ID
 * @param {ObjectId} userId - The user ID
 * @param {String} text - The diary content text
 */
async function performMLAnalysis(diaryId, userId, text) {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

  try {
    console.log(`[ML Analysis] Starting analysis for diary ${diaryId}`);

    // Make HTTP POST request to ML service
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        diaryId: diaryId.toString(),
        userId: userId.toString(),
        text: text,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const { top_label, scores, summary_suggestion } = response.data;

    if (!top_label || !scores) {
      throw new Error(
        "Invalid ML service response: missing top_label or scores"
      );
    }

    // Fetch the diary to get its date
    const diary = await Diary.findById(diaryId);
    const emotionDate = diary ? diary.date : new Date();

    // Create emotion document from ML service response
    const emotion = new Emotion({
      user: userId,
      diary: diaryId,
      date: emotionDate,
      scores: scores, // ML service should return scores object matching schema
      topLabel: top_label,
      detectedEmotions: Object.entries(scores)
        .filter(([_, score]) => score > 0.1) // Filter emotions with score > 0.1
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5 emotions
        .map(([emotion]) => emotion),
      confidence: scores[top_label] || 0,
      sourceText: text.substring(0, 5000), // Store first 5000 chars
      modelVersion: "1.0.0",
    });

    await emotion.save();

    // Update diary to mark as AI analyzed
    await Diary.findByIdAndUpdate(diaryId, { aiAnalyzed: true });

    console.log(
      `[ML Analysis] Successfully saved emotion analysis for diary ${diaryId}`
    );
    console.log(
      `[ML Analysis] Top emotion: ${top_label}, Confidence: ${emotion.confidence}`
    );

    if (summary_suggestion) {
      console.log(`[ML Analysis] Summary: ${summary_suggestion}`);
    }

    return emotion;
  } catch (error) {
    // Log error but don't throw - we don't want to fail diary creation
    console.error(
      `[ML Analysis Error] Failed to analyze diary ${diaryId}:`,
      error.message
    );

    if (error.response) {
      console.error(
        `[ML Analysis Error] ML service responded with status ${error.response.status}`
      );
      console.error(`[ML Analysis Error] Response data:`, error.response.data);
    } else if (error.request) {
      console.error(
        `[ML Analysis Error] No response received from ML service at ${ML_SERVICE_URL}`
      );
    } else {
      console.error(`[ML Analysis Error] Error details:`, error.message);
    }

    // Don't throw - just log and continue
    return null;
  }
}

// All routes require authentication
router.use(authenticateToken);

/**
 * Register ML Analysis Worker
 * Process jobs from the queue to analyze diary content
 */
jobQueue.registerWorker("ml-analysis", async (jobData) => {
  const { diaryId, userId, content } = jobData;
  console.log(`[ML Worker] Processing analysis for diary ${diaryId}`);

  const result = await performMLAnalysis(diaryId, userId, content);

  if (!result) {
    throw new Error("ML analysis failed - check ML service connection");
  }

  return result;
});

/**
 * Validation rules
 */
const createDiaryValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 1, max: 10000 })
    .withMessage("Content must be between 1 and 10000 characters"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("mood")
    .optional()
    .isIn(["very_bad", "bad", "neutral", "good", "very_good"])
    .withMessage(
      "Mood must be one of: very_bad, bad, neutral, good, very_good"
    ),

  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

const updateDiaryValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Content must be between 1 and 10000 characters"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("mood")
    .optional()
    .isIn(["very_bad", "bad", "neutral", "good", "very_good"])
    .withMessage(
      "Mood must be one of: very_bad, bad, neutral, good, very_good"
    ),

  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

/**
 * Helper function to get emotion category from topLabel
 * Works with plain objects (from .lean())
 */
const getEmotionCategory = (topLabel) => {
  const positive = [
    "admiration",
    "amusement",
    "approval",
    "caring",
    "desire",
    "excitement",
    "gratitude",
    "joy",
    "love",
    "optimism",
    "pride",
    "relief",
  ];
  const negative = [
    "anger",
    "annoyance",
    "disappointment",
    "disapproval",
    "disgust",
    "embarrassment",
    "fear",
    "grief",
    "nervousness",
    "remorse",
    "sadness",
  ];
  const ambiguous = ["confusion", "curiosity", "realization", "surprise"];

  if (positive.includes(topLabel)) return "positive";
  if (negative.includes(topLabel)) return "negative";
  if (ambiguous.includes(topLabel)) return "ambiguous";
  return "neutral";
};

/**
 * Helper function to format diary response
 */
const formatDiaryResponse = (diary, emotion = null) => {
  const response = {
    id: diary._id,
    title: diary.title,
    content: diary.content,
    snippet:
      diary.content.substring(0, 200) +
      (diary.content.length > 200 ? "..." : ""),
    date: diary.date,
    mood: diary.mood,
    tags: diary.tags,
    isPrivate: diary.isPrivate,
    aiAnalyzed: diary.aiAnalyzed,
    createdAt: diary.createdAt,
    updatedAt: diary.updatedAt,
  };

  if (emotion) {
    response.emotionSummary = {
      topEmotion: emotion.topLabel,
      detectedEmotions: emotion.detectedEmotions,
      confidence: emotion.confidence,
      category: getEmotionCategory(emotion.topLabel),
    };
  }

  return response;
};

/**
 * @route   GET /api/diary
 * @desc    Get all diaries for logged-in user (paginated)
 * @access  Private
 */
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("sort")
      .optional()
      .isIn(["date", "createdAt", "-date", "-createdAt"])
      .withMessage("Invalid sort field"),
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

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sort = req.query.sort || "-date";

      console.log(`[Diary GET] Fetching diaries for user: ${req.userId}`);
      console.log(
        `[Diary GET] Query params: page=${page}, limit=${limit}, sort=${sort}`
      );

      // Get diaries for the authenticated user
      const diaries = await Diary.find({ user: req.userId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      console.log(`[Diary GET] Found ${diaries.length} diaries`);

      // Get total count for pagination
      const total = await Diary.countDocuments({ user: req.userId });

      console.log(`[Diary GET] Total diaries for user: ${total}`);

      // Get emotions for these diaries
      const diaryIds = diaries.map((d) => d._id);
      const emotions = await Emotion.find({ diary: { $in: diaryIds } }).lean();
      const emotionMap = {};
      emotions.forEach((e) => {
        emotionMap[e.diary.toString()] = e;
      });

      // Format response with emotion summaries
      const formattedDiaries = diaries.map((diary) =>
        formatDiaryResponse(diary, emotionMap[diary._id.toString()])
      );

      res.status(200).json({
        success: true,
        data: {
          diaries: formattedDiaries,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching diaries:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching diaries",
      });
    }
  }
);

/**
 * @route   POST /api/diary
 * @desc    Create a new diary entry and trigger ML analysis
 * @access  Private
 */
router.post("/", createDiaryValidation, async (req, res) => {
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

    const { title, content, date, mood, tags } = req.body;

    // Create diary entry
    const diary = new Diary({
      user: req.userId,
      title,
      content,
      date: date ? new Date(date) : new Date(),
      mood: mood || "neutral",
      tags: tags || [],
      isPrivate: true,
      aiAnalyzed: false,
    });

    await diary.save();

    // Enqueue ML analysis job (non-blocking)
    // Job will be processed asynchronously by the queue worker
    const jobInfo = jobQueue.enqueue("ml-analysis", {
      diaryId: diary._id,
      userId: req.userId,
      content: content,
    });

    console.log(`[Diary Create] Enqueued ML analysis job: ${jobInfo.id}`);

    // Return response immediately
    res.status(201).json({
      success: true,
      message:
        "Diary entry created successfully. Emotion analysis in progress.",
      data: {
        diary: formatDiaryResponse(diary),
        analysisJob: {
          id: jobInfo.id,
          status: jobInfo.status,
          queuePosition: jobInfo.queuePosition,
        },
      },
    });
  } catch (error) {
    console.error("Error creating diary:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating diary entry",
    });
  }
});

/**
 * @route   GET /api/diary/:id
 * @desc    Get a single diary entry (only owner)
 * @access  Private
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid diary ID")],
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

      const diary = await Diary.findById(req.params.id).lean();

      if (!diary) {
        return res.status(404).json({
          success: false,
          message: "Diary entry not found",
        });
      }

      // Check ownership
      if (diary.user.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view your own diary entries.",
        });
      }

      // Get associated emotion
      const emotion = await Emotion.findOne({ diary: diary._id }).lean();

      res.status(200).json({
        success: true,
        data: {
          diary: formatDiaryResponse(diary, emotion),
        },
      });
    } catch (error) {
      console.error("Error fetching diary:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching diary entry",
      });
    }
  }
);

/**
 * @route   PUT /api/diary/:id
 * @desc    Update a diary entry
 * @access  Private
 */
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid diary ID"),
    ...updateDiaryValidation,
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

      const diary = await Diary.findById(req.params.id);

      if (!diary) {
        return res.status(404).json({
          success: false,
          message: "Diary entry not found",
        });
      }

      // Check ownership
      if (diary.user.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only update your own diary entries.",
        });
      }

      // Update fields
      const { title, content, date, mood, tags } = req.body;

      if (title !== undefined) diary.title = title;
      if (content !== undefined) diary.content = content;
      if (date !== undefined) diary.date = new Date(date);
      if (mood !== undefined) diary.mood = mood;
      if (tags !== undefined) diary.tags = tags;

      await diary.save();

      // Get associated emotion
      const emotion = await Emotion.findOne({ diary: diary._id }).lean();

      res.status(200).json({
        success: true,
        message: "Diary entry updated successfully",
        data: {
          diary: formatDiaryResponse(diary, emotion),
        },
      });
    } catch (error) {
      console.error("Error updating diary:", error);

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error updating diary entry",
      });
    }
  }
);

/**
 * @route   DELETE /api/diary/:id
 * @desc    Delete a diary entry
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid diary ID")],
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

      const diary = await Diary.findById(req.params.id);

      if (!diary) {
        return res.status(404).json({
          success: false,
          message: "Diary entry not found",
        });
      }

      // Check ownership
      if (diary.user.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only delete your own diary entries.",
        });
      }

      // Delete associated emotion records
      await Emotion.deleteMany({ diary: diary._id });

      // Delete diary
      await diary.deleteOne();

      res.status(200).json({
        success: true,
        message: "Diary entry and associated emotion data deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting diary:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting diary entry",
      });
    }
  }
);

/**
 * @route   GET /api/diary/queue/stats
 * @desc    Get job queue statistics (debug endpoint)
 * @access  Private
 * @note    Remove or secure this endpoint in production
 */
router.get("/queue/stats", async (req, res) => {
  try {
    const stats = jobQueue.getStats();

    res.status(200).json({
      success: true,
      data: {
        queue: stats,
        note: "This is a debug endpoint. Remove or secure in production.",
      },
    });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching queue statistics",
    });
  }
});

module.exports = router;
