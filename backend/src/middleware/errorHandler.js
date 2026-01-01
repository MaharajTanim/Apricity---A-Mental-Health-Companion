/**
 * Centralized Error Handler Middleware
 * Handles all errors and returns consistent JSON responses
 */

/**
 * Error handler middleware
 * Catches all errors and formats them into consistent JSON responses
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(`[Error] ${req.method} ${req.path}`);
  console.error(`[Error] Message: ${err.message}`);

  if (process.env.NODE_ENV === "development") {
    console.error(`[Error] Stack: ${err.stack}`);
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse = {
    error: err.name || "Error",
    message: err.message || "An unexpected error occurred",
  };

  // Add additional details in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
    errorResponse.path = req.path;
    errorResponse.method = req.method;
  }

  // Handle specific error types
  if (err.name === "ValidationError") {
    errorResponse.error = "ValidationError";
    errorResponse.message = "Validation failed";
    errorResponse.details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (err.name === "CastError") {
    errorResponse.error = "CastError";
    errorResponse.message = "Invalid ID format";
  }

  if (err.name === "JsonWebTokenError") {
    errorResponse.error = "AuthenticationError";
    errorResponse.message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    errorResponse.error = "AuthenticationError";
    errorResponse.message = "Token expired";
  }

  if (err.code === 11000) {
    errorResponse.error = "DuplicateError";
    errorResponse.message = "Duplicate entry detected";
    const field = Object.keys(err.keyPattern || {})[0];
    if (field) {
      errorResponse.message = `${field} already exists`;
    }
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.path} not found`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
