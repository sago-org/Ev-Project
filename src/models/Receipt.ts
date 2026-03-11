import type { ChargingSessionSummary } from './ChargingSession';
import type { PaymentInfo } from './PaymentTransaction';
import type { Station } from './Station';

/**
 * Data required to generate a receipt
 */
export interface ReceiptData {
  transactionId: string;
  sessionSummary: ChargingSessionSummary;
  paymentInfo: PaymentInfo;
  stationDetails: Station;
  timestamp: Date;
}

/**
 * Generated receipt document
 */
export interface ReceiptDocument {
  documentId: string;
  pdfData: Blob;
  filename: string;
}
