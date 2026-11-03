import { FiAlertCircle, FiInbox, FiRefreshCw } from 'react-icons/fi';

export function Loading({ children = 'Loading…', skeleton = false }) {
  if (skeleton) {
    return (
      <div className="skeleton-grid" role="status" aria-label={children}>
        <span className="sr-only">{children}</span>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div className="skeleton-card" key={item}>
            <div className="skeleton-image" />
            <div className="skeleton-line wide" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="page-state" role="status">
      <span className="loading-spinner" aria-hidden="true">
        <FiRefreshCw />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="notice error error-state" role="alert">
      <FiAlertCircle aria-hidden="true" />
      <span>{message}</span>
      {onRetry && (
        <button className="small-action" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        <FiInbox />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
