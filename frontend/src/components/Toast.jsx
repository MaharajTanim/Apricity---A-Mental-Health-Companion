import { useState, useEffect } from "react";
import "../styles/Toast.css";

/**
 * Toast Component
 * Displays temporary notification messages
 * Auto-dismisses after specified duration
 */
const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <div
      className={`toast toast-${type} ${
        isVisible ? "toast-visible" : "toast-hidden"
      }`}
    >
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

/**
 * ToastContainer Component
 * Manages multiple toast notifications
 */
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * Custom hook to manage toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message, duration) =>
    showToast(message, "success", duration);
  const error = (message, duration) => showToast(message, "error", duration);
  const warning = (message, duration) =>
    showToast(message, "warning", duration);
  const info = (message, duration) => showToast(message, "info", duration);

  return {
    toasts,
    removeToast,
    showToast,
    success,
    error,
    warning,
    info,
  };
};

export default Toast;
