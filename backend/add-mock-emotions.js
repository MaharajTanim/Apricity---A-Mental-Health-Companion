// Script to add mock emotion data to existing diary entries
require("dotenv").config();
const mongoose = require("mongoose");
const Diary = require("./src/models/Diary");
const Emotion = require("./src/models/Emotion");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/apricity";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Generate realistic emotion scores based on diary content keywords
const generateEmotionData = (content) => {
  const text = content.toLowerCase();

  // Initialize all 28 GoEmotions scores
  const scores = {
    admiration: 0.05,
    amusement: 0.05,
    approval: 0.05,
    caring: 0.05,
    desire: 0.05,
    excitement: 0.05,
    gratitude: 0.05,
    joy: 0.1,
    love: 0.1,
    optimism: 0.05,
    pride: 0.05,
    relief: 0.05,
    anger: 0.05,
    annoyance: 0.05,
    disappointment: 0.05,
    disapproval: 0.05,
    disgust: 0.05,
    embarrassment: 0.05,
    fear: 0.05,
    grief: 0.05,
    nervousness: 0.05,
    remorse: 0.05,
    sadness: 0.1,
    confusion: 0.05,
    curiosity: 0.05,
    realization: 0.05,
    surprise: 0.05,
    neutral: 0.2,
  };

  let topLabel = "neutral";

  // Adjust based on keywords
  if (
    text.includes("happy") ||
    text.includes("great") ||
    text.includes("wonderful")
  ) {
    scores.joy = 0.7 + Math.random() * 0.2;
    scores.excitement = 0.5 + Math.random() * 0.2;
    scores.gratitude = 0.4 + Math.random() * 0.2;
    topLabel = "joy";
  } else if (
    text.includes("sad") ||
    text.includes("depressed") ||
    text.includes("down")
  ) {
    scores.sadness = 0.7 + Math.random() * 0.2;
    scores.disappointment = 0.4 + Math.random() * 0.2;
    scores.grief = 0.3 + Math.random() * 0.2;
    topLabel = "sadness";
  } else if (
    text.includes("angry") ||
    text.includes("frustrated") ||
    text.includes("mad")
  ) {
    scores.anger = 0.7 + Math.random() * 0.2;
    scores.annoyance = 0.5 + Math.random() * 0.2;
    topLabel = "anger";
  } else if (
    text.includes("worried") ||
    text.includes("anxious") ||
    text.includes("stressed")
  ) {
    scores.nervousness = 0.7 + Math.random() * 0.2;
    scores.fear = 0.5 + Math.random() * 0.2;
    topLabel = "nervousness";
  } else if (
    text.includes("love") ||
    text.includes("grateful") ||
    text.includes("appreciate")
  ) {
    scores.love = 0.8 + Math.random() * 0.15;
    scores.gratitude = 0.7 + Math.random() * 0.2;
    scores.caring = 0.5 + Math.random() * 0.2;
    topLabel = "love";
  } else if (
    text.includes("excited") ||
    text.includes("amazing") ||
    text.includes("incredible")
  ) {
    scores.excitement = 0.8 + Math.random() * 0.15;
    scores.joy = 0.6 + Math.random() * 0.2;
    topLabel = "excitement";
  }

  // Normalize scores
  Object.keys(scores).forEach((key) => {
    scores[key] = Math.min(scores[key], 1.0);
  });

  // Get detected emotions (all with score > 0.3)
  const detectedEmotions = Object.entries(scores)
    .filter(([key, value]) => value > 0.3)
    .map(([key]) => key);

  return { scores, topLabel, detectedEmotions };
};

const addMockEmotions = async () => {
  try {
    // Get all diary entries
    const diaries = await Diary.find();

    console.log(`\nFound ${diaries.length} diary entries`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const diary of diaries) {
      // Check if emotions already exist for this diary
      const existingEmotion = await Emotion.findOne({ diary: diary._id });
      if (existingEmotion) {
        console.log(`⏭️  Skipping diary ${diary._id} - emotions already exist`);
        skippedCount++;
        continue;
      }

      // Generate emotion data
      const emotionData = generateEmotionData(diary.content);

      // Create emotion document
      const emotion = new Emotion({
        user: diary.user,
        diary: diary._id,
        date: diary.date,
        scores: emotionData.scores,
        topLabel: emotionData.topLabel,
        detectedEmotions: emotionData.detectedEmotions,
        confidence: 0.75 + Math.random() * 0.2,
        sourceText: diary.content.substring(0, 500),
        modelVersion: "mock-v1.0",
        processingTime: Math.floor(Math.random() * 500) + 100,
      });

      await emotion.save();

      console.log(
        `✅ Added emotions to diary ${diary._id} - Top: ${emotion.topLabel} (${(
          emotionData.scores[emotion.topLabel] * 100
        ).toFixed(1)}%)`
      );
      addedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Added emotions: ${addedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(
      `\n🎉 Done! Refresh the Emotion Log page to see visualizations.`
    );
  } catch (error) {
    console.error("❌ Error adding emotions:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
};

// Run the script
(async () => {
  await connectDB();
  await addMockEmotions();
})();
