import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AvailabilityService } from './AvailabilityService';

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
    it('should generate mock slot availability data', async () => {
      const result = await service.getSlotAvailability('station-1');

      // Should generate 6-12 slots
      expect(result.length).toBeGreaterThanOrEqual(6);
      expect(result.length).toBeLessThanOrEqual(12);
      
      // Each slot should have required properties
      result.forEach(slot => {
        expect(slot).toHaveProperty('slotNumber');
        expect(slot).toHaveProperty('isAvailable');
        expect(slot).toHaveProperty('lastUpdated');
        expect(slot.lastUpdated).toBeInstanceOf(Date);
      });
    });

    it('should throw error for empty station ID', async () => {
      await expect(service.getSlotAvailability('')).rejects.toThrow(
        'Station ID cannot be empty'
      );
    });

    it('should return cached data when available and valid', async () => {
      // First call - generates mock data
      const firstResult = await service.getSlotAvailability('station-1');

      // Second call - should use cache (same data)
      const secondResult = await service.getSlotAvailability('station-1');

      expect(firstResult).toEqual(secondResult);
    });

    it('should cache data for different stations separately', async () => {
      const station1Result = await service.getSlotAvailability('station-1');
      const station2Result = await service.getSlotAvailability('station-2');

      // Different stations should have different data
      expect(station1Result).not.toEqual(station2Result);
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
    it('should mark slot as occupied in cache', async () => {
      // First, get slots to populate cache
      const slots = await service.getSlotAvailability('station-1');
      
      // Find an available slot
      const availableSlot = slots.find(s => s.isAvailable);
      expect(availableSlot).toBeDefined();

      // Occupy the slot
      await expect(service.occupySlot('station-1', availableSlot!.slotNumber)).resolves.not.toThrow();

      // Verify the slot is now occupied in cache
      const updatedSlots = await service.getSlotAvailability('station-1');
      const occupiedSlot = updatedSlots.find(s => s.slotNumber === availableSlot!.slotNumber);
      expect(occupiedSlot?.isAvailable).toBe(false);
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
      // Get slots and find an available one
      const slots = await service.getSlotAvailability('station-1');
      const availableSlot = slots.find(s => s.isAvailable);
      expect(availableSlot).toBeDefined();
      
      // Occupy it
      await service.occupySlot('station-1', availableSlot!.slotNumber);

      // Try to occupy the same slot again
      await expect(service.occupySlot('station-1', availableSlot!.slotNumber)).rejects.toThrow(
        'Slot is already occupied'
      );
    });
  });

  describe('releaseSlot', () => {
    it('should mark slot as available in cache', async () => {
      // Get slots and occupy one
      const slots = await service.getSlotAvailability('station-1');
      
      // Find an available slot
      const availableSlot = slots.find(s => s.isAvailable);
      expect(availableSlot).toBeDefined();
      
      await service.occupySlot('station-1', availableSlot!.slotNumber);

      // Release the slot
      await expect(service.releaseSlot('station-1', availableSlot!.slotNumber)).resolves.not.toThrow();

      // Verify the slot is now available in cache
      const updatedSlots = await service.getSlotAvailability('station-1');
      const releasedSlot = updatedSlots.find(s => s.slotNumber === availableSlot!.slotNumber);
      expect(releasedSlot?.isAvailable).toBe(true);
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
  });

  describe('real-time updates', () => {
    it('should handle cache updates when slot status changes', async () => {
      // Get initial slots
      const slots = await service.getSlotAvailability('station-1');
      
      // Find an available slot
      const availableSlot = slots.find(s => s.isAvailable);
      expect(availableSlot).toBeDefined();

      // Occupy slot
      await service.occupySlot('station-1', availableSlot!.slotNumber);

      // Verify cache was updated
      const updatedSlots = await service.getSlotAvailability('station-1');
      const occupiedSlot = updatedSlots.find(s => s.slotNumber === availableSlot!.slotNumber);
      expect(occupiedSlot?.isAvailable).toBe(false);

      // Release slot
      await service.releaseSlot('station-1', availableSlot!.slotNumber);

      // Verify cache was updated again
      const finalSlots = await service.getSlotAvailability('station-1');
      const releasedSlot = finalSlots.find(s => s.slotNumber === availableSlot!.slotNumber);
      expect(releasedSlot?.isAvailable).toBe(true);
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
