import { useState } from "react";
import "../styles/DiaryCard.css";

const DiaryCard = ({ diary, onEdit, onDelete, formatDate }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Truncate content to first 120 characters
  const truncateContent = (content) => {
    if (content.length <= 120) return content;
    return content.substring(0, 120) + "...";
  };

  // Handle edit button click
  const handleEdit = () => {
    onEdit(diary);
  };

  // Handle delete button click (show confirmation)
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(diary.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting diary:", error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="diary-card">
        <div className="diary-card-header">
          <div className="diary-card-info">
            <h4 className="diary-card-title">{diary.title}</h4>
            <span className="diary-card-date">{formatDate(diary.date)}</span>
          </div>
        </div>

        <p className="diary-card-content">{truncateContent(diary.content)}</p>

        {/* Emotion and AI Badges */}
        <div className="diary-card-badges">
          {diary.emotionSummary && (
            <div className="emotion-badge">
              <span className="emotion-label">
                {diary.emotionSummary.topEmotion}
              </span>
              <span className="emotion-confidence">
                {Math.round(diary.emotionSummary.confidence * 100)}%
              </span>
            </div>
          )}
          {diary.aiAnalyzed && (
            <span className="ai-badge" title="AI Analyzed">
              ✨ AI Analyzed
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="diary-card-actions">
          <button
            className="btn-action btn-edit"
            onClick={handleEdit}
            title="Edit note"
          >
            <span className="action-icon">✏️</span>
            Edit
          </button>
          <button
            className="btn-action btn-delete"
            onClick={handleDeleteClick}
            title="Delete note"
          >
            <span className="action-icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <span className="confirm-icon">⚠️</span>
              <h3>Delete Note?</h3>
            </div>
            <p className="confirm-message">
              Are you sure you want to delete "<strong>{diary.title}</strong>"?
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner">⏳</span>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiaryCard;
