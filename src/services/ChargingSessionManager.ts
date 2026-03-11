import type { ChargingSession, ChargingSessionSummary } from '../models';

/**
 * Service for managing charging session lifecycle
 * Handles session creation, tracking, termination, and cost calculation
 * Singleton pattern to ensure session persistence across component re-renders
 */
export class ChargingSessionManager {
  private static instance: ChargingSessionManager | null = null;
  private activeSessions: Map<string, ChargingSession> = new Map();
  private sessionTimers: Map<string, number> = new Map();
  private readonly UPDATE_INTERVAL = 1000; // Update every second

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of ChargingSessionManager
   */
  public static getInstance(): ChargingSessionManager {
    if (!ChargingSessionManager.instance) {
      ChargingSessionManager.instance = new ChargingSessionManager();
    }
    return ChargingSessionManager.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes)
   */
  public static resetInstance(): void {
    if (ChargingSessionManager.instance) {
      ChargingSessionManager.instance.cleanup();
      ChargingSessionManager.instance = null;
    }
  }

  /**
   * Start a new charging session
   * @param stationId The station ID where charging is taking place
   * @param slotNumber The parking slot number
   * @param userId The user ID starting the session
   * @returns Promise resolving to the created charging session
   */
  async startSession(
    stationId: string,
    slotNumber: string,
    userId: string
  ): Promise<ChargingSession> {
    // Validate inputs
    if (!stationId || stationId.trim().length === 0) {
      throw new Error('Station ID cannot be empty');
    }

    if (!slotNumber || slotNumber.trim().length === 0) {
      throw new Error('Slot number cannot be empty');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    // Generate unique session ID
    const sessionId = this.generateSessionId();

    // Create new session
    const session: ChargingSession = {
      sessionId,
      stationId,
      slotNumber,
      userId,
      startTime: new Date(),
      status: 'active',
      energyDelivered: 0,
      elapsedTime: 0,
      realTimeUpdates: [],
    };

    // Store session
    this.activeSessions.set(sessionId, session);

    // Start real-time tracking
    this.startSessionTracking(sessionId);

    // For demo: No backend persistence needed
    return session;
  }

  /**
   * Get current session status with real-time data
   * For demo: Returns from local cache only (no API call)
   * @param sessionId The session ID to retrieve
   * @returns Promise resolving to the current session state
   */
  async getSessionStatus(sessionId: string): Promise<ChargingSession> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('Session ID cannot be empty');
    }

    // Check local cache
    const localSession = this.activeSessions.get(sessionId);
    if (localSession) {
      return { ...localSession };
    }

