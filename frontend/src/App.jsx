import { Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import "./App.css";

// Page Components
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import HomeDashboard from "./pages/HomeDashboard";
import EditDiary from "./pages/EditDiary";
import ProfilePage from "./pages/ProfilePage";
import EmotionLogPage from "./pages/EmotionLogPage";
import NotFoundPage from "./pages/NotFoundPage";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <UserProvider>
      <div className="app">
        {/* Navigation */}
        <Navbar />

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diary/:id"
              element={
                <ProtectedRoute>
                  <EditDiary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emotion-log"
              element={
                <ProtectedRoute>
                  <EmotionLogPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 Apricity. Mental Health Support Platform.</p>
          <p className="disclaimer">Not a substitute for professional care.</p>
        </footer>
      </div>
    </UserProvider>
  );
}

export default App;
