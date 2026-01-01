import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to /auth if user is not authenticated
 *
 * Usage:
 * <Route path="/home" element={<ProtectedRoute><HomeDashboard /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to auth page if not logged in
    return <Navigate to="/auth" replace />;
  }

  // Render the protected component if authenticated
  return children;
};

export default ProtectedRoute;
