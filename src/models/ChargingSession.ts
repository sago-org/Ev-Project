/**
 * Real-time update during a charging session
 */
export interface SessionUpdate {
  timestamp: Date;
  energyDelivered: number;
  elapsedTime: number;
}

/**
 * Active or completed charging session
 */
export interface ChargingSession {
  sessionId: string;
  stationId: string;
  slotNumber: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'stopped' | 'cancelled';
  energyDelivered: number; // kWh
  elapsedTime: number; // seconds
  realTimeUpdates?: SessionUpdate[];
}

/**
 * Summary of a completed charging session with cost breakdown
 */
export interface ChargingSessionSummary {
  sessionId: string;
  stationName: string;
  slotNumber: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  energyDelivered: number; // kWh
  pricePerKwh: number;
  subtotal: number;
  taxes: number;
  fees: number;
  totalAmount: number;
}
