const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function test() {
  try {
    // Login
    console.log("Logging in...");
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "test@test.com",
      password: "Test123!",
    });
    const token = loginRes.data.data.token;
    console.log("Login successful!");

    // Create diary
    console.log("\nCreating diary...");
    const diaryRes = await axios.post(
      `${BASE_URL}/api/diary`,
      {
        title: "Testing Emotion Detection",
        content:
          "I feel absolutely wonderful and happy today! Everything is going great and I am so grateful for life.",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Diary created:", diaryRes.data);

    // Wait for ML analysis
    console.log("\nWaiting 10 seconds for ML analysis...");
    await new Promise((r) => setTimeout(r, 10000));

    // Check emotions
    console.log("\nChecking emotions in database...");
    const mongoose = require("mongoose");
    const uri =
      "mongodb+srv://maharajtanim106_db_user:pRwCunQgH4DivB3B@apricity.drp3ggm.mongodb.net/apricity?retryWrites=true&w=majority&appName=Apricity";
    await mongoose.connect(uri);

    const Emotion = require("./src/models/Emotion");
    const emotions = await Emotion.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    console.log(
      "Recent emotions:",
      emotions.map((e) => ({
        topLabel: e.topLabel,
        confidence: e.confidence,
        diary: e.diary?.toString(),
      }))
    );

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

test();
