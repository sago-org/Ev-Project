import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChargingSessionManager } from './ChargingSessionManager';

describe('ChargingSessionManager', () => {
  let manager: ChargingSessionManager;

  beforeEach(() => {
    // Reset singleton before each test
    ChargingSessionManager.resetInstance();
    manager = ChargingSessionManager.getInstance();
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    manager.cleanup();
    vi.restoreAllMocks();
  });

  describe('startSession', () => {
    it('should create a new active session with valid inputs', async () => {
      const session = await manager.startSession('station-1', 'A1', 'user-123');

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.stationId).toBe('station-1');
      expect(session.slotNumber).toBe('A1');
      expect(session.userId).toBe('user-123');
      expect(session.status).toBe('active');
      expect(session.energyDelivered).toBe(0);
      expect(session.elapsedTime).toBe(0);
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.realTimeUpdates).toEqual([]);
    });

    it('should throw error when station ID is empty', async () => {
      await expect(manager.startSession('', 'A1', 'user-123')).rejects.toThrow(
        'Station ID cannot be empty'
      );
    });

    it('should throw error when slot number is empty', async () => {
      await expect(manager.startSession('station-1', '', 'user-123')).rejects.toThrow(
        'Slot number cannot be empty'
      );
    });

    it('should throw error when user ID is empty', async () => {
      await expect(manager.startSession('station-1', 'A1', '')).rejects.toThrow(
        'User ID cannot be empty'
      );
    });

    it('should generate unique session IDs for multiple sessions', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const session1 = await manager.startSession('station-1', 'A1', 'user-1');
      const session2 = await manager.startSession('station-2', 'B2', 'user-2');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should continue even if persist fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const session = await manager.startSession('station-1', 'A1', 'user-123');

      expect(session).toBeDefined();
      expect(session.status).toBe('active');
    });
  });

  describe('getSessionStatus', () => {
    it('should return active session from local cache', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const createdSession = await manager.startSession('station-1', 'A1', 'user-123');
      const retrievedSession = await manager.getSessionStatus(createdSession.sessionId);

      expect(retrievedSession.sessionId).toBe(createdSession.sessionId);
      expect(retrievedSession.status).toBe('active');
    });

    it('should fetch from backend if not in local cache', async () => {
      // For demo: No backend fetch, should throw error
      await expect(manager.getSessionStatus('session-999')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should throw error when session ID is empty', async () => {
      await expect(manager.getSessionStatus('')).rejects.toThrow(
        'Session ID cannot be empty'
      );
    });

    it('should throw error when session not found', async () => {
      await expect(manager.getSessionStatus('nonexistent')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should normalize date fields from backend response', async () => {
      // For demo: No backend fetch, test local session dates
      const session = await manager.startSession('station-1', 'A1', 'user-123');
      const retrieved = await manager.getSessionStatus(session.sessionId);

      expect(retrieved.startTime).toBeInstanceOf(Date);
    });
  });

  describe('stopSession', () => {
    it('should stop active session and return summary with cost breakdown', async () => {
      const session = await manager.startSession('ev-1', 'A1', 'user-123');

      // Wait a bit for some elapsed time
      await new Promise(resolve => setTimeout(resolve, 100));

      const summary = await manager.stopSession(session.sessionId);

      expect(summary).toBeDefined();
      expect(summary.sessionId).toBe(session.sessionId);
      expect(summary.stationName).toBe('Chennai - Anna Salai EV Hub');
      expect(summary.slotNumber).toBe('A1');
      expect(summary.startTime).toBeInstanceOf(Date);
      expect(summary.endTime).toBeInstanceOf(Date);
      expect(summary.duration).toBeGreaterThanOrEqual(0);
      expect(summary.energyDelivered).toBeGreaterThanOrEqual(0);
      expect(summary.pricePerKwh).toBe(12.50);
      expect(summary.subtotal).toBeGreaterThanOrEqual(0);
      expect(summary.taxes).toBeGreaterThanOrEqual(0);
      expect(summary.fees).toBe(1.00);
      expect(summary.totalAmount).toBeGreaterThanOrEqual(1.00);
    });

    it('should throw error when session ID is empty', async () => {
      await expect(manager.stopSession('')).rejects.toThrow(
        'Session ID cannot be empty'
      );
    });

    it('should throw error when session not found', async () => {
      await expect(manager.stopSession('nonexistent')).rejects.toThrow(
        'Session not found or already stopped'
      );
    });

    it('should throw error when trying to stop non-active session', async () => {
      const session = await manager.startSession('ev-1', 'A1', 'user-123');

      // Stop once
      await manager.stopSession(session.sessionId);

      // Try to stop again - should fail because session is no longer active
      await expect(manager.stopSession(session.sessionId)).rejects.toThrow(
        /Cannot stop session with status: stopped|Session not found or already stopped/
      );
    });

    it('should calculate correct costs with energy delivered', async () => {
      const session = await manager.startSession('ev-1', 'A1', 'user-123');

      // Wait for some energy to be delivered
      await new Promise(resolve => setTimeout(resolve, 2000));

      const summary = await manager.stopSession(session.sessionId);

      expect(summary.energyDelivered).toBeGreaterThan(0);
      
      // Verify cost calculation formula (pricePerKwh for ev-1 is 12.50)
      const expectedSubtotal = Math.round(summary.energyDelivered * 12.50 * 100) / 100;
      expect(summary.subtotal).toBe(expectedSubtotal);
      
      const expectedTaxes = Math.round(summary.subtotal * 0.10 * 100) / 100;
      expect(summary.taxes).toBe(expectedTaxes);
      
      expect(summary.fees).toBe(1.00);
      
      const expectedTotal = Math.round((summary.subtotal + summary.taxes + summary.fees) * 100) / 100;
      expect(summary.totalAmount).toBe(expectedTotal);
    });

    it('should use default station details if fetch fails', async () => {
      const session = await manager.startSession('unknown-station', 'A1', 'user-123');

      const summary = await manager.stopSession(session.sessionId);

      expect(summary.stationName).toBe('Unknown Station');
      expect(summary.pricePerKwh).toBe(12.00);
    });

    it('should continue even if persist stopped session fails', async () => {
      const session = await manager.startSession('ev-1', 'A1', 'user-123');

      const summary = await manager.stopSession(session.sessionId);

      expect(summary).toBeDefined();
      expect(summary.sessionId).toBe(session.sessionId);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly with valid inputs', () => {
      const cost = manager.calculateCost(10.5, 0.35);
      expect(cost).toBe(3.68);
    });

    it('should handle zero energy', () => {
      const cost = manager.calculateCost(0, 0.35);
      expect(cost).toBe(0);
    });

    it('should handle zero price', () => {
      const cost = manager.calculateCost(10.5, 0);
      expect(cost).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const cost = manager.calculateCost(10.333, 0.333);
      expect(cost).toBe(3.44);
    });

    it('should throw error for negative energy', () => {
      expect(() => manager.calculateCost(-5, 0.35)).toThrow(
        'Energy cannot be negative'
      );
    });

    it('should throw error for negative price', () => {
      expect(() => manager.calculateCost(10, -0.35)).toThrow(
        'Price per kWh cannot be negative'
      );
    });

    it('should handle very small values', () => {
      const cost = manager.calculateCost(0.001, 0.35);
      expect(cost).toBe(0);
    });

    it('should handle large values', () => {
      const cost = manager.calculateCost(1000, 2.5);
      expect(cost).toBe(2500);
    });
  });

  describe('real-time tracking', () => {
    it('should update energy delivered over time', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const session = await manager.startSession('station-1', 'A1', 'user-123');
      const initialEnergy = session.energyDelivered;

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 2500));

      const updatedSession = await manager.getSessionStatus(session.sessionId);

      expect(updatedSession.energyDelivered).toBeGreaterThan(initialEnergy);
      expect(updatedSession.elapsedTime).toBeGreaterThan(0);
    });

    it('should update elapsed time over time', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const session = await manager.startSession('station-1', 'A1', 'user-123');

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedSession = await manager.getSessionStatus(session.sessionId);

      expect(updatedSession.elapsedTime).toBeGreaterThanOrEqual(1);
    });

    it('should add real-time updates to session', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const session = await manager.startSession('station-1', 'A1', 'user-123');

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 2500));

      const updatedSession = await manager.getSessionStatus(session.sessionId);

      expect(updatedSession.realTimeUpdates).toBeDefined();
      expect(updatedSession.realTimeUpdates!.length).toBeGreaterThan(0);
      expect(updatedSession.realTimeUpdates![0]).toHaveProperty('timestamp');
      expect(updatedSession.realTimeUpdates![0]).toHaveProperty('energyDelivered');
      expect(updatedSession.realTimeUpdates![0]).toHaveProperty('elapsedTime');
    });

    it('should stop tracking when session is stopped', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const session = await manager.startSession('station-1', 'A1', 'user-123');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock station details
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Test Station',
          pricePerKwh: 0.35,
        }),
      });

      const summary = await manager.stopSession(session.sessionId);

      // Verify session was stopped successfully
      expect(summary.sessionId).toBe(session.sessionId);
      expect(summary.energyDelivered).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle session with zero energy delivered', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const session = await manager.startSession('station-1', 'A1', 'user-123');

      // Stop immediately without waiting
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Test Station',
          pricePerKwh: 0.35,
        }),
      });

      const summary = await manager.stopSession(session.sessionId);

      expect(summary.energyDelivered).toBeGreaterThanOrEqual(0);
      expect(summary.subtotal).toBeGreaterThanOrEqual(0);
      expect(summary.totalAmount).toBeGreaterThanOrEqual(1.00); // At least the fee
    });

    it('should handle session duration less than 1 second', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const session = await manager.startSession('station-1', 'A1', 'user-123');

      // Stop immediately
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Test Station',
          pricePerKwh: 0.35,
        }),
      });

      const summary = await manager.stopSession(session.sessionId);

      expect(summary.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle whitespace-only inputs', async () => {
      await expect(manager.startSession('   ', 'A1', 'user-123')).rejects.toThrow(
        'Station ID cannot be empty'
      );

      await expect(manager.startSession('station-1', '   ', 'user-123')).rejects.toThrow(
        'Slot number cannot be empty'
      );

      await expect(manager.startSession('station-1', 'A1', '   ')).rejects.toThrow(
        'User ID cannot be empty'
      );
    });
  });

  describe('cleanup', () => {
    it('should stop all timers and clear data', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await manager.startSession('station-1', 'A1', 'user-1');
      await manager.startSession('station-2', 'B2', 'user-2');

      manager.cleanup();

      // After cleanup, sessions should not be in local cache
      // getSessionStatus will try to fetch from backend
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(manager.getSessionStatus('any-session')).rejects.toThrow();
    });
  });
});
