import { useState, useEffect } from "react";
import api from "../utils/api";
import "../styles/NoteModal.css";

const NoteModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    content: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        date: new Date().toISOString().split("T")[0],
        content: "",
      });
      setErrors({});
      setApiError("");
    }
  }, [isOpen]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    // Clear API error when user makes changes
    if (apiError) {
      setApiError("");
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 1) {
      newErrors.title = "Title must be at least 1 character";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (selectedDate > today) {
        newErrors.date = "Date cannot be in the future";
      }
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.trim().length < 1) {
      newErrors.content = "Content must be at least 1 character";
    } else if (formData.content.trim().length > 10000) {
      newErrors.content = "Content must be less than 10,000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // POST to /api/diary with Authorization header (automatically added by api.js)
      const response = await api.post("/api/diary", {
        title: formData.title.trim(),
        content: formData.content.trim(),
        date: new Date(formData.date).toISOString(),
      });

      // Success - close modal and notify parent
      if (response.data.success) {
        onSuccess(response.data.data.diary);
        onClose();
      } else {
        setApiError(response.data.message || "Failed to create diary entry");
      }
    } catch (error) {
      console.error("Error creating diary entry:", error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error
        if (
          error.response.data.errors &&
          Array.isArray(error.response.data.errors)
        ) {
          // Field-level validation errors from backend
          const backendErrors = {};
          error.response.data.errors.forEach((err) => {
            backendErrors[err.field] = err.message;
          });
          setErrors(backendErrors);
        } else {
          setApiError(
            error.response.data.message ||
              "Failed to create diary entry. Please try again."
          );
        }
      } else if (error.request) {
        // Request made but no response
        setApiError("Cannot connect to server. Please check your connection.");
      } else {
        // Other errors
        setApiError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Note</h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {apiError && (
          <div className="error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
              placeholder="Enter a title for your note"
              disabled={isLoading}
              maxLength={200}
              autoFocus
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
              disabled={isLoading}
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
              disabled={isLoading}
              rows={10}
              maxLength={10000}
            />
            {errors.content && (
              <span className="field-error">{errors.content}</span>
            )}
            <span className="char-count">{formData.content.length}/10,000</span>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner">⏳</span>
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
