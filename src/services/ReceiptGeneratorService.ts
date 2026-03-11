import { jsPDF } from 'jspdf';
import type { ReceiptData, ReceiptDocument } from '../models/Receipt';

/**
 * Service for generating, downloading, and emailing receipts
 */
export class ReceiptGeneratorService {
  /**
   * Generate a PDF receipt from receipt data
   * @param receiptData - Data to include in the receipt
   * @returns Promise resolving to the receipt document
   */
  async generateReceipt(receiptData: ReceiptData): Promise<ReceiptDocument> {
    const doc = new jsPDF();
    
    // Set up document styling
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.text('Charging Session Receipt', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Transaction ID
    doc.setFontSize(10);
    doc.text(`Transaction ID: ${receiptData.transactionId}`, margin, yPosition);
    yPosition += 10;
    
    // Timestamp
    const formattedDate = receiptData.timestamp.toLocaleString();
    doc.text(`Date: ${formattedDate}`, margin, yPosition);
    yPosition += 15;
    
    // Station Details Section
    doc.setFontSize(14);
    doc.text('Station Details', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.text(`Station Name: ${receiptData.stationDetails.name}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Address: ${receiptData.stationDetails.address}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Parking Slot: ${receiptData.sessionSummary.slotNumber}`, margin, yPosition);
    yPosition += 15;
    
    // Session Details Section
    doc.setFontSize(14);
    doc.text('Session Details', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    const startTime = receiptData.sessionSummary.startTime.toLocaleString();
    const endTime = receiptData.sessionSummary.endTime.toLocaleString();
    doc.text(`Start Time: ${startTime}`, margin, yPosition);
    yPosition += 6;
    doc.text(`End Time: ${endTime}`, margin, yPosition);
    yPosition += 6;
    
    const durationMinutes = Math.floor(receiptData.sessionSummary.duration / 60);
    const durationSeconds = receiptData.sessionSummary.duration % 60;
    doc.text(`Duration: ${durationMinutes}m ${durationSeconds}s`, margin, yPosition);
    yPosition += 6;
    doc.text(`Energy Delivered: ${receiptData.sessionSummary.energyDelivered.toFixed(2)} kWh`, margin, yPosition);
    yPosition += 15;
    
    // Cost Breakdown Section
    doc.setFontSize(14);
    doc.text('Cost Breakdown', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.text(`Price per kWh: ${receiptData.paymentInfo.currency} ${receiptData.sessionSummary.pricePerKwh.toFixed(2)}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Subtotal: ${receiptData.paymentInfo.currency} ${receiptData.sessionSummary.subtotal.toFixed(2)}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Taxes: ${receiptData.paymentInfo.currency} ${receiptData.sessionSummary.taxes.toFixed(2)}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Fees: ${receiptData.paymentInfo.currency} ${receiptData.sessionSummary.fees.toFixed(2)}`, margin, yPosition);
    yPosition += 10;
    
    // Total Amount (highlighted)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ${receiptData.paymentInfo.currency} ${receiptData.sessionSummary.totalAmount.toFixed(2)}`, margin, yPosition);
    yPosition += 15;
    
    // Payment Information
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: QR Code`, margin, yPosition);
    yPosition += 6;
    doc.text(`Merchant ID: ${receiptData.paymentInfo.merchantId || 'N/A'}`, margin, yPosition);
    
    // Generate PDF blob
    const pdfBlob = doc.output('blob');
    
    // Create filename with timestamp
    const dateStr = receiptData.timestamp.toISOString().split('T')[0];
    const filename = `receipt_${receiptData.transactionId}_${dateStr}.pdf`;
    
    return {
      documentId: receiptData.transactionId,
      pdfData: pdfBlob,
      filename
    };
  }
  
  /**
   * Download receipt to user's device
   * @param receiptDocument - The receipt document to download
   */
  downloadReceipt(receiptDocument: ReceiptDocument): void {
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(receiptDocument.pdfData);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = receiptDocument.filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Email receipt to user
   * @param receiptDocument - The receipt document to email
   * @param email - Email address to send to
   * @returns Promise resolving when email is sent
   */
  async emailReceipt(receiptDocument: ReceiptDocument, email: string): Promise<void> {
    // In a real implementation, this would call a backend API to send the email
    // For now, we'll simulate the email sending process
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would be something like:
    // const formData = new FormData();
    // formData.append('email', email);
    // formData.append('receipt', receiptDocument.pdfData, receiptDocument.filename);
    // await fetch('/api/send-receipt', { method: 'POST', body: formData });
    
    console.log(`Receipt ${receiptDocument.filename} would be emailed to ${email}`);
  }
}
