const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Emotion Schema
 * Represents emotion detection results for user text/diary entries
 * Uses 5 core emotions mapped from GoEmotions (28 labels)
 */

// 5 Core emotion labels (mapped from fine-grained emotions)
const CORE_EMOTION_LABELS = ["anger", "joy", "fear", "sadness", "surprise"];

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
    // Core emotion scores (5 emotions)
    scores: {
      type: Map,
      of: {
        type: Number,
        min: 0,
        max: 1,
      },
      default: {},
    },
    topLabel: {
      type: String,
      required: [true, "Top emotion label is required"],
      enum: CORE_EMOTION_LABELS,
      index: true,
    },
    detectedEmotions: [
      {
        type: String,
        enum: CORE_EMOTION_LABELS,
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
  // Handle Map type for scores
  const scoresObj =
    this.scores instanceof Map ? Object.fromEntries(this.scores) : this.scores;

  const emotionArray = Object.entries(scoresObj || {})
    .filter(([key, value]) => value > 0)
    .map(([emotion, score]) => ({ emotion, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return emotionArray;
};

EmotionSchema.methods.getEmotionCategory = function () {
  // For 5 core emotions, map to positive/negative sentiment
  const positive = ["joy", "surprise"];
  const negative = ["anger", "fear", "sadness"];

  if (positive.includes(this.topLabel)) return "positive";
  if (negative.includes(this.topLabel)) return "negative";
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
