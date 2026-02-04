import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import api from "../utils/api";
import { SkeletonText } from "../components/SkeletonLoader";
import WeeklyEmotionChart from "../components/WeeklyEmotionChart";
import MonthlyEmotionRadar from "../components/MonthlyEmotionRadar";
import "../styles/EmotionLogPage.css";

const EmotionLogPage = () => {
  const [range, setRange] = useState("weekly");
  const [emotionData, setEmotionData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [severity, setSeverity] = useState("none");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    fetchEmotionLog();
    fetchSuggestions();
  }, [range]);

  // Fetch emotion log data
  const fetchEmotionLog = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await api.get(`/api/emotion/log?range=${range}`);
      if (response.data.success) {
        const data = response.data.data;
        setEmotionData(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching emotion log:", error);
      if (error.response) {
        setApiError(
          error.response.data.message || "Failed to load emotion log",
        );
      } else {
        setApiError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch suggestions
  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await api.get("/api/emotion/suggest");
      if (response.data.success) {
        const data = response.data.data;
        setSuggestions(data.suggestions || []);
        setWarnings(data.warnings || []);
        setSeverity(data.severity || "none");
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle range toggle
  const handleRangeToggle = (newRange) => {
    if (newRange !== range) {
      setRange(newRange);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get color for emotion (5 core emotions)
  const getEmotionColor = (emotion) => {
    const colors = {
      joy: "#10b981",
      surprise: "#8b5cf6",
      anger: "#ef4444",
      sadness: "#3b82f6",
      fear: "#f59e0b",
    };
    return colors[emotion] || "#6b7280";
  };

  // Get color for category (legacy support)
  const getCategoryColor = (category) => {
    const colors = {
      positive: "#10b981",
      negative: "#ef4444",
      ambiguous: "#f59e0b",
      neutral: "#6b7280",
    };
    return colors[category] || "#6b7280";
  };

  // Get severity color
  const getSeverityColor = (sev) => {
    const colors = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#3b82f6",
      none: "#6b7280",
    };
    return colors[sev] || "#6b7280";
  };

  // Prepare chart data
  const prepareChartData = () => {
    return emotionData.map((entry) => ({
      date: formatDate(entry.date),
      positive: entry.categories.positive,
      negative: entry.categories.negative,
      neutral: entry.categories.neutral,
      ambiguous: entry.categories.ambiguous,
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page-container emotion-log-page">
        <div className="emotion-log-header">
          <div>
            <h1 className="page-title">Emotion Log</h1>
            <p className="page-subtitle">
              Track your emotional journey over time
            </p>
          </div>
          <div className="range-toggle">
            <button className="toggle-btn active">Weekly</button>
            <button className="toggle-btn">Monthly</button>
          </div>
        </div>
        <div style={{ padding: "2rem" }}>
          <SkeletonText lines={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container emotion-log-page">
      <div className="emotion-log-header">
        <div>
          <h1 className="page-title">Emotion Log</h1>
          <p className="page-subtitle">
            Track your emotional journey over time
          </p>
        </div>

        {/* Range Toggle */}
        <div className="range-toggle">
          <button
            className={`toggle-btn ${range === "weekly" ? "active" : ""}`}
            onClick={() => handleRangeToggle("weekly")}
          >
            Weekly
          </button>
          <button
            className={`toggle-btn ${range === "monthly" ? "active" : ""}`}
            onClick={() => handleRangeToggle("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* Weekly Emotion Chart - Current Week Overview (only when Weekly tab is active) */}
      {range === "weekly" && <WeeklyEmotionChart />}

      {/* Monthly Emotion Radar Chart (only when Monthly tab is active) */}
      {range === "monthly" && <MonthlyEmotionRadar />}

      {/* Warnings - High Priority */}
      {warnings.length > 0 && severity !== "none" && (
        <div className={`warnings-card severity-${severity}`}>
          <div className="warnings-header">
            <span className="warning-icon">⚠️</span>
            <h3>
              {severity === "high"
                ? "Important Notice"
                : "Emotional Health Alert"}
            </h3>
          </div>
          <div className="warnings-list">
            {warnings.map((warning, index) => (
              <div key={index} className="warning-item">
                <p className="warning-message">{warning.message}</p>
                {warning.details && (
                  <p className="warning-details">{warning.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-card">
          <div className="suggestions-header">
            <span className="suggestion-icon">💡</span>
            <h3>Suggestions & Resources</h3>
          </div>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item priority-${suggestion.priority}`}
              >
                <h4 className="suggestion-title">{suggestion.message}</h4>
                {suggestion.priority === "high" && suggestion.resources && (
                  <div className="suggestion-resources">
                    <p className="resources-label">
                      <strong>Immediate Support:</strong>
                    </p>
                    <ul>
                      {suggestion.resources.map((resource, idx) => (
                        <li key={idx}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestion.activities && (
                  <div className="suggestion-activities">
                    <p className="activities-label">
                      <strong>Try these activities:</strong>
                    </p>
                    <ul>
                      {suggestion.activities.map((activity, idx) => (
                        <li key={idx}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestion.encouragement && (
                  <p className="suggestion-encouragement">
                    {suggestion.encouragement}
                  </p>
                )}
                {suggestion.suggestion && (
                  <p className="suggestion-text">{suggestion.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-icon">📊</span>
            <div className="summary-info">
              <span className="summary-value">{summary.totalEmotions}</span>
              <span className="summary-label">Total Entries</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">😊</span>
            <div className="summary-info">
              <span className="summary-value">
                {summary.categories.positive}
              </span>
              <span className="summary-label">Positive</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">😔</span>
            <div className="summary-info">
              <span className="summary-value">
                {summary.categories.negative}
              </span>
              <span className="summary-label">Negative</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">🎯</span>
            <div className="summary-info">
              <span className="summary-value">
                {summary.mostFrequentEmotion
                  ? summary.mostFrequentEmotion.emotion
                  : "N/A"}
              </span>
              <span className="summary-label">Top Emotion</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {emotionData.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <span className="icon">📈</span>
              Emotion Distribution Over Time
            </h3>
            <p className="chart-subtitle">
              Showing {range === "weekly" ? "past 7 days" : "past 30 days"}
            </p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={prepareChartData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  style={{ fontSize: "0.875rem" }}
                />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: "0.875rem" }}
                  label={{
                    value: "Count",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: "0.875rem", fill: "#64748b" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "0.875rem" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="positive"
                  name="Positive"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="negative"
                  name="Negative"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="neutral"
                  name="Neutral"
                  fill="#6b7280"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="ambiguous"
                  name="Ambiguous"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Data Table */}
      {emotionData.length > 0 && (
        <div className="data-table-card">
          <div className="table-header">
            <h3>
              <span className="icon">📋</span>
              Detailed Breakdown
            </h3>
          </div>
          <div className="table-container">
            <table className="emotion-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dominant Emotion</th>
                  <th>Positive</th>
                  <th>Negative</th>
                  <th>Neutral</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {emotionData.map((entry, index) => (
                  <tr key={index}>
                    <td>{formatDate(entry.date)}</td>
                    <td>
                      {entry.dominantEmotion ? (
                        <span className="emotion-badge">
                          {entry.dominantEmotion.emotion}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      <span
                        className="category-count"
                        style={{ color: getCategoryColor("positive") }}
                      >
                        {entry.categories.positive}
                      </span>
                    </td>
                    <td>
                      <span
                        className="category-count"
                        style={{ color: getCategoryColor("negative") }}
                      >
                        {entry.categories.negative}
                      </span>
                    </td>
                    <td>
                      <span
                        className="category-count"
                        style={{ color: getCategoryColor("neutral") }}
                      >
                        {entry.categories.neutral}
                      </span>
                    </td>
                    <td>
                      {entry.averageConfidence
                        ? `${Math.round(entry.averageConfidence * 100)}%`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionLogPage;
