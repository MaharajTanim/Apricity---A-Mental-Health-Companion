import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import DiaryCard from "../components/DiaryCard";
import { SkeletonList } from "../components/SkeletonLoader";
import { ToastContainer, useToast } from "../components/Toast";
import "../styles/MyNotesPage.css";

const MyNotesPage = () => {
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const { toasts, removeToast, success, error } = useToast();

  const ITEMS_PER_PAGE = 10;

  // Fetch diaries on component mount and page change
  useEffect(() => {
    fetchDiaries();
  }, [currentPage]);

  // Fetch diaries from API
  const fetchDiaries = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await api.get(
        `/api/diary?page=${currentPage}&limit=${ITEMS_PER_PAGE}&sort=-date`
      );
      if (response.data.success) {
        setDiaries(response.data.data.diaries);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching diaries:", err);
      if (err.response) {
        setApiError(err.response.data.message || "Failed to load notes");
      } else {
        setApiError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit note - navigate to edit page
  const handleEditNote = (diary) => {
    navigate(`/diary/${diary.id}`);
  };

  // Handle delete note
  const handleDeleteNote = async (diaryId) => {
    try {
      const response = await api.delete(`/api/diary/${diaryId}`);
      if (response.data.success) {
        // Refresh the list
        fetchDiaries();
        success("Note deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting diary:", err);
      error(err.response?.data?.message || "Failed to delete note");
      throw err;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.pages || 1)) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>

        <div className="pagination-pages">
          {startPage > 1 && (
            <>
              <button
                className="pagination-page"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {startPage > 2 && (
                <span className="pagination-ellipsis">...</span>
              )}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              className={`pagination-page ${
                page === currentPage ? "active" : ""
              }`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          {endPage < pagination.pages && (
            <>
              {endPage < pagination.pages - 1 && (
                <span className="pagination-ellipsis">...</span>
              )}
              <button
                className="pagination-page"
                onClick={() => handlePageChange(pagination.pages)}
              >
                {pagination.pages}
              </button>
            </>
          )}
        </div>

        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.pages}
        >
          Next →
        </button>
      </div>
    );
  };

  // Loading state
  if (isLoading && diaries.length === 0) {
    return (
      <div className="page-container my-notes-page">
        <div className="my-notes-header">
          <h1 className="page-title">📝 My Notes</h1>
          <p className="page-subtitle">All your diary entries in one place</p>
        </div>
        <div className="notes-loading">
          <SkeletonList count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container my-notes-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="my-notes-header">
        <div className="header-content">
          <h1 className="page-title">📝 My Notes</h1>
          <p className="page-subtitle">All your diary entries in one place</p>
        </div>
        {pagination && (
          <div className="notes-count">
            <span className="count-badge">{pagination.total} notes</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{apiError}</span>
          <button className="retry-btn" onClick={fetchDiaries}>
            Retry
          </button>
        </div>
      )}

      {/* Notes List */}
      {diaries.length === 0 && !isLoading ? (
        <div className="empty-state">
          <div className="empty-icon">📓</div>
          <h3>No notes yet</h3>
          <p>Start documenting your thoughts and emotions</p>
          <button className="btn-primary" onClick={() => navigate("/home")}>
            Write Your First Note
          </button>
        </div>
      ) : (
        <>
          <div className="notes-grid">
            {diaries.map((diary) => (
              <DiaryCard
                key={diary.id}
                diary={diary}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                formatDate={formatDate}
              />
            ))}
          </div>

          {/* Pagination */}
          {renderPagination()}

          {/* Summary */}
          {pagination && (
            <div className="notes-summary">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of{" "}
              {pagination.total} notes
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyNotesPage;
