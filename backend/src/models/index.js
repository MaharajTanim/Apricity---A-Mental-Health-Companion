/**
 * Models Index
 * Central export point for all Mongoose models
 */

const User = require("./User");
const Diary = require("./Diary");
const Emotion = require("./Emotion");

module.exports = {
  User,
  Diary,
  Emotion,
};
