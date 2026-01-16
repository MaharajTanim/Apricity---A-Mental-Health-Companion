const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Diary = require("../models/Diary");
const Emotion = require("../models/Emotion");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/stats
 * @desc    Get user's quick stats (entries, streaks, emotions)
 * @access  Private
 */
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all diary entries for the user
    const diaries = await Diary.find({ user: userId }).sort({ date: -1 });

    // Get all emotions for the user
    const emotions = await Emotion.find({ user: userId });

    // Calculate basic stats
    const totalEntries = diaries.length;
    const totalEmotions = emotions.length;

    // Calculate unique days with entries
    const uniqueDays = new Set(
      diaries.map((d) => new Date(d.date).toISOString().split("T")[0])
    );
    const daysActive = uniqueDays.size;

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(diaries);

    // Calculate emotion distribution
    const emotionCounts = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
    };

    emotions.forEach((emotion) => {
      if (emotionCounts[emotion.topLabel] !== undefined) {
        emotionCounts[emotion.topLabel]++;
      }
    });

    // Find dominant emotion
    let dominantEmotion = null;
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    }

    // Calculate percentages
    const emotionPercentages = {};
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      emotionPercentages[emotion] =
        totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0;
    }

    // Calculate weekly comparison
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const thisWeekEntries = diaries.filter(
      (d) => new Date(d.date) >= oneWeekAgo
    ).length;
    const lastWeekEntries = diaries.filter(
      (d) => new Date(d.date) >= twoWeeksAgo && new Date(d.date) < oneWeekAgo
    ).length;

    // Calculate mood trend (positive emotions percentage this month)
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const thisMonthEmotions = emotions.filter(
      (e) => new Date(e.date) >= oneMonthAgo
    );
    const positiveThisMonth = thisMonthEmotions.filter(
      (e) => e.topLabel === "joy" || e.topLabel === "surprise"
    ).length;
    const positivityRate =
      thisMonthEmotions.length > 0
        ? Math.round((positiveThisMonth / thisMonthEmotions.length) * 100)
        : 0;

    // Calculate milestones/achievements
    const achievements = calculateAchievements(
      totalEntries,
      longestStreak,
      daysActive,
      totalEmotions
    );

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEntries,
          totalEmotions,
          daysActive,
          currentStreak,
          longestStreak,
          thisWeekEntries,
          lastWeekEntries,
          positivityRate,
        },
        emotionDistribution: {
          counts: emotionCounts,
          percentages: emotionPercentages,
          dominant: dominantEmotion,
          dominantPercentage: dominantEmotion
            ? emotionPercentages[dominantEmotion]
            : 0,
        },
        achievements,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
    });
  }
});

/**
 * Calculate current and longest streaks from diary entries
 */
function calculateStreaks(diaries) {
  if (diaries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates sorted descending
  const uniqueDates = [
    ...new Set(
      diaries.map((d) => new Date(d.date).toISOString().split("T")[0])
    ),
  ].sort((a, b) => new Date(b) - new Date(a));

  // Calculate current streak (consecutive days from today or yesterday)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Check if streak starts from today or yesterday
  let streakStarted = false;
  let checkDate = new Date(today);

  if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
    streakStarted = true;
    checkDate = new Date(uniqueDates[0]);
  }

  if (streakStarted) {
    for (const dateStr of uniqueDates) {
      const checkDateStr = checkDate.toISOString().split("T")[0];
      if (dateStr === checkDateStr) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (new Date(dateStr) < checkDate) {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const diffDays = Math.round((current - next) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

/**
 * Calculate user achievements/milestones
 */
function calculateAchievements(
  totalEntries,
  longestStreak,
  daysActive,
  totalEmotions
) {
  const achievements = [
    {
      id: "first_entry",
      title: "First Entry",
      description: "Write your first journal entry",
      icon: "📝",
      unlocked: totalEntries >= 1,
      progress: Math.min(totalEntries, 1),
      target: 1,
    },
    {
      id: "streak_3",
      title: "3-Day Streak",
      description: "Journal for 3 consecutive days",
      icon: "🔥",
      unlocked: longestStreak >= 3,
      progress: Math.min(longestStreak, 3),
      target: 3,
    },
    {
      id: "streak_7",
      title: "Week Warrior",
      description: "Journal for 7 consecutive days",
      icon: "⭐",
      unlocked: longestStreak >= 7,
      progress: Math.min(longestStreak, 7),
      target: 7,
    },
    {
      id: "streak_30",
      title: "Monthly Master",
      description: "Journal for 30 consecutive days",
      icon: "🏆",
      unlocked: longestStreak >= 30,
      progress: Math.min(longestStreak, 30),
      target: 30,
    },
    {
      id: "entries_10",
      title: "Getting Started",
      description: "Write 10 journal entries",
      icon: "📚",
      unlocked: totalEntries >= 10,
      progress: Math.min(totalEntries, 10),
      target: 10,
    },
    {
      id: "entries_50",
      title: "Dedicated Writer",
      description: "Write 50 journal entries",
      icon: "✍️",
      unlocked: totalEntries >= 50,
      progress: Math.min(totalEntries, 50),
      target: 50,
    },
    {
      id: "entries_100",
      title: "Centurion",
      description: "Write 100 journal entries",
      icon: "💯",
      unlocked: totalEntries >= 100,
      progress: Math.min(totalEntries, 100),
      target: 100,
    },
    {
      id: "emotions_tracked",
      title: "Emotion Explorer",
      description: "Track 25 emotions",
      icon: "🎭",
      unlocked: totalEmotions >= 25,
      progress: Math.min(totalEmotions, 25),
      target: 25,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return {
    list: achievements,
    unlockedCount,
    totalCount: achievements.length,
  };
}

/**
 * @route   GET /api/user/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          profile: user.profile,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  "/profile",
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
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

      const { name } = req.body;

      // Find user
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update only if provided
      if (name !== undefined) {
        user.name = name;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            profile: user.profile,
          },
        },
      });
    } catch (error) {
      console.error("Error updating user profile:", error);

      // Handle mongoose validation errors
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
        message: "Internal server error",
      });
    }
  }
);

module.exports = router;
