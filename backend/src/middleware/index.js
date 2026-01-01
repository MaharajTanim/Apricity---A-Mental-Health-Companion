/**
 * Middleware Index
 * Central export point for all middleware
 */

const {
  authenticate,
  optionalAuthenticate,
  authenticateToken,
  verifyTokenMiddleware,
} = require("./auth");

const { errorHandler, notFoundHandler } = require("./errorHandler");

module.exports = {
  authenticate,
  optionalAuthenticate,
  authenticateToken,
  verifyTokenMiddleware,
  errorHandler,
  notFoundHandler,
};
