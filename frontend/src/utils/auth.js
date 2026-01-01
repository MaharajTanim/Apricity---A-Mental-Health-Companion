/**
 * Authentication Utility Functions
 * Provides helper functions for managing authentication state
 */

/**
 * Get the JWT token from localStorage
 * @returns {string|null} The JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Get the user object from localStorage
 * @returns {Object|null} The user object or null if not found
 */
export const getUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  }
  return null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Store authentication data in localStorage
 * @param {string} token - JWT token
 * @param {Object} user - User object
 */
export const setAuth = (token, user) => {
  localStorage.setItem("token", token);
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Logout user and redirect to auth page
 */
export const logout = () => {
  clearAuth();
  window.location.href = "/auth";
};

/**
 * Get Authorization header for API requests
 * @returns {Object} Headers object with Authorization header
 */
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
