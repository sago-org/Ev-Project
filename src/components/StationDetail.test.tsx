import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StationDetail } from './StationDetail';
import type { Station } from '../models/Station';
import type { SlotStatus } from '../models/ParkingSlot';

// Mock the AvailabilityService
vi.mock('../services/AvailabilityService', () => {
  return {
    AvailabilityService: vi.fn().mockImplementation(() => {
      return {
        getSlotAvailability: vi.fn(),
        subscribeToUpdates: vi.fn(),
      };
    }),
  };
});

describe('StationDetail Component', () => {
  const mockStation: Station = {
    id: 'station-1',
    name: 'Downtown EV Charging Hub',
    address: '123 Main St, City, State 12345',
    location: { latitude: 40.7128, longitude: -74.006 },
    distance: 2.5,
    type: 'ev_charging',
    availableSlots: 5,
    totalSlots: 10,
    pricePerKwh: 0.35,
    operatingHours: {
      open: '06:00',
      close: '22:00',
      is24Hours: false,
    },
  };

  const mockSlots: SlotStatus[] = [
    { slotNumber: 'A1', isAvailable: true, lastUpdated: new Date() },
    { slotNumber: 'A2', isAvailable: false, lastUpdated: new Date() },
    { slotNumber: 'A3', isAvailable: true, lastUpdated: new Date() },
    { slotNumber: 'B1', isAvailable: true, lastUpdated: new Date() },
    { slotNumber: 'B2', isAvailable: false, lastUpdated: new Date() },
  ];

  let mockGetSlotAvailability: ReturnType<typeof vi.fn>;
  let mockSubscribeToUpdates: ReturnType<typeof vi.fn>;
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockUnsubscribe = vi.fn();
    mockGetSlotAvailability = vi.fn().mockResolvedValue(mockSlots);
    mockSubscribeToUpdates = vi.fn().mockReturnValue({
      unsubscribe: mockUnsubscribe,
    });

    const AvailabilityServiceModule = await import('../services/AvailabilityService');
    vi.mocked(AvailabilityServiceModule.AvailabilityService).mockImplementation(() => ({
      getSlotAvailability: mockGetSlotAvailability,
      subscribeToUpdates: mockSubscribeToUpdates,
    } as any));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 5.1: Display detailed station information', () => {
    it('should display station name', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('Downtown EV Charging Hub')).toBeInTheDocument();
      });
    });

    it('should display station address', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument();
      });
    });

    it('should display station distance', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('2.5 km')).toBeInTheDocument();
      });
    });

    it('should display price per kWh for EV charging stations', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('$0.35/kWh')).toBeInTheDocument();
      });
    });

    it('should display operating hours', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('06:00 - 22:00')).toBeInTheDocument();
      });
    });

    it('should display 24 Hours for stations open all day', async () => {
      const station24h = {
        ...mockStation,
        operatingHours: {
          open: '00:00',
          close: '00:00',
          is24Hours: true,
        },
      };

      render(<StationDetail station={station24h} />);

      await waitFor(() => {
        expect(screen.getByText('24 Hours')).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 5.2: Display all parking slot numbers', () => {
    it('should display all parking slot numbers', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('A1')).toBeInTheDocument();
        expect(screen.getByText('A2')).toBeInTheDocument();
        expect(screen.getByText('A3')).toBeInTheDocument();
        expect(screen.getByText('B1')).toBeInTheDocument();
        expect(screen.getByText('B2')).toBeInTheDocument();
      });
    });

    it('should fetch slot availability on mount', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(mockGetSlotAvailability).toHaveBeenCalledWith('station-1');
      });
    });
  });

  describe('Requirement 5.3: Indicate available and occupied slots', () => {
    it('should show available slots count', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('3 Available')).toBeInTheDocument();
      });
    });

    it('should show occupied slots count', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('2 Occupied')).toBeInTheDocument();
      });
    });

    it('should apply available class to available slots', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const slotA1 = screen.getByRole('listitem', { name: /Slot A1, available/i });
        expect(slotA1).toHaveClass('available');
      });
    });

    it('should apply occupied class to occupied slots', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const slotA2 = screen.getByRole('listitem', { name: /Slot A2, occupied/i });
        expect(slotA2).toHaveClass('occupied');
      });
    });

    it('should disable occupied slots', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const slotA2 = screen.getByRole('listitem', { name: /Slot A2, occupied/i });
        expect(slotA2).toBeDisabled();
      });
    });
  });

  describe('Requirement 5.4: Provide proceed button', () => {
    it('should display proceed button', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const proceedButton = screen.getByRole('button', { name: /Proceed with selected station/i });
        expect(proceedButton).toBeInTheDocument();
      });
    });

    it('should call onProceed when proceed button is clicked', async () => {
      const mockOnProceed = vi.fn();
      render(<StationDetail station={mockStation} onProceed={mockOnProceed} />);

      await waitFor(() => {
        const proceedButton = screen.getByRole('button', { name: /Proceed with selected station/i });
        proceedButton.click();
      });

      expect(mockOnProceed).toHaveBeenCalledWith(mockStation, undefined);
    });
  });

  describe('Requirement 6.1: Display parking slots in grid format', () => {
    it('should render parking slots in a grid container', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const grid = document.querySelector('.parking-slots-grid');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should render slots as list items', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const slots = screen.getAllByRole('listitem');
        expect(slots.length).toBe(5);
      });
    });
  });

  describe('Requirement 6.2: Use distinct visual indicators', () => {
    it('should display legend with visual indicators', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText(/Available - Click to select/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Occupied/i).length).toBeGreaterThan(0);
      });
    });

    it('should show available indicator in legend', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const indicators = document.querySelectorAll('.available-indicator');
        expect(indicators.length).toBeGreaterThan(0);
      });
    });

    it('should show occupied indicator in legend', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const indicators = document.querySelectorAll('.occupied-indicator');
        expect(indicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Requirement 6.3: Subscribe to real-time updates', () => {
    it('should subscribe to availability updates on mount', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(mockSubscribeToUpdates).toHaveBeenCalledWith(
          'station-1',
          expect.any(Function)
        );
      });
    });

    it('should unsubscribe on unmount', async () => {
      const { unmount } = render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(mockSubscribeToUpdates).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update slots when subscription callback is called', async () => {
      let updateCallback: ((slots: SlotStatus[]) => void) | undefined;

      mockSubscribeToUpdates.mockImplementation((_stationId, callback) => {
        updateCallback = callback;
        return { unsubscribe: mockUnsubscribe };
      });

      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(mockSubscribeToUpdates).toHaveBeenCalled();
      });

      // Simulate real-time update
      const updatedSlots: SlotStatus[] = [
        { slotNumber: 'A1', isAvailable: false, lastUpdated: new Date() },
        { slotNumber: 'A2', isAvailable: true, lastUpdated: new Date() },
        { slotNumber: 'A3', isAvailable: true, lastUpdated: new Date() },
        { slotNumber: 'B1', isAvailable: true, lastUpdated: new Date() },
        { slotNumber: 'B2', isAvailable: false, lastUpdated: new Date() },
      ];

      if (updateCallback) {
        updateCallback(updatedSlots);
      }

      await waitFor(() => {
        // After update, A1 should be occupied and A2 should be available
        const slotA1 = screen.getByRole('listitem', { name: /Slot A1, occupied/i });
        expect(slotA1).toHaveClass('occupied');

        const slotA2 = screen.getByRole('listitem', { name: /Slot A2, available/i });
        expect(slotA2).toHaveClass('available');
      });
    });
  });

  describe('Loading and error states', () => {
    it('should show loading state initially', () => {
      const neverResolvingPromise = new Promise<SlotStatus[]>(() => {}); // Never resolves
      mockGetSlotAvailability.mockReturnValue(neverResolvingPromise);

      render(<StationDetail station={mockStation} />);

      expect(screen.getByText('Loading station details...')).toBeInTheDocument();
    });

    it('should show error state when fetch fails', async () => {
      mockGetSlotAvailability.mockRejectedValue(new Error('Network error'));

      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show empty state when no slots available', async () => {
      mockGetSlotAvailability.mockResolvedValue([]);

      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        expect(screen.getByText('No parking slot information available for this station.')).toBeInTheDocument();
      });
    });
  });

  describe('Back button', () => {
    it('should display back button when onBack is provided', async () => {
      const mockOnBack = vi.fn();
      render(<StationDetail station={mockStation} onBack={mockOnBack} />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /Go back/i });
        expect(backButton).toBeInTheDocument();
      });
    });

    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = vi.fn();
      render(<StationDetail station={mockStation} onBack={mockOnBack} />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /Go back/i });
        backButton.click();
      });

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should not display back button when onBack is not provided', async () => {
      render(<StationDetail station={mockStation} />);

      await waitFor(() => {
        const backButton = screen.queryByRole('button', { name: /Go back/i });
        expect(backButton).not.toBeInTheDocument();
      });
    });
  });

  describe('Petrol pump stations', () => {
    it('should display petrol pump badge for fallback stations', async () => {
      const petrolStation: Station = {
        ...mockStation,
        type: 'petrol_pump',
      };

      render(<StationDetail station={petrolStation} />);

      await waitFor(() => {
        expect(screen.getByText('Petrol Pump')).toBeInTheDocument();
      });
    });

    it('should not display price for petrol pumps', async () => {
      const petrolStation: Station = {
        ...mockStation,
        type: 'petrol_pump',
      };

      render(<StationDetail station={petrolStation} />);

      await waitFor(() => {
        expect(screen.queryByText(/\$.*\/kWh/)).not.toBeInTheDocument();
      });
    });
  });
});
