/**
 * Payment information for QR code generation
 */
export interface PaymentInfo {
  amount: number;
  currency: string;
  merchantId: string;
  transactionReference: string;
  sessionId: string;
}

/**
 * QR code data for payment
 */
export interface QRCode {
  imageData: string; // Base64 encoded image
  paymentUrl: string;
}

/**
 * Payment status information
 */
export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  errorMessage?: string;
}

/**
 * Complete payment transaction record
 */
export interface PaymentTransaction {
  transactionId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'qr_code' | 'card' | 'wallet';
  merchantId: string;
  timestamp: Date;
  qrCodeData?: string;
  receiptId?: string;
}
