import QRCodeLib from 'qrcode';
import type { PaymentInfo, QRCode, PaymentStatus } from '../models';

/**
 * PaymentGatewayService handles payment QR code generation and payment verification
 * 
 * Responsibilities:
 * - Generate QR codes with payment information
 * - Verify payment status
 * - Handle payment retries for failed transactions
 */
export class PaymentGatewayService {
  private merchantId: string;
  private paymentTransactions: Map<string, PaymentStatus>;

  constructor(merchantId: string = 'EV_CHARGING_MERCHANT_001') {
    this.merchantId = merchantId;
    this.paymentTransactions = new Map();
  }

  /**
   * Generate a QR code containing payment information
   * 
   * @param paymentInfo - Payment details including amount, currency, merchant ID, and transaction reference
   * @returns Promise resolving to QRCode with image data and payment URL
   * 
   * Requirements: 10.1, 10.2
   */
  async generatePaymentQR(paymentInfo: PaymentInfo): Promise<QRCode> {
    // Validate payment info
    if (!paymentInfo.amount || paymentInfo.amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    if (!paymentInfo.currency) {
      throw new Error('Currency is required');
    }
    if (!paymentInfo.transactionReference) {
      throw new Error('Transaction reference is required');
    }

    // Create payment URL with encoded data
    // Format: merchantId|amount|currency|transactionRef|sessionId
    const paymentData = {
      merchantId: paymentInfo.merchantId || this.merchantId,
      amount: paymentInfo.amount.toFixed(2),
      currency: paymentInfo.currency,
      transactionReference: paymentInfo.transactionReference,
      sessionId: paymentInfo.sessionId,
    };

    // Create payment URL (in real implementation, this would be a payment gateway URL)
    const paymentUrl = `upi://pay?pa=${paymentData.merchantId}@bank&pn=EV%20Charging&am=${paymentData.amount}&cu=${paymentData.currency}&tn=${paymentData.transactionReference}`;

    // Generate QR code as base64 image
    try {
      const imageData = await QRCodeLib.toDataURL(paymentUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
      });

      // Initialize payment status as pending
      this.paymentTransactions.set(paymentInfo.transactionReference, {
        transactionId: paymentInfo.transactionReference,
        status: 'pending',
        timestamp: new Date(),
      });

      return {
        imageData,
        paymentUrl,
      };
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify the status of a payment transaction
   * 
   * @param transactionId - Unique transaction identifier
   * @returns Promise resolving to PaymentStatus
   * 
   * Requirements: 12.1, 12.2, 12.3, 12.4
   */
  async verifyPayment(transactionId: string): Promise<PaymentStatus> {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // Check if transaction exists
    const existingStatus = this.paymentTransactions.get(transactionId);
    
    if (!existingStatus) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // In a real implementation, this would call a payment gateway API
    // For now, we simulate the verification
    // Return the current status
    return { ...existingStatus };
  }

  /**
   * Retry a failed payment transaction
   * 
   * @param transactionId - Unique transaction identifier of the failed payment
   * @returns Promise resolving to updated PaymentStatus
   * 
   * Requirements: 12.3
   */
  async retryPayment(transactionId: string): Promise<PaymentStatus> {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    const existingStatus = this.paymentTransactions.get(transactionId);

    if (!existingStatus) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (existingStatus.status !== 'failed') {
      throw new Error(`Cannot retry payment with status: ${existingStatus.status}`);
    }

    // Reset status to pending for retry
    const updatedStatus: PaymentStatus = {
      transactionId,
      status: 'pending',
      timestamp: new Date(),
    };

    this.paymentTransactions.set(transactionId, updatedStatus);

    return { ...updatedStatus };
  }

  /**
   * Simulate payment completion (for testing purposes)
   * In production, this would be triggered by payment gateway webhook
   */
  simulatePaymentCompletion(transactionId: string, success: boolean = true): void {
    const existingStatus = this.paymentTransactions.get(transactionId);
    
    if (existingStatus) {
      const updatedStatus: PaymentStatus = {
        transactionId,
        status: success ? 'completed' : 'failed',
        timestamp: new Date(),
      };
      
      if (!success) {
        updatedStatus.errorMessage = 'Payment declined by bank';
      }
      
      this.paymentTransactions.set(transactionId, updatedStatus);
    }
  }

  /**
   * Get merchant ID
   */
  getMerchantId(): string {
    return this.merchantId;
  }

  /**
   * Clear all payment transactions (for testing)
   */
  clearTransactions(): void {
    this.paymentTransactions.clear();
  }
}

// Export singleton instance
export const paymentGatewayService = new PaymentGatewayService();
