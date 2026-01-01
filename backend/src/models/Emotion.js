const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Emotion Schema
 * Represents emotion detection results for user text/diary entries
 * Based on GoEmotions dataset (28 emotions)
 */
const EmotionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
      index: true,
    },
    // Multi-label emotion scores (GoEmotions 28 labels)
    scores: {
      // Positive emotions
      admiration: { type: Number, min: 0, max: 1, default: 0 },
      amusement: { type: Number, min: 0, max: 1, default: 0 },
      approval: { type: Number, min: 0, max: 1, default: 0 },
      caring: { type: Number, min: 0, max: 1, default: 0 },
      desire: { type: Number, min: 0, max: 1, default: 0 },
      excitement: { type: Number, min: 0, max: 1, default: 0 },
      gratitude: { type: Number, min: 0, max: 1, default: 0 },
      joy: { type: Number, min: 0, max: 1, default: 0 },
      love: { type: Number, min: 0, max: 1, default: 0 },
      optimism: { type: Number, min: 0, max: 1, default: 0 },
      pride: { type: Number, min: 0, max: 1, default: 0 },
      relief: { type: Number, min: 0, max: 1, default: 0 },

      // Negative emotions
      anger: { type: Number, min: 0, max: 1, default: 0 },
      annoyance: { type: Number, min: 0, max: 1, default: 0 },
      disappointment: { type: Number, min: 0, max: 1, default: 0 },
      disapproval: { type: Number, min: 0, max: 1, default: 0 },
      disgust: { type: Number, min: 0, max: 1, default: 0 },
      embarrassment: { type: Number, min: 0, max: 1, default: 0 },
      fear: { type: Number, min: 0, max: 1, default: 0 },
      grief: { type: Number, min: 0, max: 1, default: 0 },
      nervousness: { type: Number, min: 0, max: 1, default: 0 },
      remorse: { type: Number, min: 0, max: 1, default: 0 },
      sadness: { type: Number, min: 0, max: 1, default: 0 },

      // Ambiguous emotions
      confusion: { type: Number, min: 0, max: 1, default: 0 },
      curiosity: { type: Number, min: 0, max: 1, default: 0 },
      realization: { type: Number, min: 0, max: 1, default: 0 },
      surprise: { type: Number, min: 0, max: 1, default: 0 },

      // Neutral
      neutral: { type: Number, min: 0, max: 1, default: 0 },
    },
    topLabel: {
      type: String,
      required: [true, "Top emotion label is required"],
      enum: [
        "admiration",
        "amusement",
        "anger",
        "annoyance",
        "approval",
        "caring",
        "confusion",
        "curiosity",
        "desire",
        "disappointment",
        "disapproval",
        "disgust",
        "embarrassment",
        "excitement",
        "fear",
        "gratitude",
        "grief",
        "joy",
        "love",
        "nervousness",
        "optimism",
        "pride",
        "realization",
        "relief",
        "remorse",
        "sadness",
        "surprise",
        "neutral",
      ],
      index: true,
    },
    detectedEmotions: [
      {
        type: String,
        enum: [
          "admiration",
          "amusement",
          "anger",
          "annoyance",
          "approval",
          "caring",
          "confusion",
          "curiosity",
          "desire",
          "disappointment",
          "disapproval",
          "disgust",
          "embarrassment",
          "excitement",
          "fear",
          "gratitude",
          "grief",
          "joy",
          "love",
          "nervousness",
          "optimism",
          "pride",
          "realization",
          "relief",
          "remorse",
          "sadness",
          "surprise",
          "neutral",
        ],
      },
    ],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    diary: {
      type: Schema.Types.ObjectId,
      ref: "Diary",
      index: true,
      default: null,
    },
    sourceText: {
      type: String,
      maxlength: 5000,
    },
    modelVersion: {
      type: String,
      default: "1.0.0",
    },
    processingTime: {
      type: Number, // in milliseconds
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "emotions",
  }
);

// Compound indexes for efficient queries
EmotionSchema.index({ user: 1, date: -1 });
EmotionSchema.index({ user: 1, createdAt: -1 });
EmotionSchema.index({ user: 1, topLabel: 1 });
EmotionSchema.index({ user: 1, diary: 1 });
EmotionSchema.index({ date: -1 });

// Index for diary lookup
EmotionSchema.index({ diary: 1 }, { sparse: true });

// Instance methods
EmotionSchema.methods.getTopEmotions = function (limit = 5) {
  const emotionArray = Object.entries(this.scores)
    .filter(([key, value]) => value > 0)
    .map(([emotion, score]) => ({ emotion, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return emotionArray;
};

EmotionSchema.methods.getEmotionCategory = function () {
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

  if (positive.includes(this.topLabel)) return "positive";
  if (negative.includes(this.topLabel)) return "negative";
  if (ambiguous.includes(this.topLabel)) return "ambiguous";
  return "neutral";
};

// Static methods
EmotionSchema.statics.findByUser = function (userId, options = {}) {
  const query = this.find({ user: userId });

  if (options.limit) {
    query.limit(options.limit);
  }

  if (options.sort !== false) {
    query.sort({ date: -1, createdAt: -1 });
  }

  return query;
};

EmotionSchema.statics.findByDateRange = function (userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: -1 });
};

EmotionSchema.statics.getEmotionStats = async function (
  userId,
  startDate,
  endDate
) {
  const emotions = await this.find({
    user: userId,
    ...(startDate &&
      endDate && {
        date: { $gte: startDate, $lte: endDate },
      }),
  });

  const stats = {
    total: emotions.length,
    byCategory: {
      positive: 0,
      negative: 0,
      ambiguous: 0,
      neutral: 0,
    },
    topEmotions: {},
    averageConfidence: 0,
  };

  if (emotions.length === 0) return stats;

  emotions.forEach((emotion) => {
    const category = emotion.getEmotionCategory();
    stats.byCategory[category]++;

    stats.topEmotions[emotion.topLabel] =
      (stats.topEmotions[emotion.topLabel] || 0) + 1;

    stats.averageConfidence += emotion.confidence;
  });

  stats.averageConfidence /= emotions.length;

  return stats;
};

EmotionSchema.statics.findByDiary = function (diaryId) {
  return this.findOne({ diary: diaryId });
};

const Emotion = mongoose.model("Emotion", EmotionSchema);

module.exports = Emotion;
