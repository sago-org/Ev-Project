import type { Coordinates } from './Coordinates';

/**
 * Operating hours for a charging station
 */
export interface OperatingHours {
  open: string; // HH:MM format
  close: string; // HH:MM format
  is24Hours: boolean;
}

/**
 * Charging station or petrol pump location
 */
export interface Station {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
  distance: number; // in kilometers
  type: 'ev_charging' | 'petrol_pump';
  availableSlots: number;
  totalSlots: number;
  pricePerKwh: number;
  operatingHours?: OperatingHours;
  amenities?: string[];
}
