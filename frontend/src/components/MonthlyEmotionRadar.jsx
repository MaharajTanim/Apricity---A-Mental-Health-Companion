import { useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import api from "../utils/api";
import "../styles/MonthlyEmotionRadar.css";

const MonthlyEmotionRadar = () => {
  const [radarData, setRadarData] = useState([]);
  const [monthInfo, setMonthInfo] = useState(null);
  const [dominantEmotion, setDominantEmotion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Emotion colors matching the weekly chart
  const emotionColors = {
    Joy: "#10b981",
    Surprise: "#8b5cf6",
    Anger: "#ef4444",
    Sadness: "#3b82f6",
    Fear: "#f59e0b",
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/api/emotion/monthly-radar?month=${selectedMonth}&year=${selectedYear}`
      );
      if (response.data.success) {
        const data = response.data.data;
        setRadarData(data.radarData);
        setMonthInfo({
          monthName: data.monthName,
          year: data.year,
          totalEmotions: data.totalEmotions,
          emotionCounts: data.emotionCounts,
        });
        setDominantEmotion(data.dominantEmotion);
      }
    } catch (err) {
      console.error("Error fetching monthly radar data:", err);
      setError("Failed to load monthly emotion data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle month change
  const handleMonthChange = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    // Don't allow future months
    const now = new Date();
    if (
      newYear > now.getFullYear() ||
      (newYear === now.getFullYear() && newMonth > now.getMonth())
    ) {
      return;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Check if next month is allowed
  const canGoNext = () => {
    const now = new Date();
    const nextMonth = selectedMonth + 1;
    const nextYear = nextMonth > 11 ? selectedYear + 1 : selectedYear;
    const normalizedMonth = nextMonth > 11 ? 0 : nextMonth;

    return !(
      nextYear > now.getFullYear() ||
      (nextYear === now.getFullYear() && normalizedMonth > now.getMonth())
    );
  };

  // Custom tooltip for radar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="radar-tooltip">
          <p
            className="tooltip-emotion"
            style={{ color: emotionColors[data.emotion] }}
          >
            {data.emotion}
          </p>
          <p className="tooltip-value">Count: {data.value}</p>
          <p className="tooltip-percentage">{data.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Get emoji for emotion
  const getEmotionEmoji = (emotion) => {
    const emojis = {
      Joy: "😊",
      Surprise: "😮",
      Anger: "😠",
      Sadness: "😢",
      Fear: "😨",
    };
    return emojis[emotion] || "🎭";
  };

  if (isLoading) {
    return (
      <div className="monthly-radar-container">
        <div className="radar-header">
          <h3>🎯 Monthly Emotion Distribution</h3>
        </div>
        <div className="radar-loading">
          <div className="loading-spinner"></div>
          <p>Loading monthly data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="monthly-radar-container">
        <div className="radar-header">
          <h3>🎯 Monthly Emotion Distribution</h3>
        </div>
        <div className="radar-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchMonthlyData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasData = monthInfo && monthInfo.totalEmotions > 0;

  return (
    <div className="monthly-radar-container">
      <div className="radar-header">
        <div className="header-title">
          <h3>🎯 Monthly Emotion Distribution</h3>
          <div className="month-selector">
            <button
              className="month-nav-btn"
              onClick={() => handleMonthChange(-1)}
              aria-label="Previous month"
            >
              ←
            </button>
            <span className="current-month">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <button
              className="month-nav-btn"
              onClick={() => handleMonthChange(1)}
              disabled={!canGoNext()}
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>
        {monthInfo && (
          <div className="radar-summary">
            <span className="summary-item">
              <span className="summary-value">{monthInfo.totalEmotions}</span>
              <span className="summary-label">entries</span>
            </span>
            {dominantEmotion && (
              <span className="summary-item dominant">
                <span className="summary-emoji">
                  {getEmotionEmoji(
                    dominantEmotion.emotion.charAt(0).toUpperCase() +
                      dominantEmotion.emotion.slice(1)
                  )}
                </span>
                <span className="summary-value">
                  {dominantEmotion.emotion.charAt(0).toUpperCase() +
                    dominantEmotion.emotion.slice(1)}
                </span>
                <span className="summary-label">
                  dominant ({dominantEmotion.percentage}%)
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="radar-empty">
          <div className="empty-icon">🎯</div>
          <p>
            No emotion data recorded for {monthNames[selectedMonth]}{" "}
            {selectedYear}
          </p>
          <span className="empty-hint">
            Journal entries will populate your monthly emotion overview
          </span>
        </div>
      ) : (
        <div className="radar-content">
          <div className="radar-chart-wrapper">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="emotion"
                  tick={{ fill: "#64748b", fontSize: 14, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, "auto"]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                />
                <Radar
                  name="Emotions"
                  dataKey="value"
                  stroke="#517c61"
                  fill="#add89c"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Emotion Legend with counts */}
          <div className="emotion-legend">
            {radarData.map((item, index) => (
              <div key={index} className="legend-item">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: emotionColors[item.emotion] }}
                ></span>
                <span className="legend-emotion">{item.emotion}</span>
                <span className="legend-count">{item.value}</span>
                <span className="legend-percentage">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyEmotionRadar;
