import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentGatewayService } from './PaymentGatewayService';
import type { PaymentInfo } from '../models';

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;

  beforeEach(() => {
    service = new PaymentGatewayService('TEST_MERCHANT_123');
  });

  describe('generatePaymentQR', () => {
    it('should generate QR code with valid payment info', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 150.50,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT_123',
        transactionReference: 'TXN_001',
        sessionId: 'SESSION_001',
      };

      const qrCode = await service.generatePaymentQR(paymentInfo);

      expect(qrCode).toBeDefined();
      expect(qrCode.imageData).toMatch(/^data:image\/png;base64,/);
      expect(qrCode.paymentUrl).toContain('TEST_MERCHANT_123');
      expect(qrCode.paymentUrl).toContain('150.50');
      expect(qrCode.paymentUrl).toContain('USD');
      expect(qrCode.paymentUrl).toContain('TXN_001');
    });

    it('should encode amount, merchant ID, and transaction reference in QR code', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 99.99,
        currency: 'EUR',
        merchantId: 'MERCHANT_XYZ',
        transactionReference: 'TXN_ABC_123',
        sessionId: 'SESSION_XYZ',
      };

      const qrCode = await service.generatePaymentQR(paymentInfo);

      // Verify all required data is in the payment URL
      expect(qrCode.paymentUrl).toContain('MERCHANT_XYZ');
      expect(qrCode.paymentUrl).toContain('99.99');
      expect(qrCode.paymentUrl).toContain('EUR');
      expect(qrCode.paymentUrl).toContain('TXN_ABC_123');
    });

    it('should throw error for invalid amount (zero)', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 0,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_002',
        sessionId: 'SESSION_002',
      };

      await expect(service.generatePaymentQR(paymentInfo)).rejects.toThrow('Invalid payment amount');
    });

    it('should throw error for negative amount', async () => {
      const paymentInfo: PaymentInfo = {
        amount: -50,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_003',
        sessionId: 'SESSION_003',
      };

      await expect(service.generatePaymentQR(paymentInfo)).rejects.toThrow('Invalid payment amount');
    });

    it('should throw error for missing currency', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100,
        currency: '',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_004',
        sessionId: 'SESSION_004',
      };

      await expect(service.generatePaymentQR(paymentInfo)).rejects.toThrow('Currency is required');
    });

    it('should throw error for missing transaction reference', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: '',
        sessionId: 'SESSION_005',
      };

      await expect(service.generatePaymentQR(paymentInfo)).rejects.toThrow('Transaction reference is required');
    });

    it('should use default merchant ID if not provided', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 75.25,
        currency: 'USD',
        merchantId: '',
        transactionReference: 'TXN_006',
        sessionId: 'SESSION_006',
      };

      const qrCode = await service.generatePaymentQR(paymentInfo);

      expect(qrCode.paymentUrl).toContain('TEST_MERCHANT_123');
    });

    it('should format amount with two decimal places', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100.5,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_007',
        sessionId: 'SESSION_007',
      };

      const qrCode = await service.generatePaymentQR(paymentInfo);

      expect(qrCode.paymentUrl).toContain('100.50');
    });

    it('should initialize payment status as pending', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 50,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_008',
        sessionId: 'SESSION_008',
      };

      await service.generatePaymentQR(paymentInfo);

      const status = await service.verifyPayment('TXN_008');
      expect(status.status).toBe('pending');
      expect(status.transactionId).toBe('TXN_008');
    });
  });

  describe('verifyPayment', () => {
    it('should return payment status for existing transaction', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_VERIFY_001',
        sessionId: 'SESSION_VERIFY_001',
      };

      await service.generatePaymentQR(paymentInfo);

      const status = await service.verifyPayment('TXN_VERIFY_001');

      expect(status).toBeDefined();
      expect(status.transactionId).toBe('TXN_VERIFY_001');
      expect(status.status).toBe('pending');
      expect(status.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent transaction', async () => {
      await expect(service.verifyPayment('NON_EXISTENT_TXN')).rejects.toThrow('Transaction NON_EXISTENT_TXN not found');
    });

    it('should throw error for empty transaction ID', async () => {
      await expect(service.verifyPayment('')).rejects.toThrow('Transaction ID is required');
    });

    it('should return completed status after payment completion', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 200,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_COMPLETE_001',
        sessionId: 'SESSION_COMPLETE_001',
      };

      await service.generatePaymentQR(paymentInfo);
      service.simulatePaymentCompletion('TXN_COMPLETE_001', true);

      const status = await service.verifyPayment('TXN_COMPLETE_001');

      expect(status.status).toBe('completed');
      expect(status.errorMessage).toBeUndefined();
    });

    it('should return failed status with error message', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 150,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_FAIL_001',
        sessionId: 'SESSION_FAIL_001',
      };

      await service.generatePaymentQR(paymentInfo);
      service.simulatePaymentCompletion('TXN_FAIL_001', false);

      const status = await service.verifyPayment('TXN_FAIL_001');

      expect(status.status).toBe('failed');
      expect(status.errorMessage).toBeDefined();
      expect(status.errorMessage).toContain('Payment declined');
    });
  });

  describe('retryPayment', () => {
    it('should retry failed payment and reset status to pending', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_RETRY_001',
        sessionId: 'SESSION_RETRY_001',
      };

      await service.generatePaymentQR(paymentInfo);
      service.simulatePaymentCompletion('TXN_RETRY_001', false);

      const retryStatus = await service.retryPayment('TXN_RETRY_001');

      expect(retryStatus.status).toBe('pending');
      expect(retryStatus.transactionId).toBe('TXN_RETRY_001');
      expect(retryStatus.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when retrying non-existent transaction', async () => {
      await expect(service.retryPayment('NON_EXISTENT_TXN')).rejects.toThrow('Transaction NON_EXISTENT_TXN not found');
    });

    it('should throw error when retrying pending payment', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_RETRY_PENDING',
        sessionId: 'SESSION_RETRY_PENDING',
      };

      await service.generatePaymentQR(paymentInfo);

      await expect(service.retryPayment('TXN_RETRY_PENDING')).rejects.toThrow('Cannot retry payment with status: pending');
    });

    it('should throw error when retrying completed payment', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_RETRY_COMPLETED',
        sessionId: 'SESSION_RETRY_COMPLETED',
      };

      await service.generatePaymentQR(paymentInfo);
      service.simulatePaymentCompletion('TXN_RETRY_COMPLETED', true);

      await expect(service.retryPayment('TXN_RETRY_COMPLETED')).rejects.toThrow('Cannot retry payment with status: completed');
    });

    it('should throw error for empty transaction ID', async () => {
      await expect(service.retryPayment('')).rejects.toThrow('Transaction ID is required');
    });
  });

  describe('getMerchantId', () => {
    it('should return the merchant ID', () => {
      expect(service.getMerchantId()).toBe('TEST_MERCHANT_123');
    });
  });

  describe('clearTransactions', () => {
    it('should clear all payment transactions', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 100,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_CLEAR_001',
        sessionId: 'SESSION_CLEAR_001',
      };

      await service.generatePaymentQR(paymentInfo);
      service.clearTransactions();

      await expect(service.verifyPayment('TXN_CLEAR_001')).rejects.toThrow('Transaction TXN_CLEAR_001 not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large payment amounts', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 999999.99,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_LARGE',
        sessionId: 'SESSION_LARGE',
      };

      const qrCode = await service.generatePaymentQR(paymentInfo);

      expect(qrCode.imageData).toBeDefined();
      expect(qrCode.paymentUrl).toContain('999999.99');
    });

    it('should handle very small payment amounts', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 0.01,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_SMALL',
        sessionId: 'SESSION_SMALL',
      };

      const qrCode = await service.generatePaymentQR(paymentInfo);

      expect(qrCode.imageData).toBeDefined();
      expect(qrCode.paymentUrl).toContain('0.01');
    });

    it('should handle special characters in transaction reference', async () => {
      const paymentInfo: PaymentInfo = {
        amount: 50,
        currency: 'USD',
        merchantId: 'TEST_MERCHANT',
        transactionReference: 'TXN_SPECIAL_!@#$%',
        sessionId: 'SESSION_SPECIAL',
      };

      const qrCode = await service.generatePaymentQR(paymentInfo);

      expect(qrCode.imageData).toBeDefined();
    });

    it('should handle different currency codes', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR'];

      for (const currency of currencies) {
        const paymentInfo: PaymentInfo = {
          amount: 100,
          currency,
          merchantId: 'TEST_MERCHANT',
          transactionReference: `TXN_${currency}`,
          sessionId: `SESSION_${currency}`,
        };

        const qrCode = await service.generatePaymentQR(paymentInfo);

        expect(qrCode.paymentUrl).toContain(currency);
      }
    });
  });
});
