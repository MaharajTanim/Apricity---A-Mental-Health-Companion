/**
 * Routes Index
 * Central export point for all API routes
 */

const authRoutes = require("./auth");
const diaryRoutes = require("./diary");
const emotionRoutes = require("./emotion");
const suggestionsRoutes = require("./suggestions");
const userRoutes = require("./user");

module.exports = {
  authRoutes,
  diaryRoutes,
  emotionRoutes,
  suggestionsRoutes,
  userRoutes,
};
