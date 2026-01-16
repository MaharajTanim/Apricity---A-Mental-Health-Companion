import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout, setAuth } from "../utils/auth";
import api from "../utils/api";
import { ToastContainer, useToast } from "../components/Toast";
import QuickStatsCard from "../components/QuickStatsCard";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error, warning } = useToast();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setName(currentUser.name || "");
      setIsLoading(false);
    } else {
      // If no user data, fetch from API
      fetchUserProfile();
    }
  }, []);

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await api.get("/api/user/profile");
      if (response.data.success) {
        const userData = response.data.data.user;
        setUser(userData);
        setName(userData.name || "");

        // Update localStorage with fresh data
        const token = localStorage.getItem("token");
        if (token) {
          setAuth(token, userData);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response) {
        setApiError(error.response.data.message || "Failed to load profile");
      } else {
        setApiError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset to original name
      setName(user?.name || "");
      setErrors({});
      setApiError("");
    }
    setIsEditing(!isEditing);
  };

  // Validate name
  const validateName = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle name update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateName()) {
      return;
    }

    // Check if name actually changed
    if (name.trim() === user?.name) {
      warning("No changes to save");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.put("/api/user/profile", {
        name: name.trim(),
      });

      if (response.data.success) {
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        setName(updatedUser.name);

        // Update localStorage
        const token = localStorage.getItem("token");
        if (token) {
          setAuth(token, updatedUser);
        }

        success("Profile updated successfully! 👤");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      if (err.response) {
        if (
          err.response.data.errors &&
          Array.isArray(err.response.data.errors)
        ) {
          const backendErrors = {};
          err.response.data.errors.forEach((e) => {
            backendErrors[e.field] = e.message;
          });
          setErrors(backendErrors);
        } else {
          error(
            err.response.data.message ||
              "Failed to update profile. Please try again."
          );
        }
      } else {
        error("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page-container profile-page">
        <div className="loading-state">
          <span className="spinner large">⏳</span>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container profile-page">
      <div className="profile-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      {/* API Error Message */}
      {apiError && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      <div className="profile-content">
        {/* Personal Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <div className="card-header-title">
              <span className="card-icon">👤</span>
              <h2>Personal Information</h2>
            </div>
          </div>

          <div className="card-body">
            {!isEditing ? (
              // View Mode
              <>
                <div className="info-group">
                  <label className="info-label">Name</label>
                  <p className="info-value">{user?.name || "N/A"}</p>
                </div>

                <div className="info-group">
                  <label className="info-label">Email</label>
                  <p className="info-value">{user?.email || "N/A"}</p>
                </div>

                <div className="info-group">
                  <label className="info-label">Member Since</label>
                  <p className="info-value">{formatDate(user?.createdAt)}</p>
                </div>

                {user?.lastLogin && (
                  <div className="info-group">
                    <label className="info-label">Last Login</label>
                    <p className="info-value">{formatDate(user.lastLogin)}</p>
                  </div>
                )}

                <button className="btn btn-primary" onClick={handleEditToggle}>
                  <span className="btn-icon">✏️</span>
                  Edit Name
                </button>
              </>
            ) : (
              // Edit Mode
              <form onSubmit={handleUpdateProfile} noValidate>
                <div className="form-group">
                  <label htmlFor="name">
                    Display Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors({});
                      }
                      if (apiError) {
                        setApiError("");
                      }
                    }}
                    className={errors.name ? "input-error" : ""}
                    placeholder="Enter your name"
                    disabled={isSaving}
                    maxLength={100}
                  />
                  {errors.name && (
                    <span className="field-error">{errors.name}</span>
                  )}
                  <span className="char-count">{name.length}/100</span>
                </div>

                <div className="info-group">
                  <label className="info-label">Email</label>
                  <p className="info-value info-readonly">
                    {user?.email || "N/A"}
                    <span className="readonly-badge">Cannot be changed</span>
                  </p>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleEditToggle}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner">⏳</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">💾</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Quick Stats Card */}
        <QuickStatsCard />

        {/* Account Actions Card */}
        <div className="profile-card">
          <div className="card-header">
            <div className="card-header-title">
              <span className="card-icon">⚙️</span>
              <h2>Account Actions</h2>
            </div>
          </div>

          <div className="card-body">
            <div className="action-item">
              <div className="action-info">
                <h4>Logout</h4>
                <p>Sign out of your account on this device</p>
              </div>
              <button className="btn btn-danger" onClick={handleLogout}>
                <span className="btn-icon"></span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ProfilePage;
