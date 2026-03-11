/**
 * Individual parking slot at a charging station
 */
export interface ParkingSlot {
  stationId: string;
  slotNumber: string;
  isAvailable: boolean;
  lastUpdated: Date;
  currentSessionId?: string;
  chargingPower: number; // kW
  connectorType: string;
}

/**
 * Simplified slot status for availability tracking
 */
export interface SlotStatus {
  slotNumber: string;
  isAvailable: boolean;
  lastUpdated: Date;
}
