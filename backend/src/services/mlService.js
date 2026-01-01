const axios = require("axios");

/**
 * ML Service Client
 * Handles communication with the ML microservice for emotion analysis
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Send text to ML service for emotion detection
 * @param {string} text - Text to analyze
 * @param {string} userId - User ID for tracking
 * @returns {Promise<Object>} Emotion analysis results
 */
const analyzeEmotion = async (text, userId = null) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/detect-emotion`,
      { text },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("ML Service Error (detect-emotion):", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get full chat response from ML service (emotion + support text)
 * @param {string} text - User text
 * @param {string} userName - User's name for personalization
 * @returns {Promise<Object>} Full analysis with support response
 */
const getFullAnalysis = async (text, userName = null) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/v1/chat`,
      {
        text,
        user_name: userName,
      },
      {
        timeout: 15000, // 15 second timeout for generation
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("ML Service Error (chat):", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check ML service health
 * @returns {Promise<boolean>} True if service is healthy
 */
const checkMLServiceHealth = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error("ML Service health check failed:", error.message);
    return false;
  }
};

/**
 * Trigger async emotion analysis for diary entry
 * Non-blocking - continues even if ML service fails
 * @param {Object} diary - Diary document
 * @param {Object} user - User document
 */
const triggerAsyncAnalysis = async (diary, user) => {
  try {
    // Combine title and content for analysis
    const textToAnalyze = `${diary.title}. ${diary.content}`;

    // Call ML service (non-blocking)
    const result = await analyzeEmotion(textToAnalyze, user._id.toString());

    if (result.success && result.data) {
      // Import Emotion model here to avoid circular dependencies
      const Emotion = require("../models/Emotion");

      // Parse emotion data
      const emotionData = result.data;
      const emotions = emotionData.emotions.split(",").map((e) => e.trim());
      const topEmotion = emotions[0] || "neutral";

      // Create emotion scores object
      const scores = {};
      emotionData.all_emotions.forEach((emotion) => {
        scores[emotion] = 0.5; // Default score for detected emotions
      });

      // Create emotion record
      const emotion = new Emotion({
        user: user._id,
        date: diary.date,
        scores: scores,
        topLabel: topEmotion,
        detectedEmotions: emotionData.all_emotions,
        confidence: emotionData.confidence,
        diary: diary._id,
        sourceText: textToAnalyze.substring(0, 5000),
        modelVersion: "1.0.0",
      });

      await emotion.save();

      // Update diary to mark as analyzed
      diary.aiAnalyzed = true;
      await diary.save();

      console.log(`✅ Emotion analysis completed for diary ${diary._id}`);
    } else {
      console.warn(
        `⚠️  ML analysis failed for diary ${diary._id}: ${result.error}`
      );
    }
  } catch (error) {
    console.error("Error in async emotion analysis:", error.message);
    // Don't throw - this is a background task
  }
};

module.exports = {
  analyzeEmotion,
  getFullAnalysis,
  checkMLServiceHealth,
  triggerAsyncAnalysis,
};
