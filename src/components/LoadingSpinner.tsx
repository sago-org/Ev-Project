import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

/**
 * Reusable loading spinner component
 */
export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const containerClass = fullScreen 
    ? 'loading-spinner-container fullscreen' 
    : 'loading-spinner-container';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${size}`} aria-label="Loading">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
