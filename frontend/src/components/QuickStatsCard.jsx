import { useState, useEffect } from "react";
import api from "../utils/api";
import "../styles/QuickStatsCard.css";

const QuickStatsCard = () => {
  const [stats, setStats] = useState(null);
  const [emotionData, setEmotionData] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Emotion colors and emojis
  const emotionConfig = {
    joy: { color: "#10b981", emoji: "😊", label: "Joy" },
    sadness: { color: "#3b82f6", emoji: "😢", label: "Sadness" },
    anger: { color: "#ef4444", emoji: "😠", label: "Anger" },
    fear: { color: "#f59e0b", emoji: "😨", label: "Fear" },
    surprise: { color: "#8b5cf6", emoji: "😮", label: "Surprise" },
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/api/user/stats");
      if (response.data.success) {
        const data = response.data.data;
        setStats(data.stats);
        setEmotionData(data.emotionDistribution);
        setAchievements(data.achievements);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="quick-stats-card">
        <div className="card-header">
          <div className="card-header-title">
            <span className="card-icon">📊</span>
            <h2>Quick Stats</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="stats-loading">
            <div className="loading-spinner"></div>
            <p>Loading your stats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quick-stats-card">
        <div className="card-header">
          <div className="card-header-title">
            <span className="card-icon">📊</span>
            <h2>Quick Stats</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="stats-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={fetchStats} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-stats-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">📊</span>
          <h2>Quick Stats</h2>
        </div>
      </div>

      <div className="card-body">
        {/* Main Stats Grid */}
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-icon">📝</span>
            <div className="stat-info">
              <span className="stat-value">{stats?.totalEntries || 0}</span>
              <span className="stat-label">Journal Entries</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">📅</span>
            <div className="stat-info">
              <span className="stat-value">{stats?.daysActive || 0}</span>
              <span className="stat-label">Days Active</span>
            </div>
          </div>

          <div className="stat-item highlight">
            <span className="stat-icon">🔥</span>
            <div className="stat-info">
              <span className="stat-value">{stats?.currentStreak || 0}</span>
              <span className="stat-label">Current Streak</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <div className="stat-info">
              <span className="stat-value">{stats?.longestStreak || 0}</span>
              <span className="stat-label">Longest Streak</span>
            </div>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="weekly-comparison">
          <h4>📈 Weekly Activity</h4>
          <div className="comparison-bars">
            <div className="comparison-item">
              <span className="comparison-label">This Week</span>
              <div className="comparison-bar-container">
                <div
                  className="comparison-bar current"
                  style={{
                    width: `${Math.min(
                      ((stats?.thisWeekEntries || 0) / 7) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="comparison-value">
                {stats?.thisWeekEntries || 0}
              </span>
            </div>
            <div className="comparison-item">
              <span className="comparison-label">Last Week</span>
              <div className="comparison-bar-container">
                <div
                  className="comparison-bar previous"
                  style={{
                    width: `${Math.min(
                      ((stats?.lastWeekEntries || 0) / 7) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="comparison-value">
                {stats?.lastWeekEntries || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Emotion Distribution */}
        {emotionData && stats?.totalEmotions > 0 && (
          <div className="emotion-distribution">
            <h4>
              {emotionData.dominant && emotionConfig[emotionData.dominant] && (
                <span className="dominant-emoji">
                  {emotionConfig[emotionData.dominant].emoji}
                </span>
              )}
              Emotion Overview
            </h4>
            {emotionData.dominant && (
              <p className="dominant-text">
                <strong>Dominant:</strong>{" "}
                {emotionConfig[emotionData.dominant]?.label ||
                  emotionData.dominant}{" "}
                ({emotionData.dominantPercentage}%)
              </p>
            )}
            <div className="emotion-bars">
              {Object.entries(emotionData.percentages || {}).map(
                ([emotion, percentage]) => (
                  <div key={emotion} className="emotion-bar-item">
                    <div className="emotion-bar-header">
                      <span className="emotion-emoji">
                        {emotionConfig[emotion]?.emoji}
                      </span>
                      <span className="emotion-name">
                        {emotionConfig[emotion]?.label || emotion}
                      </span>
                      <span className="emotion-percent">{percentage}%</span>
                    </div>
                    <div className="emotion-bar-track">
                      <div
                        className="emotion-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: emotionConfig[emotion]?.color,
                        }}
                      ></div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements && (
          <div className="achievements-section">
            <h4>
              🏆 Achievements ({achievements.unlockedCount}/
              {achievements.totalCount})
            </h4>
            <div className="achievements-grid">
              {achievements.list.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`achievement-item ${
                    achievement.unlocked ? "unlocked" : "locked"
                  }`}
                  title={achievement.description}
                >
                  <span className="achievement-icon">{achievement.icon}</span>
                  <span className="achievement-title">{achievement.title}</span>
                  {!achievement.unlocked && (
                    <div className="achievement-progress">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (achievement.progress / achievement.target) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positivity Rate */}
        <div className="positivity-section">
          <div className="positivity-card">
            <span className="positivity-icon">✨</span>
            <div className="positivity-info">
              <span className="positivity-value">
                {stats?.positivityRate || 0}%
              </span>
              <span className="positivity-label">
                Positivity Rate (30 days)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;
