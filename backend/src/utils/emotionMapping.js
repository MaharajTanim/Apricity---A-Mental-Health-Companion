/**
 * Emotion Mapping Utility
 * Handles 5 core emotions from DeBERTa-v3 model (Sadman4701/Deberta-v3-base-for-apricity)
 *
 * Core emotions: anger, fear, joy, sadness, surprise
 * The model directly outputs these 5 emotions, no mapping needed.
 */

// Core emotion labels
const CORE_EMOTIONS = ["anger", "joy", "fear", "sadness", "surprise"];

/**
 * Validate and normalize a core emotion
 * @param {string} emotion - The emotion label from ML model
 * @returns {string} - The validated core emotion (lowercase)
 */
function mapToCoreEmotion(emotion) {
  if (!emotion) return "joy"; // Default fallback

  const lowerEmotion = emotion.toLowerCase();

  // The DeBERTa model directly outputs core emotions
  // Just validate it's one of the 5 core emotions
  if (CORE_EMOTIONS.includes(lowerEmotion)) {
    return lowerEmotion;
  }

  // Fallback for any unexpected values
  console.warn(`Unexpected emotion label: ${emotion}, defaulting to joy`);
  return "joy";
}

/**
 * Validate an array of emotions (removes duplicates, ensures core emotions only)
 * @param {string[]} emotions - Array of emotion labels
 * @returns {string[]} - Array of unique core emotions
 */
function mapEmotionsToCoreEmotions(emotions) {
  if (!emotions || !Array.isArray(emotions)) return [];

  const coreEmotions = emotions.map((e) => mapToCoreEmotion(e));
  return [...new Set(coreEmotions)]; // Remove duplicates
}

/**
 * Aggregate scores by core emotion
 * Since the model directly outputs 5 core emotions, this just validates and returns
 * @param {Object} scores - Object with emotion scores from ML model
 * @returns {Object} - Object with core emotion scores
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

  // The DeBERTa model directly outputs scores for 5 core emotions
  Object.entries(scoresObj).forEach(([emotion, score]) => {
    const lowerEmotion = emotion.toLowerCase();
    if (CORE_EMOTIONS.includes(lowerEmotion)) {
      coreScores[lowerEmotion] = score;
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
  mapToCoreEmotion,
  mapEmotionsToCoreEmotions,
  aggregateScoresToCoreEmotions,
  getEmotionSentiment,
};
