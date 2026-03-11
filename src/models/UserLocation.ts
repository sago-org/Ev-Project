import type { Coordinates } from './Coordinates';

/**
 * User location with source tracking
 */
export interface UserLocation {
  userId: string;
  coordinates: Coordinates;
  address?: string;
  timestamp: Date;
  source: 'gps' | 'manual' | 'ip';
}
