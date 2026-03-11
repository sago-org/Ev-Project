import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StationList } from './StationList';
import { StationFinderService } from '../services/StationFinderService';
import type { Coordinates, Station } from '../models';

// Mock the StationFinderService
vi.mock('../services/StationFinderService');

describe('StationList Component', () => {
  const mockLocation: Coordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  const mockEVStations: Station[] = [
    {
      id: 'ev-1',
      name: 'ChargePoint Station',
      address: '123 Main St, City',
      location: { latitude: 37.7749, longitude: -122.4194 },
      distance: 2.5,
      type: 'ev_charging',
      availableSlots: 3,
      totalSlots: 5,
      pricePerKwh: 0.35,
    },
    {
      id: 'ev-2',
      name: 'Tesla Supercharger',
      address: '456 Oak Ave, City',
      location: { latitude: 37.7849, longitude: -122.4094 },
      distance: 5.2,
      type: 'ev_charging',
      availableSlots: 8,
      totalSlots: 12,
      pricePerKwh: 0.28,
    },
  ];

  const mockPetrolPumps: Station[] = [
    {
      id: 'petrol-1',
      name: 'Shell Gas Station',
      address: '789 Elm St, City',
      location: { latitude: 37.7649, longitude: -122.4294 },
      distance: 3.1,
      type: 'petrol_pump',
      availableSlots: 6,
      totalSlots: 8,
      pricePerKwh: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    const mockService = {
      findChargingStations: vi.fn().mockImplementation(() => new Promise(() => {})),
      findPetrolPumps: vi.fn(),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    expect(screen.getByText('Searching for nearby stations...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays EV charging stations when found', async () => {
    const mockService = {
      findChargingStations: vi.fn().mockResolvedValue(mockEVStations),
      findPetrolPumps: vi.fn(),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    await waitFor(() => {
      expect(screen.getByText('Nearby Charging Stations')).toBeInTheDocument();
    });

    expect(screen.getByText('ChargePoint Station')).toBeInTheDocument();
    expect(screen.getByText('Tesla Supercharger')).toBeInTheDocument();
    expect(screen.getByText('Found 2 stations')).toBeInTheDocument();
  });

  it('displays station name, address, distance, and available slots', async () => {
    const mockService = {
      findChargingStations: vi.fn().mockResolvedValue([mockEVStations[0]]),
      findPetrolPumps: vi.fn(),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    await waitFor(() => {
      expect(screen.getByText('ChargePoint Station')).toBeInTheDocument();
    });

    // Check for station name (already checked above)
    // Check for address
    expect(screen.getByText('123 Main St, City')).toBeInTheDocument();
    // Check for distance
    expect(screen.getByText('2.5 km')).toBeInTheDocument();
    // Check for available slots
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
  });

  it('sorts stations by distance', async () => {
    // Service returns sorted stations (already sorted by distance)
    const sortedStations = mockEVStations; // 2.5km first, then 5.2km
    const mockService = {
      findChargingStations: vi.fn().mockResolvedValue(sortedStations),
      findPetrolPumps: vi.fn(),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    await waitFor(() => {
      expect(screen.getByText('ChargePoint Station')).toBeInTheDocument();
    });

    const stationCards = screen.getAllByRole('button');
    // Verify stations are displayed in sorted order (by distance)
    expect(stationCards[0]).toHaveTextContent('ChargePoint Station');
    expect(stationCards[0]).toHaveTextContent('2.5 km');
    expect(stationCards[1]).toHaveTextContent('Tesla Supercharger');
    expect(stationCards[1]).toHaveTextContent('5.2 km');
  });

  it('displays fallback petrol pumps when no EV stations found', async () => {
    const mockService = {
      findChargingStations: vi.fn().mockResolvedValue([]),
      findPetrolPumps: vi.fn().mockResolvedValue(mockPetrolPumps),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    await waitFor(() => {
      expect(screen.getByText('Nearby Petrol Pumps')).toBeInTheDocument();
    });

    expect(screen.getByText('Shell Gas Station')).toBeInTheDocument();
    expect(screen.getByText(/No EV charging stations found nearby/)).toBeInTheDocument();
  });

  it('displays visual indicator for fallback petrol pumps', async () => {
    const mockService = {
      findChargingStations: vi.fn().mockResolvedValue([]),
      findPetrolPumps: vi.fn().mockResolvedValue(mockPetrolPumps),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    await waitFor(() => {
      expect(screen.getByText('Petrol Pump')).toBeInTheDocument();
    });

    const badge = screen.getByText('Petrol Pump');
    expect(badge).toHaveClass('fallback-badge');
  });

  it('handles empty results', async () => {
    const mockService = {
      findChargingStations: vi.fn().mockResolvedValue([]),
      findPetrolPumps: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    await waitFor(() => {
      expect(screen.getByText(/No stations found within 10 kilometers/)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    const mockService = {
      findChargingStations: vi.fn().mockRejectedValue(new Error('Network error')),
      findPetrolPumps: vi.fn(),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    render(<StationList location={mockLocation} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls onStationSelect when a station is clicked', async () => {
    const mockService = {
      findChargingStations: vi.fn().mockResolvedValue(mockEVStations),
      findPetrolPumps: vi.fn(),
    };
    vi.mocked(StationFinderService).mockImplementation(() => mockService as any);

    const onStationSelect = vi.fn();
    render(<StationList location={mockLocation} onStationSelect={onStationSelect} />);

    await waitFor(() => {
      expect(screen.getByText('ChargePoint Station')).toBeInTheDocument();
    });

    const firstStation = screen.getByLabelText('Select ChargePoint Station');
    firstStation.click();

    expect(onStationSelect).toHaveBeenCalledWith(mockEVStations[0]);
  });
});
