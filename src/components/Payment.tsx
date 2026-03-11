import { useState, useEffect } from 'react';
import type { ChargingSessionSummary, PaymentInfo, QRCode, PaymentStatus } from '../models';
import { paymentGatewayService } from '../services/PaymentGatewayService';
import './Payment.css';

interface PaymentProps {
  summary: ChargingSessionSummary;
  onPaymentSuccess?: (transactionId: string) => void;
  onBack?: () => void;
}

type PaymentScreen = 'qr' | 'verifying' | 'success' | 'error';

/**
 * Payment component with QR code display
 * 
 * Features:
 * - Displays QR code prominently for payment
 * - Shows payment amount in large, readable text
 * - Displays amount on both QR and confirmation screens
 * - Integrates PaymentGatewayService
 * - Handles payment verification and status updates
 * - Shows confirmation message on success
 * - Shows error message and retry option on failure
 * 
 * Requirements: 10.1, 10.3, 10.4, 11.1, 11.3, 12.1, 12.2, 12.3
 */
export function Payment({ summary, onPaymentSuccess, onBack }: PaymentProps) {
  const [screen, setScreen] = useState<PaymentScreen>('qr');
  const [qrCode, setQrCode] = useState<QRCode | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionId] = useState<string>(() => `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

  // Format currency with 2 decimal places (Requirement 11.2)
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const paymentInfo: PaymentInfo = {
          amount: summary.totalAmount,
          currency: 'INR',
          merchantId: paymentGatewayService.getMerchantId(),
          transactionReference: transactionId,
          sessionId: summary.sessionId,
        };

        // Generate QR code (Requirement 10.1, 10.2)
        const qr = await paymentGatewayService.generatePaymentQR(paymentInfo);
        setQrCode(qr);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [summary, transactionId]);

  // Simulate payment verification (in production, this would be triggered by webhook)
  const handleVerifyPayment = async () => {
    try {
      setScreen('verifying');
      setError(null);

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate payment completion (in production, this would be done by payment gateway)
      paymentGatewayService.simulatePaymentCompletion(transactionId, true);

      // Verify payment status (Requirement 12.1)
      const status = await paymentGatewayService.verifyPayment(transactionId);
      setPaymentStatus(status);

      if (status.status === 'completed') {
        // Show success screen (Requirement 12.2)
        setScreen('success');
        onPaymentSuccess?.(transactionId);
      } else if (status.status === 'failed') {
        // Show error screen (Requirement 12.3)
        setScreen('error');
        setError(status.errorMessage || 'Payment failed');
      }
    } catch (err) {
      setScreen('error');
      setError(err instanceof Error ? err.message : 'Payment verification failed');
    }
  };

  // Handle payment retry (Requirement 12.3)
  const handleRetry = async () => {
    try {
      setError(null);
      setScreen('qr');

      // Retry the payment
      await paymentGatewayService.retryPayment(transactionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry payment');
    }
  };

  // Simulate payment failure for testing
  const handleSimulateFailure = async () => {
    try {
      setScreen('verifying');
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 2000));

      paymentGatewayService.simulatePaymentCompletion(transactionId, false);

      const status = await paymentGatewayService.verifyPayment(transactionId);
      setPaymentStatus(status);

      setScreen('error');
      setError(status.errorMessage || 'Payment failed');
    } catch (err) {
      setScreen('error');
      setError(err instanceof Error ? err.message : 'Payment verification failed');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="payment">
        <div className="payment-loading">
          <div className="spinner" aria-label="Loading payment"></div>
          <p>Generating payment QR code...</p>
        </div>
      </div>
    );
  }

  // Render QR code screen
  if (screen === 'qr' && qrCode) {
    return (
      <div className="payment">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Go back">
            ← Back
          </button>
        )}

        <header className="payment-header">
          <h1>Scan to Pay</h1>
          <p className="payment-subtitle">Use any UPI app to complete payment</p>
        </header>

        <section className="payment-content">
          {/* Payment amount display - large and readable (Requirement 11.1, 11.3) */}
          <div className="payment-amount-display">
            <span className="amount-label">Amount to Pay</span>
            <span className="amount-value" aria-label={`Amount: ${formatCurrency(summary.totalAmount)}`}>
              {formatCurrency(summary.totalAmount)}
            </span>
          </div>

          {/* QR code display - prominent (Requirement 10.3) */}
          <div className="qr-code-container">
            <img
              src={qrCode.imageData}
              alt="Payment QR Code"
              className="qr-code-image"
            />
            <p className="qr-code-hint">Scan with your UPI app</p>
          </div>

          {/* Payment details */}
          <div className="payment-details">
            <div className="detail-row">
              <span className="detail-label">Session ID:</span>
              <span className="detail-value">{summary.sessionId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Transaction ID:</span>
              <span className="detail-value">{transactionId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Station:</span>
              <span className="detail-value">{summary.stationName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Energy:</span>
              <span className="detail-value">{summary.energyDelivered.toFixed(3)} kWh</span>
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </section>

        <footer className="payment-footer">
          <button
            className="verify-button"
            onClick={handleVerifyPayment}
            aria-label="I have completed the payment"
          >
            I've Paid
          </button>
          <button
            className="simulate-failure-button"
            onClick={handleSimulateFailure}
            aria-label="Simulate payment failure (for testing)"
          >
            Simulate Failure (Test)
          </button>
        </footer>
      </div>
    );
  }

  // Render verifying screen
  if (screen === 'verifying') {
    return (
      <div className="payment">
        <div className="payment-verifying">
          <div className="spinner" aria-label="Verifying payment"></div>
          <h2>Verifying Payment</h2>
          <p>Please wait while we confirm your payment...</p>
          {/* Display amount on verification screen (Requirement 11.3) */}
          <div className="verifying-amount">
            <span className="amount-label">Amount:</span>
            <span className="amount-value">{formatCurrency(summary.totalAmount)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Render success screen (Requirement 12.2)
  if (screen === 'success' && paymentStatus) {
    return (
      <div className="payment">
        <div className="payment-success">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h2>Payment Successful!</h2>
          <p>Your payment has been confirmed</p>

          {/* Display amount on confirmation screen (Requirement 11.3) */}
          <div className="success-amount">
            <span className="amount-label">Amount Paid:</span>
            <span className="amount-value">{formatCurrency(summary.totalAmount)}</span>
          </div>

          <div className="success-details">
            <div className="detail-row">
              <span className="detail-label">Transaction ID:</span>
              <span className="detail-value">{paymentStatus.transactionId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Timestamp:</span>
              <span className="detail-value">{paymentStatus.timestamp.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Session ID:</span>
              <span className="detail-value">{summary.sessionId}</span>
            </div>
          </div>

          <p className="success-message">
            Your receipt will be available for download on the next screen.
          </p>
        </div>
      </div>
    );
  }

  // Render error screen (Requirement 12.3)
  if (screen === 'error') {
    return (
      <div className="payment">
        <div className="payment-error">
          <div className="error-icon" aria-hidden="true">✕</div>
          <h2>Payment Failed</h2>
          <p className="error-description">
            {error || 'We could not process your payment. Please try again.'}
          </p>

          {/* Display amount on error screen */}
          <div className="error-amount">
            <span className="amount-label">Amount:</span>
            <span className="amount-value">{formatCurrency(summary.totalAmount)}</span>
          </div>

          {paymentStatus && (
            <div className="error-details">
              <div className="detail-row">
                <span className="detail-label">Transaction ID:</span>
                <span className="detail-value">{paymentStatus.transactionId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{paymentStatus.status}</span>
              </div>
            </div>
          )}

          <footer className="error-footer">
            <button
              className="retry-button"
              onClick={handleRetry}
              aria-label="Retry payment"
            >
              Try Again
            </button>
            {onBack && (
              <button
                className="back-button-secondary"
                onClick={onBack}
                aria-label="Go back"
              >
                Go Back
              </button>
            )}
          </footer>
        </div>
      </div>
    );
  }

  return null;
}
