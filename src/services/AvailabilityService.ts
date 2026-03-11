import { SlotStatus } from '../models/ParkingSlot';

/**
 * Subscription interface for real-time updates
 */
export interface Subscription {
  unsubscribe(): void;
}

/**
 * Service for managing real-time parking slot availability
 * Supports WebSocket connections with polling fallback
 */
export class AvailabilityService {
  private wsConnections: Map<string, WebSocket> = new Map();
  private pollingIntervals: Map<string, number> = new Map();
  private subscribers: Map<string, Set<(slots: SlotStatus[]) => void>> = new Map();
  private slotCache: Map<string, SlotStatus[]> = new Map();
  private readonly POLLING_INTERVAL = 5000; // 5 seconds as per requirement 6.4

  /**
   * Get current slot availability for a station
   * @param stationId The station ID to fetch availability for
   * @returns Promise resolving to array of slot statuses
   */
  async getSlotAvailability(stationId: string): Promise<SlotStatus[]> {
    if (!stationId || stationId.trim().length === 0) {
      throw new Error('Station ID cannot be empty');
    }

    // Check cache first
    const cached = this.slotCache.get(stationId);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // For demo: Generate mock slot data instead of API call
    try {
      const slots = this.generateMockSlots(stationId);
      
      // Update cache
      this.slotCache.set(stationId, slots);

      return slots;
    } catch (error) {
      // If generation fails and we have cached data, return it with a warning
      if (cached) {
        console.warn('Using stale cached data due to error:', error);
        return cached;
      }
      throw error;
    }
  }

  /**
   * Generate mock slot data for demo purposes
   * In production, this would be replaced with actual API calls
   */
  private generateMockSlots(_stationId: string): SlotStatus[] {
    // Generate 6-12 slots per station
    const slotCount = Math.floor(Math.random() * 7) + 6; // 6-12 slots
    const slots: SlotStatus[] = [];
    
    for (let i = 0; i < slotCount; i++) {
      const row = String.fromCharCode(65 + Math.floor(i / 4)); // A, B, C, etc.
      const col = (i % 4) + 1;
      const slotNumber = `${row}${col}`;
      
      // Randomly make some slots occupied (30% chance)
      const isAvailable = Math.random() > 0.3;
      
      slots.push({
        slotNumber,
        isAvailable,
        lastUpdated: new Date(),
      });
    }
    
    return slots;
  }

