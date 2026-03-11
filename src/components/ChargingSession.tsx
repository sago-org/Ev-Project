import { useState, useEffect, useCallback } from 'react';
import { ChargingSessionManager } from '../services/ChargingSessionManager';
import type { ChargingSession as ChargingSessionType } from '../models/ChargingSession';
import './ChargingSession.css';

interface ChargingSessionProps {
  stationId: string;
  stationName: string;
  slotNumber: string;
  userId: string;
  onSessionComplete?: (sessionId: string) => void;
  onBack?: () => void;
}

/**
 * Charging session component with real-time status display
 * Shows charging status, elapsed time, and energy delivered
 * Handles session lifecycle (start, active, stopped)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 8.1
 */
export function ChargingSession({
  stationId,
  stationName,
  slotNumber,
  userId,
  onSessionComplete,
  onBack,
}: ChargingSessionProps) {
  const [sessionManager] = useState(() => new ChargingSessionManager());
  const [session, setSession] = useState<ChargingSessionType | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start charging session
  const handleStartCharging = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      const newSession = await sessionManager.startSession(
        stationId,
        slotNumber,
        userId
      );
      setSession(newSession);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start charging session';
      setError(errorMessage);
    } finally {
      setIsStarting(false);
    }
  }, [sessionManager, stationId, slotNumber, userId]);

  // Stop charging session
  const handleStopCharging = useCallback(async () => {
    if (!session) return;

    setIsStopping(true);
    setError(null);

    try {
      await sessionManager.stopSession(session.sessionId);
      onSessionComplete?.(session.sessionId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to stop charging session';
      setError(errorMessage);
      setIsStopping(false);
    }
  }, [session, sessionManager, onSessionComplete]);

  // Poll for session updates when active
  useEffect(() => {
    if (!session || session.status !== 'active') {
      return;
    }

    const updateInterval = setInterval(async () => {
      try {
        const updatedSession = await sessionManager.getSessionStatus(
          session.sessionId
        );
        setSession(updatedSession);
        
        // Stop polling if session is no longer active
        if (updatedSession.status !== 'active') {
          clearInterval(updateInterval);
        }
      } catch (err) {
        // Session might have been stopped, clear interval and continue
        console.error('Failed to update session status:', err);
        clearInterval(updateInterval);
      }
    }, 1000); // Update every second

    return () => {
      clearInterval(updateInterval);
    };
  }, [session, sessionManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionManager.cleanup();
    };
  }, [sessionManager]);

  // Render initial state (before session started)
  if (!session) {
    return (
      <div className="charging-session">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Go back">
            ← Back
          </button>
        )}

        <header className="session-header">
          <h1>Start Charging</h1>
        </header>

        <section className="session-info">
          <div className="info-card">
            <div className="info-item">
              <span className="icon" aria-hidden="true">
                🔌
              </span>
              <div>
                <span className="info-label">Station</span>
                <span className="info-value">{stationName}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="icon" aria-hidden="true">
                🅿️
              </span>
              <div>
                <span className="info-label">Parking Slot</span>
                <span className="info-value">{slotNumber}</span>
              </div>
            </div>
          </div>

          <div className="start-instructions">
            <p>
              Please ensure your vehicle is properly connected to the charging
              station before starting the session.
            </p>
          </div>
        </section>

        {error && (
          <div className="error-message" role="alert">
            <span className="icon" aria-hidden="true">
              ⚠️
            </span>
            <span>{error}</span>
          </div>
        )}

        <footer className="session-footer">
          <button
            className="start-button"
            onClick={handleStartCharging}
            disabled={isStarting}
            aria-label="Start charging session"
          >
            {isStarting ? 'Starting...' : 'Start Charging'}
          </button>
        </footer>
      </div>
    );
  }

  // Render active session
  return (
    <div className="charging-session">
      <header className="session-header">
        <h1>Charging in Progress</h1>
        <div
          className="status-indicator active"
          role="status"
          aria-live="polite"
        >
          <span className="status-dot" aria-hidden="true"></span>
          <span className="status-text">Active</span>
        </div>
      </header>

      <section className="session-info">
        <div className="info-card">
          <div className="info-item">
            <span className="icon" aria-hidden="true">
              🔌
            </span>
            <div>
              <span className="info-label">Station</span>
              <span className="info-value">{stationName}</span>
            </div>
          </div>

          <div className="info-item">
            <span className="icon" aria-hidden="true">
              🅿️
            </span>
            <div>
              <span className="info-label">Parking Slot</span>
              <span className="info-value">{slotNumber}</span>
            </div>
          </div>
        </div>

        <div className="charging-metrics">
          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">
              ⚡
            </div>
            <div className="metric-content">
              <span className="metric-label">Energy Delivered</span>
              <span className="metric-value" aria-live="polite">
                {session.energyDelivered.toFixed(3)} kWh
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">
              ⏱️
            </div>
            <div className="metric-content">
              <span className="metric-label">Elapsed Time</span>
              <span className="metric-value" aria-live="polite">
                {formatElapsedTime(session.elapsedTime)}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">
              📊
            </div>
            <div className="metric-content">
              <span className="metric-label">Status</span>
              <span className="metric-value status-active">
                {session.status === 'active' ? 'Charging' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        <div className="session-details">
          <div className="detail-item">
            <span className="detail-label">Session ID:</span>
            <span className="detail-value">{session.sessionId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Started:</span>
            <span className="detail-value">
              {session.startTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="error-message" role="alert">
          <span className="icon" aria-hidden="true">
            ⚠️
          </span>
          <span>{error}</span>
        </div>
      )}

      <footer className="session-footer">
        <button
          className="stop-button"
          onClick={handleStopCharging}
          disabled={isStopping || session.status !== 'active'}
          aria-label="Stop charging session"
        >
          {isStopping ? 'Stopping...' : 'Stop Charging'}
        </button>
      </footer>
    </div>
  );
}
