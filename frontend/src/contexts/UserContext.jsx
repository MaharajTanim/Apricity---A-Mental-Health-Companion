import { createContext, useContext, useState, useEffect } from "react";
import { getUser, setAuth, clearAuth } from "../utils/auth";

/**
 * User Context
 * Provides user state and actions throughout the app
 */
const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Update user and sync with localStorage
  const updateUser = (userData, token = null) => {
    setUser(userData);
    if (token) {
      setAuth(token, userData);
    } else {
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        setAuth(currentToken, userData);
      }
    }
  };

  // Clear user and logout
  const logout = () => {
    setUser(null);
    clearAuth();
    window.location.href = "/auth";
  };

  const value = {
    user,
    setUser: updateUser,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

export default UserContext;
