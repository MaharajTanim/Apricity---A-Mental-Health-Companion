import "../styles/SkeletonLoader.css";

/**
 * Skeleton Loader Component
 * Displays animated placeholder while content is loading
 */

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton-footer">
        <div className="skeleton skeleton-badge"></div>
        <div className="skeleton skeleton-badge"></div>
      </div>
    </div>
  );
};

export const SkeletonList = ({ count = 3 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="skeleton skeleton-table-heading"></div>
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="skeleton skeleton-table-cell"
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonText = ({ lines = 3 }) => {
  return (
    <div className="skeleton-text-block">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`skeleton skeleton-text ${
            index === lines - 1 ? "short" : ""
          }`}
        ></div>
      ))}
    </div>
  );
};

export const SkeletonProfile = () => {
  return (
    <div className="skeleton-profile">
      <div className="skeleton skeleton-avatar"></div>
      <div className="skeleton-profile-info">
        <div className="skeleton skeleton-name"></div>
        <div className="skeleton skeleton-text short"></div>
      </div>
    </div>
  );
};

const SkeletonLoader = ({ type = "card", ...props }) => {
  switch (type) {
    case "list":
      return <SkeletonList {...props} />;
    case "table":
      return <SkeletonTable {...props} />;
    case "text":
      return <SkeletonText {...props} />;
    case "profile":
      return <SkeletonProfile {...props} />;
    case "card":
    default:
      return <SkeletonCard {...props} />;
  }
};

export default SkeletonLoader;
