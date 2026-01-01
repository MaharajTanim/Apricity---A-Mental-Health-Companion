import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-logo-container">
        <img src="/apricity-logo.svg" alt="Apricity" className="landing-logo" />
      </div>
      <div className="landing-content">
        <h2 className="landing-welcome">Welcome to Apricity</h2>
        <p className="landing-subtitle">Your Path to Mental Wellness</p>
        <p className="landing-description">
          An AI-powered mental health companion providing empathetic support
          through Cognitive Behavioral Therapy techniques. Track your emotions,
          journal your thoughts, and receive personalized insights.
        </p>

        <div className="landing-cta">
          <button
            className="btn-landing-primary"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </button>
          <button
            className="btn-landing-secondary"
            onClick={() => navigate("/auth")}
          >
            Learn More
          </button>
        </div>

        <div className="landing-features">
          <div className="feature-badge">
            <div className="feature-icon">🧠</div>
            <div className="feature-text">AI-Powered Analysis</div>
          </div>
          <div className="feature-badge">
            <div className="feature-icon">📊</div>
            <div className="feature-text">Emotion Tracking</div>
          </div>
          <div className="feature-badge">
            <div className="feature-icon">💭</div>
            <div className="feature-text">Daily Journaling</div>
          </div>
          <div className="feature-badge">
            <div className="feature-icon">🌱</div>
            <div className="feature-text">Personal Growth</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
