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
} from "recharts";
import api from "../utils/api";
import "../styles/WeeklyEmotionChart.css";

const WeeklyEmotionChart = () => {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/api/emotion/weekly-chart");
      if (response.data.success) {
        const data = response.data.data;
        setChartData(data.dailyData);
        setSummary(data.summary);
        setWeekRange({
          start: data.weekStart,
          end: data.weekEnd,
        });
      }
    } catch (err) {
      console.error("Error fetching weekly chart data:", err);
      setError("Failed to load weekly emotion data");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDateRange = () => {
    if (!weekRange.start || !weekRange.end) return "";
    const start = new Date(weekRange.start);
    const end = new Date(weekRange.end);
    const options = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString(
      "en-US",
      options
    )} - ${end.toLocaleDateString("en-US", options)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="tooltip-item"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
          <p className="tooltip-total">Total: {total}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="weekly-chart-container">
        <div className="chart-header">
          <h3>📅 Previous 7 Days Emotions</h3>
        </div>
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weekly-chart-container">
        <div className="chart-header">
          <h3>📅 Previous 7 Days Emotions</h3>
        </div>
        <div className="chart-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchWeeklyData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasData = chartData.some((day) => day.totalEntries > 0);

  return (
    <div className="weekly-chart-container">
      <div className="chart-header">
        <div className="header-title">
          <h3>📅 Previous 7 Days Emotions</h3>
          <span className="date-range">{formatDateRange()}</span>
        </div>
        {summary && (
          <div className="chart-summary">
            <span className="summary-item">
              <span className="summary-value">{summary.totalEmotions}</span>
              <span className="summary-label">entries</span>
            </span>
            <span className="summary-item">
              <span className="summary-value">{summary.daysWithEntries}</span>
              <span className="summary-label">active days</span>
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="chart-empty">
          <div className="empty-icon">📊</div>
          <p>No emotion data recorded in the last 7 days</p>
          <span className="empty-hint">
            Start writing diary entries to see your emotional patterns
          </span>
        </div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#d1d5db" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="circle" />
              <Bar
                dataKey="positive"
                name="Positive"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                stackId="emotions"
              />
              <Bar
                dataKey="negative"
                name="Negative"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                stackId="emotions"
              />
              <Bar
                dataKey="neutral"
                name="Neutral"
                fill="#6b7280"
                radius={[4, 4, 0, 0]}
                stackId="emotions"
              />
              <Bar
                dataKey="ambiguous"
                name="Ambiguous"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                stackId="emotions"
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Daily breakdown */}
          <div className="daily-breakdown">
            {chartData.map((day) => (
              <div
                key={day.day}
                className={`day-card ${
                  day.totalEntries === 0 ? "no-data" : ""
                }`}
              >
                <span className="day-name">{day.day}</span>
                {day.totalEntries > 0 ? (
                  <>
                    <span className="day-entries">{day.totalEntries}</span>
                    {day.dominantEmotion && (
                      <span className="day-emotion">
                        {day.dominantEmotion.emotion}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="day-empty">-</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyEmotionChart;
