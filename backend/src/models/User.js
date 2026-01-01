const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * User Schema
 * Represents a user account in the system
 */
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Don't return password hash by default
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profile: {
      avatar: String,
      bio: {
        type: String,
        maxlength: 500,
      },
      preferences: {
        theme: {
          type: String,
          enum: ["light", "dark", "auto"],
          default: "dark",
        },
        notifications: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Indexes for better query performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1 });

// Virtual for user's full profile
UserSchema.virtual("diaries", {
  ref: "Diary",
  localField: "_id",
  foreignField: "user",
});

UserSchema.virtual("emotions", {
  ref: "Emotion",
  localField: "_id",
  foreignField: "user",
});

// Methods
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

// Static method to find by email
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
