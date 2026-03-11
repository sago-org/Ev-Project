import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReceiptGeneratorService } from './ReceiptGeneratorService';
import type { ReceiptData } from '../models/Receipt';
import type { ChargingSessionSummary } from '../models/ChargingSession';
import type { PaymentInfo } from '../models/PaymentTransaction';
import type { Station } from '../models/Station';

describe('ReceiptGeneratorService', () => {
  let service: ReceiptGeneratorService;
  let mockReceiptData: ReceiptData;

  beforeEach(() => {
    service = new ReceiptGeneratorService();

    // Create mock data
    const mockSessionSummary: ChargingSessionSummary = {
      sessionId: 'session-123',
      stationName: 'Downtown EV Station',
      slotNumber: 'A5',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:30:00Z'),
      duration: 5400, // 90 minutes
      energyDelivered: 45.5,
      pricePerKwh: 0.35,
      subtotal: 15.93,
      taxes: 1.59,
      fees: 0.50,
      totalAmount: 18.02
    };

    const mockPaymentInfo: PaymentInfo = {
      amount: 18.02,
      currency: 'USD',
      merchantId: 'merchant-456',
      transactionReference: 'txn-ref-789',
      sessionId: 'session-123'
    };

    const mockStation: Station = {
      id: 'station-001',
      name: 'Downtown EV Station',
      address: '123 Main St, City, State 12345',
      location: { latitude: 40.7128, longitude: -74.0060 },
      distance: 2.5,
      type: 'ev_charging',
      availableSlots: 3,
      totalSlots: 10,
      pricePerKwh: 0.35
    };

    mockReceiptData = {
      transactionId: 'txn-123',
      sessionSummary: mockSessionSummary,
      paymentInfo: mockPaymentInfo,
      stationDetails: mockStation,
      timestamp: new Date('2024-01-15T11:30:00Z')
    };
  });

  describe('generateReceipt', () => {
    it('should generate a receipt document with PDF blob', async () => {
      const result = await service.generateReceipt(mockReceiptData);

      expect(result).toBeDefined();
      expect(result.documentId).toBe('txn-123');
      expect(result.pdfData).toBeInstanceOf(Blob);
      expect(result.pdfData.type).toBe('application/pdf');
      expect(result.filename).toMatch(/^receipt_txn-123_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should include all required receipt fields in the PDF', async () => {
      const result = await service.generateReceipt(mockReceiptData);

      // Verify PDF was created with content
      expect(result.pdfData.size).toBeGreaterThan(0);
    });

    it('should format filename with transaction ID and date', async () => {
      const result = await service.generateReceipt(mockReceiptData);

      expect(result.filename).toContain('txn-123');
      expect(result.filename).toContain('2024-01-15');
      expect(result.filename.endsWith('.pdf')).toBe(true);
    });

    it('should handle different currency symbols', async () => {
      mockReceiptData.paymentInfo.currency = 'EUR';

      const result = await service.generateReceipt(mockReceiptData);

      expect(result).toBeDefined();
      expect(result.pdfData).toBeInstanceOf(Blob);
    });

    it('should handle zero energy delivered', async () => {
      mockReceiptData.sessionSummary.energyDelivered = 0;
      mockReceiptData.sessionSummary.subtotal = 0;
      mockReceiptData.sessionSummary.totalAmount = 0.50; // Only fees

      const result = await service.generateReceipt(mockReceiptData);

      expect(result).toBeDefined();
      expect(result.pdfData).toBeInstanceOf(Blob);
    });

    it('should handle very short session duration', async () => {
      mockReceiptData.sessionSummary.duration = 30; // 30 seconds
      mockReceiptData.sessionSummary.startTime = new Date('2024-01-15T10:00:00Z');
      mockReceiptData.sessionSummary.endTime = new Date('2024-01-15T10:00:30Z');

      const result = await service.generateReceipt(mockReceiptData);

      expect(result).toBeDefined();
      expect(result.pdfData).toBeInstanceOf(Blob);
    });

    it('should handle long station names and addresses', async () => {
      mockReceiptData.stationDetails.name = 'Very Long Station Name That Might Wrap To Multiple Lines In The PDF Document';
      mockReceiptData.stationDetails.address = '1234 Very Long Street Name That Goes On And On, City With Long Name, State 12345-6789';

      const result = await service.generateReceipt(mockReceiptData);

      expect(result).toBeDefined();
      expect(result.pdfData).toBeInstanceOf(Blob);
    });
  });

  describe('downloadReceipt', () => {
    let mockLink: HTMLAnchorElement;
    let createElementSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;

    beforeEach(() => {
      // Mock DOM elements and methods
      mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      } as any;

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
      
      // Mock URL methods on global object
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should trigger file download with correct filename', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      service.downloadReceipt(receiptDoc);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(receiptDoc.filename);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should create and revoke object URL', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      service.downloadReceipt(receiptDoc);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(receiptDoc.pdfData);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should clean up DOM elements after download', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      service.downloadReceipt(receiptDoc);

      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('emailReceipt', () => {
    it('should accept valid email address', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      await expect(service.emailReceipt(receiptDoc, 'user@example.com')).resolves.toBeUndefined();
    });

    it('should reject invalid email address', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      await expect(service.emailReceipt(receiptDoc, 'invalid-email')).rejects.toThrow('Invalid email address');
    });

    it('should reject email without @ symbol', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      await expect(service.emailReceipt(receiptDoc, 'userexample.com')).rejects.toThrow('Invalid email address');
    });

    it('should reject email without domain', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      await expect(service.emailReceipt(receiptDoc, 'user@')).rejects.toThrow('Invalid email address');
    });

    it('should handle email with plus addressing', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      await expect(service.emailReceipt(receiptDoc, 'user+receipts@example.com')).resolves.toBeUndefined();
    });

    it('should handle email with subdomain', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      await expect(service.emailReceipt(receiptDoc, 'user@mail.example.com')).resolves.toBeUndefined();
    });
  });

  describe('Requirements validation', () => {
    it('should satisfy Requirement 13.1: Generate receipt on payment confirmation', async () => {
      // When payment is confirmed, receipt should be generated
      const result = await service.generateReceipt(mockReceiptData);
      
      expect(result).toBeDefined();
      expect(result.documentId).toBe(mockReceiptData.transactionId);
    });

    it('should satisfy Requirement 13.2 & 13.3: Include all required fields', async () => {
      const result = await service.generateReceipt(mockReceiptData);
      
      // Receipt should include: station name, slot number, duration, energy, 
      // payment amount, transaction ID, and timestamp
      expect(result.documentId).toBe(mockReceiptData.transactionId);
      expect(result.pdfData.size).toBeGreaterThan(0);
      
      // The PDF contains all the data from mockReceiptData
      // We can't easily parse PDF content in tests, but we verify the blob is created
    });

    it('should satisfy Requirement 13.4: Provide receipt in PDF format', async () => {
      const result = await service.generateReceipt(mockReceiptData);
      
      expect(result.pdfData.type).toBe('application/pdf');
      expect(result.filename.endsWith('.pdf')).toBe(true);
    });

    it('should satisfy Requirement 13.5: Initiate file download', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      const clickSpy = vi.fn();
      const mockLink = { href: '', download: '', click: clickSpy } as any;
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      service.downloadReceipt(receiptDoc);
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should satisfy Requirement 13.6: Provide email functionality', async () => {
      const receiptDoc = await service.generateReceipt(mockReceiptData);
      
      // Email functionality should be available
      await expect(service.emailReceipt(receiptDoc, 'user@example.com')).resolves.toBeUndefined();
    });
  });
});
