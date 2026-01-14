import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../utils/auth";
import "../styles/Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = isAuthenticated();

  // Check if current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Don't show navbar on auth page and landing page
  if (location.pathname === "/auth" || location.pathname === "/") {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand/Logo */}
        <Link to={isAuth ? "/home" : "/"} className="nav-brand">
          <img src="/apricity-logo.svg" alt="Apricity" className="brand-logo" />
        </Link>

        {/* Navigation Links */}
        {isAuth ? (
          <ul className="nav-links">
            <li>
              <Link
                to="/home"
                className={`nav-link ${isActive("/home") ? "active" : ""}`}
              >
                <span className="link-icon">🏠</span>
                <span className="link-text">Home</span>
              </Link>
            </li>
            <li>
              <Link
                to="/my-notes"
                className={`nav-link ${isActive("/my-notes") ? "active" : ""}`}
              >
                <span className="link-icon">📝</span>
                <span className="link-text">My Notes</span>
              </Link>
            </li>
            <li>
              <Link
                to="/emotion-log"
                className={`nav-link ${
                  isActive("/emotion-log") ? "active" : ""
                }`}
              >
                <span className="link-icon">📊</span>
                <span className="link-text">Emotion Log</span>
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className={`nav-link ${isActive("/profile") ? "active" : ""}`}
              >
                <span className="link-icon">👤</span>
                <span className="link-text">Profile</span>
              </Link>
            </li>
            <li>
              <button className="nav-link logout-btn" onClick={handleLogout}>
                <span className="link-icon">🚪</span>
                <span className="link-text">Logout</span>
              </button>
            </li>
          </ul>
        ) : (
          <ul className="nav-links">
            <li>
              <Link to="/auth" className="nav-link login-btn">
                Login
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