    // For demo: Session not found in local cache
    throw new Error('Session not found');
  }

  /**
   * Stop a charging session and calculate final costs
   * @param sessionId The session ID to stop
   * @returns Promise resolving to the session summary with cost breakdown
   */
  async stopSession(sessionId: string): Promise<ChargingSessionSummary> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('Session ID cannot be empty');
    }

    // Get the active session
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found or already stopped');
    }

    if (session.status !== 'active') {
      throw new Error(`Cannot stop session with status: ${session.status}`);
    }

    // Stop tracking FIRST to prevent race conditions
    this.stopSessionTracking(sessionId);

    // Update session status
    const endTime = new Date();
    session.status = 'stopped';
    session.endTime = endTime;

    // Calculate final duration
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    session.elapsedTime = duration;

    // Fetch station details for pricing
    const stationDetails = await this.fetchStationDetails(session.stationId);

    // Calculate costs
    const subtotal = this.calculateCost(
      session.energyDelivered,
      stationDetails.pricePerKwh
    );

    // Calculate taxes and fees (example: 10% tax, $1 service fee)
    const taxes = Math.round(subtotal * 0.10 * 100) / 100;
    const fees = 1.00;
    const totalAmount = Math.round((subtotal + taxes + fees) * 100) / 100;

    // Create session summary
    const summary: ChargingSessionSummary = {
      sessionId: session.sessionId,
      stationName: stationDetails.name,
      slotNumber: session.slotNumber,
      startTime: session.startTime,
      endTime,
      duration,
      energyDelivered: session.energyDelivered,
      pricePerKwh: stationDetails.pricePerKwh,
      subtotal,
      taxes,
      fees,
      totalAmount,
    };

    // Remove from active sessions LAST to allow any pending getSessionStatus calls to complete
    this.activeSessions.delete(sessionId);

    // For demo: No backend persistence needed
    return summary;
  }

  /**
   * Calculate session cost based on energy and pricing
   * Formula: energy × pricePerKwh
   * @param energyKwh Energy delivered in kilowatt-hours
   * @param pricePerKwh Price per kilowatt-hour
   * @returns Calculated cost (subtotal before taxes and fees)
   */
  calculateCost(energyKwh: number, pricePerKwh: number): number {
    if (energyKwh < 0) {
      throw new Error('Energy cannot be negative');
    }

    if (pricePerKwh < 0) {
      throw new Error('Price per kWh cannot be negative');
    }

    const cost = energyKwh * pricePerKwh;

    // Round to 2 decimal places
    return Math.round(cost * 100) / 100;
  }

  /**
   * Start real-time session tracking
   * Updates energy delivered and elapsed time periodically
   */
  private startSessionTracking(sessionId: string): void {
    const intervalId = setInterval(() => {
      const session = this.activeSessions.get(sessionId);
      if (!session || session.status !== 'active') {
        this.stopSessionTracking(sessionId);
        return;
      }

      // Update elapsed time
      const now = new Date();
      session.elapsedTime = Math.floor(
        (now.getTime() - session.startTime.getTime()) / 1000
      );

      // Simulate energy delivery (in production, this would come from hardware)
      // Average charging rate: ~7 kW, so ~0.002 kWh per second
      session.energyDelivered = Math.round(
        (session.energyDelivered + 0.002) * 1000
      ) / 1000;

      // Add real-time update
      if (!session.realTimeUpdates) {
        session.realTimeUpdates = [];
      }
      session.realTimeUpdates.push({
        timestamp: now,
        energyDelivered: session.energyDelivered,
        elapsedTime: session.elapsedTime,
      });

      // Keep only last 100 updates to prevent memory issues
      if (session.realTimeUpdates.length > 100) {
        session.realTimeUpdates = session.realTimeUpdates.slice(-100);
      }
    }, this.UPDATE_INTERVAL);

    this.sessionTimers.set(sessionId, intervalId as unknown as number);
  }

  /**
   * Stop real-time session tracking
   */
  private stopSessionTracking(sessionId: string): void {
    const intervalId = this.sessionTimers.get(sessionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.sessionTimers.delete(sessionId);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Fetch station details including pricing
   * For demo: Uses mock data from StationFinderService
   */
  private async fetchStationDetails(stationId: string): Promise<{
    name: string;
    pricePerKwh: number;
  }> {
    // Mock station data (matches StationFinderService)
    const mockStations: Record<string, { name: string; pricePerKwh: number }> = {
      'ev-1': { name: 'Chennai - Anna Salai EV Hub', pricePerKwh: 12.50 },
      'ev-2': { name: 'Chennai - T Nagar Charging Point', pricePerKwh: 11.80 },
      'ev-3': { name: 'Chennai - OMR Tech Park Station', pricePerKwh: 13.00 },
      'ev-4': { name: 'Chennai - Velachery EV Center', pricePerKwh: 12.00 },
      'ev-5': { name: 'Chennai - Porur Charging Hub', pricePerKwh: 11.50 },
      'ev-6': { name: 'Coimbatore - RS Puram EV Center', pricePerKwh: 11.00 },
      'ev-7': { name: 'Coimbatore - Saibaba Colony Station', pricePerKwh: 10.80 },
      'ev-8': { name: 'Madurai - Anna Nagar Charging Hub', pricePerKwh: 11.20 },
      'ev-9': { name: 'Madurai - Bypass Road EV Point', pricePerKwh: 11.50 },
      'ev-10': { name: 'Tiruchirappalli - Central EV Station', pricePerKwh: 11.80 },
      'ev-11': { name: 'Salem - Steel Plant Road Charging', pricePerKwh: 11.00 },
      'ev-12': { name: 'Vellore - Fort Area EV Hub', pricePerKwh: 11.50 },
      'ev-13': { name: 'Tirunelveli - Junction Charging Point', pricePerKwh: 10.80 },
      'ev-14': { name: 'Erode - Perundurai Road Station', pricePerKwh: 11.20 },
      'ev-15': { name: 'Thanjavur - Big Temple EV Center', pricePerKwh: 11.00 },
    };

    const station = mockStations[stationId];
    if (station) {
      return station;
    }

    // Fallback for unknown stations
    return {
      name: 'Unknown Station',
      pricePerKwh: 12.00,
    };
  }

  /**
   * Clean up all active sessions (for testing or shutdown)
   */
  cleanup(): void {
    // Stop all timers
    this.sessionTimers.forEach((intervalId) => {
      clearInterval(intervalId);
    });

    // Clear all data
    this.activeSessions.clear();
    this.sessionTimers.clear();
  }
}
