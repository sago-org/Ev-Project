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
  private readonly WS_RECONNECT_DELAY = 3000;
  private readonly WS_BASE_URL = 'ws://localhost:8080/availability'; // Configurable endpoint

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

    // Fetch from API
    try {
      const response = await fetch(`/api/stations/${stationId}/availability`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`);
      }

      const slots: SlotStatus[] = await response.json();
      
      // Validate and normalize the data
      const validatedSlots = slots.map(slot => ({
        ...slot,
        lastUpdated: new Date(slot.lastUpdated),
      }));

      // Update cache
      this.slotCache.set(stationId, validatedSlots);

      return validatedSlots;
    } catch (error) {
      // If fetch fails and we have cached data, return it with a warning
      if (cached) {
        console.warn('Using stale cached data due to fetch error:', error);
        return cached;
      }
      throw error;
    }
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

    try {
      const response = await fetch(`/api/stations/${stationId}/slots/${slotNumber}/occupy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Slot is already occupied');
        }
        throw new Error(`Failed to occupy slot: ${response.statusText}`);
      }

      // Update local cache
      await this.updateSlotInCache(stationId, slotNumber, false);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark a slot as available
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

    try {
      const response = await fetch(`/api/stations/${stationId}/slots/${slotNumber}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to release slot: ${response.statusText}`);
      }

      // Update local cache
      await this.updateSlotInCache(stationId, slotNumber, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Connect to WebSocket for real-time updates
   * Falls back to polling if connection fails
   */
  private connectWebSocket(stationId: string): void {
    try {
      const ws = new WebSocket(`${this.WS_BASE_URL}/${stationId}`);

      ws.onopen = () => {
        console.log(`WebSocket connected for station ${stationId}`);
        this.wsConnections.set(stationId, ws);
      };

      ws.onmessage = (event) => {
        try {
          const slots: SlotStatus[] = JSON.parse(event.data);
          const validatedSlots = slots.map(slot => ({
            ...slot,
            lastUpdated: new Date(slot.lastUpdated),
          }));
          
          this.slotCache.set(stationId, validatedSlots);
          this.notifySubscribers(stationId, validatedSlots);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.fallbackToPolling(stationId);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for station ${stationId}`);
        this.wsConnections.delete(stationId);
        
        // Attempt reconnection if there are still subscribers
        if (this.subscribers.has(stationId) && this.subscribers.get(stationId)!.size > 0) {
          setTimeout(() => {
            if (this.subscribers.has(stationId) && this.subscribers.get(stationId)!.size > 0) {
              this.connectWebSocket(stationId);
            }
          }, this.WS_RECONNECT_DELAY);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.fallbackToPolling(stationId);
    }
  }

  /**
   * Fall back to polling when WebSocket is unavailable
   */
  private fallbackToPolling(stationId: string): void {
    // Don't start polling if already polling
    if (this.pollingIntervals.has(stationId)) {
      return;
    }

    console.log(`Falling back to polling for station ${stationId}`);

    const poll = async () => {
      try {
        const slots = await this.getSlotAvailability(stationId);
        this.notifySubscribers(stationId, slots);
      } catch (error) {
        console.error('Polling error:', error);
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
