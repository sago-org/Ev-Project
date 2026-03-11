import { useState, useEffect } from 'react';
import type { ChargingSessionSummary, PaymentInfo, Station, ReceiptData, ReceiptDocument } from '../models';
import { ReceiptGeneratorService } from '../services/ReceiptGeneratorService';
import './Receipt.css';

interface ReceiptProps {
  transactionId: string;
  sessionSummary: ChargingSessionSummary;
  paymentInfo: PaymentInfo;
  stationDetails: Station;
  onComplete?: () => void;
}

/**
 * Receipt component with download and email options
 * 
 * Features:
 * - Displays receipt preview with all required information
 * - Add download button to trigger PDF download
 * - Add email button for email delivery
 * - Integrates ReceiptGeneratorService
 * - Handles download and email success/failure states
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */
export function Receipt({
  transactionId,
  sessionSummary,
  paymentInfo,
  stationDetails,
  onComplete,
}: ReceiptProps) {
  const [receiptDocument, setReceiptDocument] = useState<ReceiptDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const receiptService = new ReceiptGeneratorService();

  // Generate receipt on mount
  useEffect(() => {
    const generateReceipt = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        const receiptData: ReceiptData = {
          transactionId,
          sessionSummary,
          paymentInfo,
          stationDetails,
          timestamp: new Date(),
        };

        const document = await receiptService.generateReceipt(receiptData);
        setReceiptDocument(document);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate receipt');
      } finally {
        setIsGenerating(false);
      }
    };

    generateReceipt();
  }, [transactionId, sessionSummary, paymentInfo, stationDetails]);

  // Handle download
  const handleDownload = () => {
    if (!receiptDocument) return;

    try {
      receiptService.downloadReceipt(receiptDocument);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download receipt');
    }
  };

  // Handle email
  const handleEmail = async () => {
    if (!receiptDocument || !email) return;

    try {
      setIsEmailing(true);
      setEmailError(null);
      setEmailSuccess(false);

      await receiptService.emailReceipt(receiptDocument, email);
      setEmailSuccess(true);
      setEmail('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsEmailing(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  // Render loading state
  if (isGenerating) {
    return (
      <div className="receipt">
        <div className="receipt-loading">
          <div className="spinner" aria-label="Generating receipt"></div>
          <p>Generating your receipt...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !receiptDocument) {
    return (
      <div className="receipt">
        <div className="receipt-error">
          <div className="error-icon" aria-hidden="true">✕</div>
          <h2>Receipt Generation Failed</h2>
          <p>{error || 'Unable to generate receipt'}</p>
          {onComplete && (
            <button onClick={onComplete} className="complete-button">
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="receipt">
      <header className="receipt-header">
        <div className="success-icon" aria-hidden="true">✓</div>
        <h1>Receipt Generated</h1>
        <p className="receipt-subtitle">Your charging session is complete</p>
      </header>

      <section className="receipt-preview">
        <h2>Receipt Preview</h2>
        
        <div className="preview-section">
          <div className="preview-row">
            <span className="preview-label">Transaction ID:</span>
            <span className="preview-value">{transactionId}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Date:</span>
            <span className="preview-value">{new Date().toLocaleString()}</span>
          </div>
        </div>

        <div className="preview-section">
          <h3>Station Details</h3>
          <div className="preview-row">
            <span className="preview-label">Station:</span>
            <span className="preview-value">{stationDetails.name}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Address:</span>
            <span className="preview-value">{stationDetails.address}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Parking Slot:</span>
            <span className="preview-value">{sessionSummary.slotNumber}</span>
          </div>
        </div>

        <div className="preview-section">
          <h3>Session Details</h3>
          <div className="preview-row">
            <span className="preview-label">Start Time:</span>
            <span className="preview-value">{sessionSummary.startTime.toLocaleString()}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">End Time:</span>
            <span className="preview-value">{sessionSummary.endTime.toLocaleString()}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Duration:</span>
            <span className="preview-value">{formatDuration(sessionSummary.duration)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Energy Delivered:</span>
            <span className="preview-value">{sessionSummary.energyDelivered.toFixed(2)} kWh</span>
          </div>
        </div>

        <div className="preview-section">
          <h3>Cost Breakdown</h3>
          <div className="preview-row">
            <span className="preview-label">Price per kWh:</span>
            <span className="preview-value">{formatCurrency(sessionSummary.pricePerKwh)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Subtotal:</span>
            <span className="preview-value">{formatCurrency(sessionSummary.subtotal)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Taxes:</span>
            <span className="preview-value">{formatCurrency(sessionSummary.taxes)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Fees:</span>
            <span className="preview-value">{formatCurrency(sessionSummary.fees)}</span>
          </div>
          <div className="preview-row total">
            <span className="preview-label">Total Amount:</span>
            <span className="preview-value">{formatCurrency(sessionSummary.totalAmount)}</span>
          </div>
        </div>

        <div className="preview-section">
          <h3>Payment Information</h3>
          <div className="preview-row">
            <span className="preview-label">Payment Method:</span>
            <span className="preview-value">QR Code</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Merchant ID:</span>
            <span className="preview-value">{paymentInfo.merchantId}</span>
          </div>
        </div>
      </section>

      <section className="receipt-actions">
        <div className="download-section">
          <button
            className="download-button"
            onClick={handleDownload}
            aria-label="Download receipt as PDF"
          >
            📥 Download PDF
          </button>
        </div>

        <div className="email-section">
          <h3>Email Receipt</h3>
          <div className="email-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="email-input"
              aria-label="Email address"
              disabled={isEmailing}
            />
            <button
              className="email-button"
              onClick={handleEmail}
              disabled={!email || isEmailing}
              aria-label="Send receipt via email"
            >
              {isEmailing ? 'Sending...' : '📧 Send Email'}
            </button>
          </div>

          {emailSuccess && (
            <div className="email-success" role="status">
              ✓ Receipt sent successfully!
            </div>
          )}

          {emailError && (
            <div className="email-error" role="alert">
              {emailError}
            </div>
          )}
        </div>
      </section>

      {onComplete && (
        <footer className="receipt-footer">
          <button onClick={onComplete} className="complete-button">
            Complete
          </button>
        </footer>
      )}
    </div>
  );
}
