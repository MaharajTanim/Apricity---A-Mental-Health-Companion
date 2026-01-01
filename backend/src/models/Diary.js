const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Diary Schema
 * Represents a journal entry created by a user
 */
const DiarySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title must be at least 1 character"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [1, "Content must be at least 1 character"],
      maxlength: [10000, "Content cannot exceed 10000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
      index: true,
    },
    mood: {
      type: String,
      enum: ["very_bad", "bad", "neutral", "good", "very_good"],
      default: "neutral",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isPrivate: {
      type: Boolean,
      default: true,
    },
    aiAnalyzed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "diaries",
  }
);

// Compound indexes for efficient queries
DiarySchema.index({ user: 1, date: -1 });
DiarySchema.index({ user: 1, createdAt: -1 });
DiarySchema.index({ user: 1, tags: 1 });
DiarySchema.index({ date: -1 });

// Virtual for associated emotion data
DiarySchema.virtual("emotion", {
  ref: "Emotion",
  localField: "_id",
  foreignField: "diary",
  justOne: true,
});

// Pre-save middleware to ensure date is set
DiarySchema.pre("save", function (next) {
  if (!this.date) {
    this.date = new Date();
  }
  next();
});

// Instance methods
DiarySchema.methods.getExcerpt = function (length = 150) {
  if (this.content.length <= length) {
    return this.content;
  }
  return this.content.substring(0, length) + "...";
};

// Static methods
DiarySchema.statics.findByUser = function (userId, options = {}) {
  const query = this.find({ user: userId });

  if (options.limit) {
    query.limit(options.limit);
  }

  if (options.sort !== false) {
    query.sort({ date: -1, createdAt: -1 });
  }

  return query;
};

DiarySchema.statics.findByDateRange = function (userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: -1 });
};

DiarySchema.statics.searchByText = function (userId, searchText) {
  return this.find({
    user: userId,
    $or: [
      { title: { $regex: searchText, $options: "i" } },
      { content: { $regex: searchText, $options: "i" } },
    ],
  }).sort({ date: -1 });
};

const Diary = mongoose.model("Diary", DiarySchema);

module.exports = Diary;