  /**
   * Subscribe to real-time availability updates for a station
   * Attempts WebSocket connection first, falls back to polling if unavailable
   * @param stationId The station ID to subscribe to
   * @param callback Function to call when updates are received
   * @returns Subscription object with unsubscribe method
   */
  subscribeToUpdates(
    stationId: string,
    callback: (slots: SlotStatus[]) => void
  ): Subscription {
    if (!stationId || stationId.trim().length === 0) {
      throw new Error('Station ID cannot be empty');
    }

    if (!callback || typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    // Add callback to subscribers
    if (!this.subscribers.has(stationId)) {
      this.subscribers.set(stationId, new Set());
    }
    this.subscribers.get(stationId)!.add(callback);

    // Try to establish WebSocket connection if not already connected
    if (!this.wsConnections.has(stationId) && !this.pollingIntervals.has(stationId)) {
      this.connectWebSocket(stationId);
    }

    // Return subscription object
    return {
      unsubscribe: () => {
        this.unsubscribe(stationId, callback);
      },
    };
  }

  /**
   * Mark a slot as occupied
   * For demo: Updates local cache only (no API call)
   * @param stationId The station ID
   * @param slotNumber The slot number to occupy
   */
  async occupySlot(stationId: string, slotNumber: string): Promise<void> {
    if (!stationId || stationId.trim().length === 0) {
      throw new Error('Station ID cannot be empty');
    }

    if (!slotNumber || slotNumber.trim().length === 0) {
      throw new Error('Slot number cannot be empty');
    }

    // For demo: Update local cache directly
    const cached = this.slotCache.get(stationId);
    if (cached) {
      const slot = cached.find(s => s.slotNumber === slotNumber);
      if (slot && !slot.isAvailable) {
        throw new Error('Slot is already occupied');
      }
    }

    // Update local cache
    await this.updateSlotInCache(stationId, slotNumber, false);
  }

  /**
   * Mark a slot as available
   * For demo: Updates local cache only (no API call)
   * @param stationId The station ID
   * @param slotNumber The slot number to release
   */
  async releaseSlot(stationId: string, slotNumber: string): Promise<void> {
    if (!stationId || stationId.trim().length === 0) {
      throw new Error('Station ID cannot be empty');
    }

    if (!slotNumber || slotNumber.trim().length === 0) {
      throw new Error('Slot number cannot be empty');
    }

    // For demo: Update local cache directly
    await this.updateSlotInCache(stationId, slotNumber, true);
  }

  /**
   * Connect to WebSocket for real-time updates
   * Falls back to polling if connection fails
   * For demo: Skip WebSocket and use mock polling directly
   */
  private connectWebSocket(stationId: string): void {
    // For demo: Skip WebSocket connection and use mock polling directly
    this.fallbackToPolling(stationId);
  }

  /**
   * Fall back to polling when WebSocket is unavailable
   * For demo: Uses mock data simulation with periodic updates
   */
  private fallbackToPolling(stationId: string): void {
    // Don't start polling if already polling
    if (this.pollingIntervals.has(stationId)) {
      return;
    }

    const poll = async () => {
      try {
        // Get current slots (from cache or generate new)
        const slots = await this.getSlotAvailability(stationId);
        
        // Simulate random slot changes (10% chance per slot)
        const updatedSlots = slots.map(slot => {
          if (Math.random() < 0.1) {
            return {
              ...slot,
              isAvailable: !slot.isAvailable,
              lastUpdated: new Date(),
            };
          }
          return slot;
        });
        
        // Update cache and notify
        this.slotCache.set(stationId, updatedSlots);
        this.notifySubscribers(stationId, updatedSlots);
      } catch (error) {
        // Silently handle errors in demo mode
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, this.POLLING_INTERVAL);
    this.pollingIntervals.set(stationId, intervalId as unknown as number);
  }

  /**
   * Notify all subscribers for a station
   */
  private notifySubscribers(stationId: string, slots: SlotStatus[]): void {
    const callbacks = this.subscribers.get(stationId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(slots);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Unsubscribe a callback from updates
   */
  private unsubscribe(stationId: string, callback: (slots: SlotStatus[]) => void): void {
    const callbacks = this.subscribers.get(stationId);
    if (callbacks) {
      callbacks.delete(callback);

      // Clean up if no more subscribers
      if (callbacks.size === 0) {
        this.subscribers.delete(stationId);
        this.cleanup(stationId);
      }
    }
  }

  /**
   * Clean up connections and intervals for a station
   */
  private cleanup(stationId: string): void {
    // Close WebSocket
    const ws = this.wsConnections.get(stationId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(stationId);
    }

    // Clear polling interval
    const intervalId = this.pollingIntervals.get(stationId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(stationId);
    }

    // Clear cache
    this.slotCache.delete(stationId);
  }

  /**
   * Check if cached data is still valid (within 30 seconds)
   */
  private isCacheValid(slots: SlotStatus[]): boolean {
    if (!slots || slots.length === 0) {
      return false;
    }

    const now = new Date();
    const oldestUpdate = Math.min(...slots.map(s => s.lastUpdated.getTime()));
    const age = now.getTime() - oldestUpdate;

    return age < 30000; // 30 seconds
  }

  /**
   * Update a specific slot in the cache
   */
  private async updateSlotInCache(
    stationId: string,
    slotNumber: string,
    isAvailable: boolean
  ): Promise<void> {
    const cached = this.slotCache.get(stationId);
    if (cached) {
      const updatedSlots = cached.map(slot =>
        slot.slotNumber === slotNumber
          ? { ...slot, isAvailable, lastUpdated: new Date() }
          : slot
      );
      this.slotCache.set(stationId, updatedSlots);
      this.notifySubscribers(stationId, updatedSlots);
    }
  }
}
