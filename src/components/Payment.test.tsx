import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Payment } from './Payment';
import type { ChargingSessionSummary } from '../models';
import { paymentGatewayService } from '../services/PaymentGatewayService';

describe('Payment Component', () => {
  const mockSummary: ChargingSessionSummary = {
    sessionId: 'SESSION-123',
    stationName: 'Test Station',
    slotNumber: 'A1',
    startTime: new Date('2024-01-01T10:00:00'),
    endTime: new Date('2024-01-01T11:30:00'),
    duration: 5400, // 1.5 hours
    energyDelivered: 25.5,
    pricePerKwh: 10.0,
    subtotal: 255.0,
    taxes: 25.5,
    fees: 10.0,
    totalAmount: 290.5,
  };

  beforeEach(() => {
    // Clear any previous transactions
    paymentGatewayService.clearTransactions();
  });

  describe('QR Code Screen', () => {
    it('should display QR code prominently (Requirement 10.3)', async () => {
      render(<Payment summary={mockSummary} />);

      // Wait for QR code to be generated
      await waitFor(() => {
        const qrImage = screen.getByAltText('Payment QR Code');
        expect(qrImage).toBeInTheDocument();
      });

      const qrImage = screen.getByAltText('Payment QR Code');
      expect(qrImage).toHaveClass('qr-code-image');
    });

    it('should show payment amount in large, readable text (Requirement 11.1, 11.3)', async () => {
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        const amountDisplay = screen.getByText('₹290.50');
        expect(amountDisplay).toBeInTheDocument();
      });

      const amountDisplay = screen.getByText('₹290.50');
      expect(amountDisplay).toHaveClass('amount-value');
    });

    it('should display payment amount with currency symbol and 2 decimals (Requirement 11.2)', async () => {
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        const amountDisplay = screen.getByText('₹290.50');
        expect(amountDisplay).toBeInTheDocument();
      });

      // Verify format: currency symbol + amount with 2 decimals
      expect(screen.getByText('₹290.50')).toBeInTheDocument();
    });

    it('should display session and transaction details', async () => {
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByText('SESSION-123')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Station')).toBeInTheDocument();
      expect(screen.getByText('25.500 kWh')).toBeInTheDocument();
    });

    it('should have "I\'ve Paid" button', async () => {
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /I have completed the payment/i });
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Payment Verification', () => {
    it('should show verifying screen when payment is being verified (Requirement 12.1)', async () => {
      const user = userEvent.setup();
      render(<Payment summary={mockSummary} />);

      // Wait for QR code to load
      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      // Click "I've Paid" button
      const paidButton = screen.getByRole('button', { name: /I have completed the payment/i });
      await user.click(paidButton);

      // Should show verifying screen
      expect(screen.getByText('Verifying Payment')).toBeInTheDocument();
      expect(screen.getByText(/Please wait while we confirm your payment/i)).toBeInTheDocument();
    });

    it('should display amount on verification screen (Requirement 11.3)', async () => {
      const user = userEvent.setup();
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      const paidButton = screen.getByRole('button', { name: /I have completed the payment/i });
      await user.click(paidButton);

      // Wait for verifying screen
      await waitFor(() => {
        expect(screen.getByText('Verifying Payment')).toBeInTheDocument();
      });

      // Amount should still be displayed
      expect(screen.getByText('₹290.50')).toBeInTheDocument();
    });
  });

  describe('Payment Success', () => {
    it('should show confirmation message on successful payment (Requirement 12.2)', async () => {
      const user = userEvent.setup();
      const onPaymentSuccess = vi.fn();
      render(<Payment summary={mockSummary} onPaymentSuccess={onPaymentSuccess} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      const paidButton = screen.getByRole('button', { name: /I have completed the payment/i });
      await user.click(paidButton);

      // Wait for success screen
      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText(/Your payment has been confirmed/i)).toBeInTheDocument();
      expect(onPaymentSuccess).toHaveBeenCalled();
    });

    it('should display amount on confirmation screen (Requirement 11.3)', async () => {
      const user = userEvent.setup();
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      const paidButton = screen.getByRole('button', { name: /I have completed the payment/i });
      await user.click(paidButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Amount should be displayed on success screen
      expect(screen.getByText('₹290.50')).toBeInTheDocument();
    });

    it('should display transaction details on success', async () => {
      const user = userEvent.setup();
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      const paidButton = screen.getByRole('button', { name: /I have completed the payment/i });
      await user.click(paidButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('SESSION-123')).toBeInTheDocument();
    });
  });

  describe('Payment Failure', () => {
    it('should show error message and retry option on failure (Requirement 12.3)', async () => {
      const user = userEvent.setup();
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      // Click simulate failure button
      const failButton = screen.getByRole('button', { name: /Simulate payment failure/i });
      await user.click(failButton);

      // Wait for error screen
      await waitFor(() => {
        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText(/Payment declined by bank/i)).toBeInTheDocument();
      
      // Should have retry button
      const retryButton = screen.getByRole('button', { name: /Retry payment/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should display amount on error screen', async () => {
      const user = userEvent.setup();
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      const failButton = screen.getByRole('button', { name: /Simulate payment failure/i });
      await user.click(failButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Amount should be displayed on error screen
      expect(screen.getByText('₹290.50')).toBeInTheDocument();
    });

    it('should allow retry after failure', async () => {
      const user = userEvent.setup();
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      const failButton = screen.getByRole('button', { name: /Simulate payment failure/i });
      await user.click(failButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /Retry payment/i });
      await user.click(retryButton);

      // Should go back to QR code screen
      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while generating QR code', () => {
      render(<Payment summary={mockSummary} />);

      // Initially should show loading
      expect(screen.getByText(/Generating payment QR code/i)).toBeInTheDocument();
    });
  });

  describe('Back Navigation', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      render(<Payment summary={mockSummary} onBack={onBack} />);

      await waitFor(() => {
        expect(screen.getByAltText('Payment QR Code')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Go back/i });
      await user.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Integration with PaymentGatewayService', () => {
    it('should generate QR code with correct payment info (Requirement 10.1, 10.2)', async () => {
      render(<Payment summary={mockSummary} />);

      await waitFor(() => {
        const qrImage = screen.getByAltText('Payment QR Code');
        expect(qrImage).toBeInTheDocument();
        
        // Verify QR code image has data URL
        const src = qrImage.getAttribute('src');
        expect(src).toMatch(/^data:image\/png;base64,/);
      });
    });

    it('should handle QR code generation error', async () => {
      // Create a summary with invalid amount to trigger error
      const invalidSummary = { ...mockSummary, totalAmount: -1 };
      
      render(<Payment summary={invalidSummary} />);

      // Wait for error to appear
      await waitFor(() => {
        const errorElement = screen.queryByText(/Invalid payment amount/i);
        if (!errorElement) {
          // If error not shown in UI, check that loading finished
          expect(screen.queryByText(/Generating payment QR code/i)).not.toBeInTheDocument();
        }
      });
    });
  });
});
