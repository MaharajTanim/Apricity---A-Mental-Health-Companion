import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";
import { ToastContainer, useToast } from "../components/Toast";
import "../styles/EditDiary.css";

const EditDiary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    content: "",
  });
  const [emotion, setEmotion] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch diary on mount
  useEffect(() => {
    fetchDiary();
  }, [id]);

  // Fetch diary data
  const fetchDiary = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await api.get(`/api/diary/${id}`);
      if (response.data.success) {
        const diary = response.data.data.diary;
        setFormData({
          title: diary.title || "",
          date: diary.date
            ? new Date(diary.date).toISOString().split("T")[0]
            : "",
          content: diary.content || "",
        });

        // Set emotion if available
        if (diary.emotionSummary) {
          setEmotion(diary.emotionSummary);
        }
      } else {
        setApiError(response.data.message || "Failed to load diary entry");
      }
    } catch (error) {
      console.error("Error fetching diary:", error);
      if (error.response) {
        if (error.response.status === 404) {
          setApiError("Diary entry not found");
        } else if (error.response.status === 403) {
          setApiError("You don't have permission to view this diary");
        } else {
          setApiError(
            error.response.data.message || "Failed to load diary entry"
          );
        }
      } else {
        setApiError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (apiError) {
      setApiError("");
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date = "Date cannot be in the future";
      }
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.trim().length > 10000) {
      newErrors.content = "Content must be less than 10,000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save (update)
  const handleSave = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.put(`/api/diary/${id}`, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        date: new Date(formData.date).toISOString(),
      });

      if (response.data.success) {
        // Show success toast and navigate
        success("Diary entry updated successfully! 📝");
        // Small delay to show toast before navigation
        setTimeout(() => {
          navigate("/home");
        }, 500);
      } else {
        setApiError(response.data.message || "Failed to update diary entry");
      }
    } catch (error) {
      console.error("Error updating diary:", error);
      if (error.response) {
        if (
          error.response.data.errors &&
          Array.isArray(error.response.data.errors)
        ) {
          const backendErrors = {};
          error.response.data.errors.forEach((err) => {
            backendErrors[err.field] = err.message;
          });
          setErrors(backendErrors);
        } else {
          setApiError(
            error.response.data.message ||
              "Failed to update diary entry. Please try again."
          );
        }
      } else {
        setApiError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    setApiError("");

    try {
      const response = await api.delete(`/api/diary/${id}`);
      if (response.data.success) {
        // Show success toast and navigate
        success("Diary entry deleted successfully");
        setShowDeleteConfirm(false);
        // Small delay to show toast before navigation
        setTimeout(() => {
          navigate("/home");
        }, 500);
      } else {
        error(response.data.message || "Failed to delete diary entry");
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error("Error deleting diary:", err);
      if (err.response) {
        error(
          err.response.data.message ||
            "Failed to delete diary entry. Please try again."
        );
      } else {
        error("Cannot connect to server. Please check your connection.");
      }
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
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
      <div className="page-container edit-diary-page">
        <div className="loading-state">
          <span className="spinner large">⏳</span>
          <p>Loading diary entry...</p>
        </div>
      </div>
    );
  }

  // Error state (diary not found or permission denied)
  if (apiError && !formData.title) {
    return (
      <div className="page-container edit-diary-page">
        <div className="error-state">
          <span className="error-icon large">⚠️</span>
          <h2>{apiError}</h2>
          <button className="btn btn-primary" onClick={() => navigate("/home")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container edit-diary-page">
      <div className="edit-diary-header">
        <div>
          <h1 className="page-title">Edit Diary Entry</h1>
          <p className="page-subtitle">
            Last updated: {formatDate(formData.date)}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/home")}
          disabled={isSaving || isDeleting}
        >
          ← Back to Home
        </button>
      </div>

      {/* Emotion Summary */}
      {emotion && (
        <div className="emotion-summary-card">
          <h3>
            <span className="icon">✨</span>
            Emotion Analysis
          </h3>
          <div className="emotion-details">
            <div className="top-emotion">
              <span className="label">Primary Emotion:</span>
              <span className="emotion-badge primary">
                {emotion.topEmotion}
                <span className="confidence">
                  {Math.round(emotion.confidence * 100)}%
                </span>
              </span>
            </div>
            {emotion.detectedEmotions &&
              emotion.detectedEmotions.length > 1 && (
                <div className="detected-emotions">
                  <span className="label">Detected Emotions:</span>
                  <div className="emotion-list">
                    {emotion.detectedEmotions.map((emo, index) => (
                      <span key={index} className="emotion-tag">
                        {emo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            {emotion.category && (
              <div className="emotion-category">
                <span className="label">Category:</span>
                <span className={`category-badge ${emotion.category}`}>
                  {emotion.category}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="edit-diary-form-container">
        {apiError && (
          <div className="error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? "input-error" : ""}
              placeholder="Enter a title for your diary"
              disabled={isSaving || isDeleting}
              maxLength={200}
            />
            {errors.title && (
              <span className="field-error">{errors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          <div className="form-group">
            <label htmlFor="date">
              Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? "input-error" : ""}
              disabled={isSaving || isDeleting}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="content">
              Content <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className={errors.content ? "input-error" : ""}
              placeholder="Write about your day, thoughts, or feelings..."
              disabled={isSaving || isDeleting}
              rows={15}
              maxLength={10000}
            />
            {errors.content && (
              <span className="field-error">{errors.content}</span>
            )}
            <span className="char-count">{formData.content.length}/10,000</span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
            >
              <span className="btn-icon">🗑️</span>
              Delete Entry
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || isDeleting}
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
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Diary Entry?"
        message={`Are you sure you want to delete "${formData.title}"? This action cannot be undone and will also delete all associated emotion analysis data.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default EditDiary;
