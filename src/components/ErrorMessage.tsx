import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

/**
 * Reusable error message component
 */
export function ErrorMessage({ 
  message, 
  title = 'Error',
  onRetry,
  onDismiss,
  type = 'error'
}: ErrorMessageProps) {
  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`error-message-container ${type}`} role="alert">
      <div className="error-message-content">
        <div className="error-message-icon" aria-hidden="true">
          {icons[type]}
        </div>
        <div className="error-message-text">
          <h3 className="error-message-title">{title}</h3>
          <p className="error-message-description">{message}</p>
        </div>
      </div>
      
      {(onRetry || onDismiss) && (
        <div className="error-message-actions">
          {onRetry && (
            <button 
              onClick={onRetry}
              className="error-action-button retry"
              aria-label="Retry operation"
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="error-action-button dismiss"
              aria-label="Dismiss error message"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
