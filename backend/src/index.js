require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const { connectDB, isConnected } = require("./db");
const {
  authRoutes,
  diaryRoutes,
  emotionRoutes,
  suggestionsRoutes,
  userRoutes,
} = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware");

/**
 * Job Queue System
 *
 * The application uses an in-memory job queue for processing ML analysis tasks.
 * When a diary is created, an analysis job is enqueued and processed asynchronously.
 *
 * Current Implementation: In-Memory Queue (src/services/jobQueue.js)
 * - Jobs stored in memory array
 * - Sequential processing with setImmediate
 * - Automatic retry (3 attempts) with 2s delay
 * - Lost on server restart
 *
 * TODO: Production Migration to Bull + Redis
 * - Install: npm install bull redis
 * - Benefits:
 *   * Persistent job storage (survives server restarts)
 *   * Distributed processing across multiple servers
 *   * Priority queues and delayed jobs
 *   * Job progress tracking and events
 *   * Better monitoring and error handling
 *   * Scheduled/recurring jobs
 * - Setup Redis server: docker run -p 6379:6379 redis
 * - Add REDIS_URL to .env: redis://localhost:6379
 * - Replace jobQueue service with Bull implementation
 */

// Initialize Express app
const app = express();

// Middleware Configuration
// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS - Allow cross-origin requests from frontend only
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.CORS_ORIGIN || "http://localhost:3000",
];

// In development, also allow localhost variations
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173"); // Vite default port
  allowedOrigins.push("http://127.0.0.1:3000");
  allowedOrigins.push("http://127.0.0.1:5173");
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400, // 24 hours
  })
);

// Body Parser - Parse JSON and URL-encoded bodies
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Request logging with morgan
if (process.env.NODE_ENV === "production") {
  // Production: Log in combined format
  app.use(morgan("combined"));
} else {
  // Development: Log in detailed dev format with colors
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Apricity Backend API",
    version: "1.0.0",
    database: isConnected() ? "connected" : "disconnected",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Apricity API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      user: "/api/user",
      diary: "/api/diary",
      emotion: "/api/emotion",
      suggestions: "/api/suggestions",
      api: "/api/v1",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/emotion", emotionRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/user", userRoutes);

// API v1 Routes placeholder
app.use("/api/v1", (req, res) => {
  res.status(200).json({
    message: "Apricity API v1",
    status: "operational",
  });
});

// 404 Handler - Must come after all routes
app.use(notFoundHandler);

// Centralized Error Handler - Must be last middleware
app.use(errorHandler);

// Start server only if not in test environment
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "localhost";

  // Connect to database first, then start server
  connectDB()
    .then(() => {
      app.listen(PORT, HOST, () => {
        console.log("=".repeat(50));
        console.log(`🚀 Apricity Backend Server`);
        console.log(`📍 Running on: http://${HOST}:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
        console.log("=".repeat(50));
      });
    })
    .catch((err) => {
      console.error("Failed to connect to database:", err);
      process.exit(1);
    });
}

// Export app for testing
module.exports = app;
