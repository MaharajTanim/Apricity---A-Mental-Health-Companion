/**
 * Emotion Mapping Utility
 * Maps 28 GoEmotions labels to 5 core emotions
 */

// Core emotion labels
const CORE_EMOTIONS = ["anger", "joy", "fear", "sadness", "surprise"];

// Mapping from fine-grained emotions to core emotions
const EMOTION_MAP = {
  // Anger category
  anger: "anger",
  annoyance: "anger",
  disapproval: "anger",
  disgust: "anger",

  // Joy category
  joy: "joy",
  amusement: "joy",
  approval: "joy",
  excitement: "joy",
  gratitude: "joy",
  love: "joy",
  optimism: "joy",
  relief: "joy",
  pride: "joy",
  admiration: "joy",
  desire: "joy",
  caring: "joy",

  // Fear category
  fear: "fear",
  nervousness: "fear",

  // Sadness category
  sadness: "sadness",
  disappointment: "sadness",
  embarrassment: "sadness",
  grief: "sadness",
  remorse: "sadness",

  // Surprise category
  surprise: "surprise",
  confusion: "surprise",
  curiosity: "surprise",
  realization: "surprise",

  // Neutral maps to joy (most positive default)
  neutral: "joy",
};

/**
 * Map a fine-grained emotion to a core emotion
 * @param {string} emotion - The fine-grained emotion label
 * @returns {string} - The mapped core emotion
 */
function mapToCoreEmotion(emotion) {
  if (!emotion) return "joy"; // Default fallback

  const lowerEmotion = emotion.toLowerCase();

  // If already a core emotion, return it
  if (CORE_EMOTIONS.includes(lowerEmotion)) {
    return lowerEmotion;
  }

  // Map to core emotion
  return EMOTION_MAP[lowerEmotion] || "joy"; // Default to joy if unknown
}

/**
 * Map an array of emotions to core emotions (removes duplicates)
 * @param {string[]} emotions - Array of fine-grained emotion labels
 * @returns {string[]} - Array of unique core emotions
 */
function mapEmotionsToCoreEmotions(emotions) {
  if (!emotions || !Array.isArray(emotions)) return [];

  const coreEmotions = emotions.map((e) => mapToCoreEmotion(e));
  return [...new Set(coreEmotions)]; // Remove duplicates
}

/**
 * Aggregate scores by core emotion
 * @param {Object} scores - Object with fine-grained emotion scores
 * @returns {Object} - Object with core emotion scores (max score per category)
 */
function aggregateScoresToCoreEmotions(scores) {
  if (!scores) return {};

  const coreScores = {
    anger: 0,
    joy: 0,
    fear: 0,
    sadness: 0,
    surprise: 0,
  };

  // Handle Map type
  const scoresObj = scores instanceof Map ? Object.fromEntries(scores) : scores;

  Object.entries(scoresObj).forEach(([emotion, score]) => {
    const coreEmotion = mapToCoreEmotion(emotion);
    // Use max score for each core emotion category
    if (score > coreScores[coreEmotion]) {
      coreScores[coreEmotion] = score;
    }
  });

  return coreScores;
}

/**
 * Get the emotion category for display (positive/negative)
 * @param {string} coreEmotion - One of the 5 core emotions
 * @returns {string} - 'positive' or 'negative'
 */
function getEmotionSentiment(coreEmotion) {
  const positive = ["joy", "surprise"];
  const negative = ["anger", "fear", "sadness"];

  if (positive.includes(coreEmotion)) return "positive";
  if (negative.includes(coreEmotion)) return "negative";
  return "neutral";
}

module.exports = {
  CORE_EMOTIONS,
  EMOTION_MAP,
  mapToCoreEmotion,
  mapEmotionsToCoreEmotions,
  aggregateScoresToCoreEmotions,
  getEmotionSentiment,
};
