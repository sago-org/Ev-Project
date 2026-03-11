import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ChargingSession } from './ChargingSession';
import type { ChargingSession as ChargingSessionType } from '../models/ChargingSession';

// Mock the ChargingSessionManager with singleton pattern
const mockStartSession = vi.fn();
const mockGetSessionStatus = vi.fn();
const mockStopSession = vi.fn();
const mockCleanup = vi.fn();

vi.mock('../services/ChargingSessionManager', () => {
  return {
    ChargingSessionManager: {
      getInstance: vi.fn(() => ({
        startSession: mockStartSession,
        getSessionStatus: mockGetSessionStatus,
        stopSession: mockStopSession,
        cleanup: mockCleanup,
      })),
      resetInstance: vi.fn(),
    },
  };
});

describe('ChargingSession Component', () => {
  const mockProps = {
    stationId: 'station-1',
    stationName: 'Downtown EV Charging Hub',
    slotNumber: 'A1',
    userId: 'user-123',
  };

  const mockSession: ChargingSessionType = {
    sessionId: 'session-abc-123',
    stationId: 'station-1',
    slotNumber: 'A1',
    userId: 'user-123',
    startTime: new Date('2024-01-15T10:00:00'),
    status: 'active',
    energyDelivered: 5.234,
    elapsedTime: 1800, // 30 minutes
    realTimeUpdates: [],
  };

  beforeEach(async () => {
    mockStartSession.mockClear().mockResolvedValue(mockSession);
    mockGetSessionStatus.mockClear().mockResolvedValue(mockSession);
    mockStopSession.mockClear().mockResolvedValue({
      sessionId: 'session-abc-123',
      stationName: 'Downtown EV Charging Hub',
      slotNumber: 'A1',
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T10:30:00'),
      duration: 1800,
      energyDelivered: 5.234,
      pricePerKwh: 0.35,
      subtotal: 1.83,
      taxes: 0.18,
      fees: 1.0,
      totalAmount: 3.01,
    });
    mockCleanup.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 7.1: Display charging status', () => {
    it('should display initial state before session starts', () => {
      render(<ChargingSession {...mockProps} />);

      expect(screen.getByRole('heading', { name: 'Start Charging' })).toBeInTheDocument();
      expect(screen.getByText('Downtown EV Charging Hub')).toBeInTheDocument();
      expect(screen.getByText('A1')).toBeInTheDocument();
    });

    it('should display active charging status after session starts', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Charging in Progress')).toBeInTheDocument();
      });
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display status indicator with active state', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        const statusIndicator = document.querySelector('.status-indicator.active');
        expect(statusIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 7.2: Display elapsed charging time', () => {
    it('should display elapsed time in HH:MM:SS format', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        // 1800 seconds = 00:30:00
        expect(screen.getByText('00:30:00')).toBeInTheDocument();
      });
    });

    it('should format elapsed time correctly for hours', async () => {
      const sessionWithHours = {
        ...mockSession,
        elapsedTime: 7325, // 2 hours, 2 minutes, 5 seconds
      };
      mockStartSession.mockResolvedValue(sessionWithHours);

      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('02:02:05')).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 7.3: Display energy delivered', () => {
    it('should display energy delivered in kWh', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('5.234 kWh')).toBeInTheDocument();
      });
    });

    it('should display energy with 3 decimal places', async () => {
      const sessionWithEnergy = {
        ...mockSession,
        energyDelivered: 12.567,
      };
      mockStartSession.mockResolvedValue(sessionWithEnergy);

      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('12.567 kWh')).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 7.4: Display session details', () => {
    it('should display session ID', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('session-abc-123')).toBeInTheDocument();
      });
    });

    it('should display start time', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        const startTime = mockSession.startTime.toLocaleTimeString();
        expect(screen.getByText(startTime)).toBeInTheDocument();
      });
    });

    it('should display station name and parking slot', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Downtown EV Charging Hub').length).toBeGreaterThan(0);
        expect(screen.getAllByText('A1').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Start and stop charging buttons', () => {
    it('should display start charging button initially', () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).not.toBeDisabled();
    });

    it('should call startSession when start button is clicked', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      expect(mockStartSession).toHaveBeenCalledWith('station-1', 'A1', 'user-123');
    });

    it('should display stop charging button after session starts', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /Stop charging session/i });
        expect(stopButton).toBeInTheDocument();
        expect(stopButton).not.toBeDisabled();
      });
    });

    it('should call stopSession when stop button is clicked', async () => {
      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stop charging session/i })).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /Stop charging session/i });
      await act(async () => {
        stopButton.click();
      });

      expect(mockStopSession).toHaveBeenCalledWith('session-abc-123');
    });

    it('should call onSessionComplete when session is stopped', async () => {
      const mockOnSessionComplete = vi.fn();
      render(<ChargingSession {...mockProps} onSessionComplete={mockOnSessionComplete} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stop charging session/i })).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /Stop charging session/i });
      await act(async () => {
        stopButton.click();
      });

      await waitFor(() => {
        expect(mockOnSessionComplete).toHaveBeenCalledWith('session-abc-123', expect.any(Object));
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when start session fails', async () => {
      mockStartSession.mockRejectedValue(new Error('Failed to start session'));

      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to start session')).toBeInTheDocument();
      });
    });

    it('should display error message when stop session fails', async () => {
      mockStopSession.mockRejectedValue(new Error('Failed to stop session'));

      render(<ChargingSession {...mockProps} />);

      const startButton = screen.getByRole('button', { name: /Start charging session/i });
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stop charging session/i })).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /Stop charging session/i });
      await act(async () => {
        stopButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to stop session')).toBeInTheDocument();
      });
    });
  });

  describe('Back button', () => {
    it('should display back button when onBack is provided', () => {
      const mockOnBack = vi.fn();
      render(<ChargingSession {...mockProps} onBack={mockOnBack} />);

      const backButton = screen.getByRole('button', { name: /Go back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = vi.fn();
      render(<ChargingSession {...mockProps} onBack={mockOnBack} />);

      const backButton = screen.getByRole('button', { name: /Go back/i });
      await act(async () => {
        backButton.click();
      });

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should not display back button when onBack is not provided', () => {
      render(<ChargingSession {...mockProps} />);

      const backButton = screen.queryByRole('button', { name: /Go back/i });
      expect(backButton).not.toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should not call cleanup on unmount (singleton persists)', () => {
      const { unmount } = render(<ChargingSession {...mockProps} />);

      unmount();

      // Singleton manager should NOT be cleaned up on component unmount
      expect(mockCleanup).not.toHaveBeenCalled();
    });
  });

  describe('Instructions', () => {
    it('should display connection instructions before starting', () => {
      render(<ChargingSession {...mockProps} />);

      expect(
        screen.getByText(/Please ensure your vehicle is properly connected/i)
      ).toBeInTheDocument();
    });
  });
});
