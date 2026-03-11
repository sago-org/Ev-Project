import type { ChargingSessionSummary } from '../models/ChargingSession';
import './ChargingSummary.css';

interface ChargingSummaryProps {
  summary: ChargingSessionSummary;
  onProceedToPayment?: () => void;
  onBack?: () => void;
}

/**
 * Charging summary component with cost breakdown
 * Displays energy delivered, duration, price per kWh
 * Shows cost breakdown (subtotal, taxes, fees, total)
 * Formats amounts with currency symbol and 2 decimals
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.2
 */
export function ChargingSummary({
  summary,
  onProceedToPayment,
  onBack,
}: ChargingSummaryProps) {
  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format currency with 2 decimal places
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="charging-summary">
      {onBack && (
        <button className="back-button" onClick={onBack} aria-label="Go back">
          ← Back
        </button>
      )}

      <header className="summary-header">
        <h1>Charging Complete</h1>
        <div className="completion-icon" aria-hidden="true">
          ✓
        </div>
      </header>

      <section className="summary-info">
        <div className="info-card">
          <div className="info-item">
            <span className="icon" aria-hidden="true">
              🔌
            </span>
            <div>
              <span className="info-label">Station</span>
              <span className="info-value">{summary.stationName}</span>
            </div>
          </div>

          <div className="info-item">
            <span className="icon" aria-hidden="true">
              🅿️
            </span>
            <div>
              <span className="info-label">Parking Slot</span>
              <span className="info-value">{summary.slotNumber}</span>
            </div>
          </div>
        </div>

        <div className="session-metrics">
          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">
              ⚡
            </div>
            <div className="metric-content">
              <span className="metric-label">Energy Delivered</span>
              <span className="metric-value">
                {summary.energyDelivered.toFixed(3)} kWh
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">
              ⏱️
            </div>
            <div className="metric-content">
              <span className="metric-label">Charging Duration</span>
              <span className="metric-value">
                {formatDuration(summary.duration)}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">
              💰
            </div>
            <div className="metric-content">
              <span className="metric-label">Price per kWh</span>
              <span className="metric-value">
                {formatCurrency(summary.pricePerKwh)}
              </span>
            </div>
          </div>
        </div>

        <div className="cost-breakdown">
          <h2>Cost Breakdown</h2>
          
          <div className="breakdown-items">
            <div className="breakdown-item">
              <span className="breakdown-label">
                Subtotal ({summary.energyDelivered.toFixed(3)} kWh × {formatCurrency(summary.pricePerKwh)})
              </span>
              <span className="breakdown-value">
                {formatCurrency(summary.subtotal)}
              </span>
            </div>

            <div className="breakdown-item">
              <span className="breakdown-label">Taxes</span>
              <span className="breakdown-value">
                {formatCurrency(summary.taxes)}
              </span>
            </div>

            <div className="breakdown-item">
              <span className="breakdown-label">Fees</span>
              <span className="breakdown-value">
                {formatCurrency(summary.fees)}
              </span>
            </div>

            <div className="breakdown-divider"></div>

            <div className="breakdown-item total">
              <span className="breakdown-label">Total Amount</span>
              <span className="breakdown-value total-amount">
                {formatCurrency(summary.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="session-details">
          <div className="detail-item">
            <span className="detail-label">Session ID:</span>
            <span className="detail-value">{summary.sessionId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Started:</span>
            <span className="detail-value">
              {summary.startTime.toLocaleString()}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Ended:</span>
            <span className="detail-value">
              {summary.endTime.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      <footer className="summary-footer">
        <button
          className="payment-button"
          onClick={onProceedToPayment}
          aria-label="Proceed to payment"
        >
          Proceed to Payment
        </button>
      </footer>
    </div>
  );
}
