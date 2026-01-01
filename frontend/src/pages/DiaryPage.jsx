import { useParams } from "react-router-dom";

const DiaryPage = () => {
  const { id } = useParams();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Diary Entry</h1>
        <p className="page-subtitle">Entry ID: {id}</p>
      </div>

      <div className="card">
        <h2>Diary Entry #{id}</h2>
        <p>
          This page will display the specific diary entry and allow editing.
        </p>

        <div style={{ marginTop: "2rem" }}>
          <h3>Entry Content</h3>
          <div
            style={{
              backgroundColor: "var(--bg-color)",
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              marginTop: "1rem",
            }}
          >
            <p>Your journal entry content will appear here...</p>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <button className="btn btn-primary">Edit Entry</button>
          <button className="btn btn-secondary">Delete Entry</button>
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;
