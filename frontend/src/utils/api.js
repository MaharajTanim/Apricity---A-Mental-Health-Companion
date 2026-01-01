import axios from "axios";

/**
 * Axios API Instance
 * Configured with base URL from environment variables
 * Includes request/response interceptors for authentication and error handling
 */

// Get API URL from environment variables (Vite format)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: false, // Set to true if using cookies
});

/**
 * Request Interceptor
 * Automatically attaches JWT token to all requests
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    // Attach Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        config.data ? { data: config.data } : ""
      );
    }

    return config;
  },
  (error) => {
    // Log request error in development
    if (import.meta.env.DEV) {
      console.error("❌ Request Error:", error);
    }
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles common response scenarios and errors
 */
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        response.data
      );
    }

    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || "An error occurred";

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(
          `❌ API Error [${status}]: ${error.config?.method?.toUpperCase()} ${
            error.config?.url
          }`,
          error.response.data
        );
      }

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - Token expired or invalid
          console.warn("⚠️ Authentication failed. Redirecting to login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          // Redirect to auth page if not already there
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
          }
          break;

        case 403:
          // Forbidden - User doesn't have permission
          console.warn("⚠️ Access forbidden:", message);
          break;

        case 404:
          // Not Found
          console.warn("⚠️ Resource not found:", message);
          break;

        case 422:
          // Validation Error
          console.warn("⚠️ Validation error:", error.response.data);
          break;

        case 429:
          // Too Many Requests
          console.warn("⚠️ Too many requests. Please try again later.");
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server Errors
          console.error("🔥 Server error:", message);
          break;

        default:
          console.error(`❌ HTTP Error ${status}:`, message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error(
        "🌐 Network Error: No response from server. Please check your connection."
      );

      // Add user-friendly error message
      error.message =
        "Cannot connect to server. Please check your internet connection.";
    } else {
      // Error setting up the request
      console.error("⚙️ Request Setup Error:", error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to check if error is a network error
 */
export const isNetworkError = (error) => {
  return error.request && !error.response;
};

/**
 * Helper function to check if error is an authentication error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * Helper function to check if error is a validation error
 */
export const isValidationError = (error) => {
  return error.response?.status === 422 || error.response?.status === 400;
};

/**
 * Helper function to get error message from error object
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

/**
 * Helper function to get validation errors from error object
 */
export const getValidationErrors = (error) => {
  if (
    error.response?.data?.errors &&
    Array.isArray(error.response.data.errors)
  ) {
    return error.response.data.errors;
  }
  return [];
};

export default api;
