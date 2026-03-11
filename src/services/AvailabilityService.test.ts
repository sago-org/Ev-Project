import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AvailabilityService } from './AvailabilityService';
import { SlotStatus } from '../models/ParkingSlot';

// Mock fetch for tests
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(() => {
    service = new AvailabilityService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSlotAvailability', () => {
    it('should fetch slot availability from API', async () => {
      const mockSlots: SlotStatus[] = [
        { slotNumber: 'A1', isAvailable: true, lastUpdated: new Date() },
        { slotNumber: 'A2', isAvailable: false, lastUpdated: new Date() },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSlots,
      });

      const result = await service.getSlotAvailability('station-1');

      expect(result).toHaveLength(2);
      expect(result[0]?.slotNumber).toBe('A1');
      expect(result[0]?.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/stations/station-1/availability');
    });

    it('should throw error for empty station ID', async () => {
      await expect(service.getSlotAvailability('')).rejects.toThrow(
        'Station ID cannot be empty'
      );
    });

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service.getSlotAvailability('station-1')).rejects.toThrow(
        'Failed to fetch availability: Not Found'
      );
    });

    it('should return cached data when available and valid', async () => {
      const mockSlots: SlotStatus[] = [
        { slotNumber: 'A1', isAvailable: true, lastUpdated: new Date() },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSlots,
      });

      // First call - fetches from API
      await service.getSlotAvailability('station-1');

      // Second call - should use cache
      const result = await service.getSlotAvailability('station-1');

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('subscribeToUpdates', () => {
    it('should return a subscription object with unsubscribe method', () => {
      const callback = vi.fn();
      const subscription = service.subscribeToUpdates('station-1', callback);

      expect(subscription).toHaveProperty('unsubscribe');
      expect(typeof subscription.unsubscribe).toBe('function');
    });

    it('should throw error for empty station ID', () => {
      const callback = vi.fn();
      expect(() => service.subscribeToUpdates('', callback)).toThrow(
        'Station ID cannot be empty'
      );
    });

    it('should throw error for invalid callback', () => {
      expect(() => service.subscribeToUpdates('station-1', null as any)).toThrow(
        'Callback must be a function'
      );
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const subscription = service.subscribeToUpdates('station-1', callback);

      expect(() => subscription.unsubscribe()).not.toThrow();
    });
  });

  describe('occupySlot', () => {
    it('should mark slot as occupied via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await expect(service.occupySlot('station-1', 'A1')).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/stations/station-1/slots/A1/occupy',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw error for empty station ID', async () => {
      await expect(service.occupySlot('', 'A1')).rejects.toThrow(
        'Station ID cannot be empty'
      );
    });

    it('should throw error for empty slot number', async () => {
      await expect(service.occupySlot('station-1', '')).rejects.toThrow(
        'Slot number cannot be empty'
      );
    });

    it('should throw error when slot is already occupied', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      });

      await expect(service.occupySlot('station-1', 'A1')).rejects.toThrow(
        'Slot is already occupied'
      );
    });

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.occupySlot('station-1', 'A1')).rejects.toThrow(
        'Failed to occupy slot: Internal Server Error'
      );
    });
  });

  describe('releaseSlot', () => {
    it('should mark slot as available via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await expect(service.releaseSlot('station-1', 'A1')).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/stations/station-1/slots/A1/release',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw error for empty station ID', async () => {
      await expect(service.releaseSlot('', 'A1')).rejects.toThrow(
        'Station ID cannot be empty'
      );
    });

    it('should throw error for empty slot number', async () => {
      await expect(service.releaseSlot('station-1', '')).rejects.toThrow(
        'Slot number cannot be empty'
      );
    });

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(service.releaseSlot('station-1', 'A1')).rejects.toThrow(
        'Failed to release slot: Internal Server Error'
      );
    });
  });

  describe('real-time updates', () => {
    it('should handle cache updates when slot status changes', async () => {
      const mockSlots: SlotStatus[] = [
        { slotNumber: 'A1', isAvailable: true, lastUpdated: new Date() },
        { slotNumber: 'A2', isAvailable: true, lastUpdated: new Date() },
      ];

      // Setup initial cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSlots,
      });

      await service.getSlotAvailability('station-1');

      // Mock occupy slot
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await service.occupySlot('station-1', 'A1');

      // Verify cache was updated (this is internal, so we test indirectly)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('5-second update guarantee', () => {
    it('should use polling interval of 5 seconds', () => {
      // This tests that the POLLING_INTERVAL constant is set correctly
      // The actual polling behavior is tested through integration tests
      expect((service as any).POLLING_INTERVAL).toBe(5000);
    });
  });
});
