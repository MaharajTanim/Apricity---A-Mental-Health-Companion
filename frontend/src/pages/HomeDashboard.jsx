import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import NoteModal from "../components/NoteModal";
import DiaryCard from "../components/DiaryCard";
import { SkeletonList } from "../components/SkeletonLoader";
import { ToastContainer, useToast } from "../components/Toast";
import api from "../utils/api";
import "../styles/HomeDashboard.css";

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [diaries, setDiaries] = useState([]);
  const [isLoadingDiaries, setIsLoadingDiaries] = useState(true);
  const user = getUser();
  const { toasts, removeToast, success, error } = useToast();

  // Fetch diaries on component mount
  useEffect(() => {
    fetchDiaries();
  }, []);

  // Fetch diaries from API
  const fetchDiaries = async () => {
    setIsLoadingDiaries(true);
    try {
      const response = await api.get("/api/diary?limit=5&sort=-date");
      if (response.data.success) {
        setDiaries(response.data.data.diaries);
      }
    } catch (error) {
      console.error("Error fetching diaries:", error);
    } finally {
      setIsLoadingDiaries(false);
    }
  };

  // Handle modal open
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle successful note creation
  const handleNoteCreated = (newDiary) => {
    console.log("New diary created:", newDiary);
    // Close modal
    setIsModalOpen(false);
    // Refresh the diary list
    fetchDiaries();
    // Show success toast
    success("Note saved successfully! 📝");
  };

  // Handle edit note
  const handleEditNote = (diary) => {
    // Navigate to the edit diary page
    navigate(`/diary/${diary.id}`);
  };

  // Handle delete note
  const handleDeleteNote = async (diaryId) => {
    try {
      const response = await api.delete(`/api/diary/${diaryId}`);
      if (response.data.success) {
        console.log("Diary deleted:", diaryId);
        // Refresh the diary list
        fetchDiaries();
        // Show success toast
        success("Note deleted successfully");
      } else {
        console.error("Failed to delete diary:", response.data.message);
        error("Failed to delete note. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting diary:", err);
      if (err.response) {
        error(
          err.response.data.message ||
            "Failed to delete note. Please try again."
        );
      } else {
        error("Cannot connect to server. Please check your connection.");
      }
      throw err; // Re-throw to let DiaryCard handle loading state
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="page-container home-dashboard">
      {/* Header with Motivational Text and Create Button */}
      <div className="dashboard-header">
        <div className="motivation-section">
          <h2 className="motivation-text">
            "Every day is a new beginning. Take a deep breath and start again."
            🌱
          </h2>
        </div>
        <button
          className="btn btn-primary btn-create"
          onClick={handleOpenModal}
        >
          <span className="btn-icon">✏️</span>
          Create Note
        </button>
      </div>

      {/* Welcome Message */}
      {user && (
        <div className="welcome-card">
          <h2>Welcome back, {user.name}!</h2>
          <p>How are you feeling today? Take a moment to reflect and write.</p>
        </div>
      )}

      {/* Recent Notes Section */}
      <div className="recent-notes-section">
        <div className="section-header">
          <h3>Recent Notes</h3>
          {diaries.length > 0 && (
            <button className="btn-text" onClick={fetchDiaries}>
              🔄 Refresh
            </button>
          )}
        </div>

        {isLoadingDiaries ? (
          <SkeletonList count={5} />
        ) : diaries.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h4>No notes yet</h4>
            <p>Start your wellness journey by creating your first note.</p>
            <button className="btn btn-primary" onClick={handleOpenModal}>
              Create Your First Note
            </button>
          </div>
        ) : (
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
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="action-card">
          <span className="action-icon">💬</span>
          <h4>Chat Support</h4>
          <p>Talk to your AI companion</p>
        </div>
        <div className="action-card">
          <span className="action-icon">📊</span>
          <h4>Emotion Insights</h4>
          <p>View your emotional patterns</p>
        </div>
        <div className="action-card">
          <span className="action-icon">🎯</span>
          <h4>Set Goals</h4>
          <p>Track your progress</p>
        </div>
      </div>

      {/* Create Note Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleNoteCreated}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default HomeDashboard;
