import { useState } from "react";
import Login from "../components/Login";
import Register from "../components/Register";
import "../styles/AuthPage.css";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login"); // "login" or "register"

  return (
    <div className="page-container auth-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="brand-icon">🌅</span>
          Welcome to Apricity
        </h1>
        <p className="page-subtitle">Your mental wellness companion</p>
      </div>

      <div className="auth-container">
        {/* Tab Navigation */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {/* Form Container */}
        <div className="auth-form-container">
          {activeTab === "login" ? <Login /> : <Register />}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
