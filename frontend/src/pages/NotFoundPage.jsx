import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">404 - Page Not Found</h1>
        <p className="page-subtitle">
          The page you're looking for doesn't exist.
        </p>
      </div>

      <div
        className="card"
        style={{ textAlign: "center", maxWidth: "500px", margin: "0 auto" }}
      >
        <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🔍</div>
        <h2>Oops! Lost your way?</h2>
        <p style={{ color: "var(--text-muted)", margin: "1rem 0" }}>
          Don't worry, we're here to help you find your path back.
        </p>
        <Link to="/">
          <button className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
