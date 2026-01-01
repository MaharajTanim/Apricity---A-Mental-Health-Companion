// Transfer diaries and emotions to atlasuser
require("dotenv").config();
const mongoose = require("mongoose");
const Diary = require("./src/models/Diary");
const Emotion = require("./src/models/Emotion");
const User = require("./src/models/User");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const transferData = async () => {
  try {
    // Get atlasuser
    const atlasUser = await User.findOne({ email: "atlasuser@example.com" });
    if (!atlasUser) {
      console.error("❌ AtlasUser not found");
      return;
    }

    console.log(
      `\n📝 Transferring data to: ${atlasUser.email} (${atlasUser._id})`
    );

    // Update all diaries
    const diaryResult = await Diary.updateMany(
      {},
      { $set: { user: atlasUser._id } }
    );
    console.log(`✅ Updated ${diaryResult.modifiedCount} diary entries`);

    // Update all emotions
    const emotionResult = await Emotion.updateMany(
      {},
      { $set: { user: atlasUser._id } }
    );
    console.log(`✅ Updated ${emotionResult.modifiedCount} emotion records`);

    console.log("\n🎉 Done! Refresh the page to see your emotions.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
};

(async () => {
  await connectDB();
  await transferData();
})();
