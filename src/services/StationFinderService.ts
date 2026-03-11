import type { Coordinates, Station } from '../models';

/**
 * Service for finding EV charging stations and petrol pumps
 * Handles station search, distance calculation, and fallback logic
 */
export class StationFinderService {
  /**
   * Find EV charging stations within specified radius
   * @param location User's current location
   * @param radiusKm Search radius in kilometers (default: 10)
   * @returns Promise resolving to array of stations sorted by distance
   */
  async findChargingStations(
    location: Coordinates,
    radiusKm: number = 10
  ): Promise<Station[]> {
    // TODO: Replace with actual API call
    const mockStations = await this.fetchMockStations('ev_charging');
    
    // Filter stations within radius and calculate distances
    const stationsWithDistance = mockStations
      .map(station => ({
        ...station,
        distance: this.calculateDistance(location, station.location)
      }))
      .filter(station => station.distance <= radiusKm);
    
    // Sort by distance
    return this.sortByDistance(stationsWithDistance);
  }

  /**
   * Find petrol pumps as fallback when no EV stations available
   * @param location User's current location
   * @param radiusKm Search radius in kilometers (default: 10)
   * @returns Promise resolving to array of petrol pumps sorted by distance
   */
  async findPetrolPumps(
    location: Coordinates,
    radiusKm: number = 10
  ): Promise<Station[]> {
    // TODO: Replace with actual API call
    const mockPetrolPumps = await this.fetchMockStations('petrol_pump');
    
    // Filter petrol pumps within radius and calculate distances
    const pumpsWithDistance = mockPetrolPumps
      .map(pump => ({
        ...pump,
        distance: this.calculateDistance(location, pump.location)
      }))
      .filter(pump => pump.distance <= radiusKm);
    
    // Sort by distance
    return this.sortByDistance(pumpsWithDistance);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param from Starting coordinates
   * @param to Destination coordinates
   * @returns Distance in kilometers
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    
    // Convert degrees to radians
    const lat1Rad = this.toRadians(from.latitude);
    const lat2Rad = this.toRadians(to.latitude);
    const deltaLatRad = this.toRadians(to.latitude - from.latitude);
    const deltaLonRad = this.toRadians(to.longitude - from.longitude);
    
    // Haversine formula
    const a = 
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c;
    
    // Round to 2 decimal places
    return Math.round(distance * 100) / 100;
  }

  /**
   * Sort stations by distance in ascending order
   * @param stations Array of stations with distance property
   * @returns Sorted array of stations
   */
  private sortByDistance(stations: Station[]): Station[] {
    return stations.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Convert degrees to radians
   * @param degrees Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Mock data fetcher - to be replaced with actual API call
   * @param type Station type to fetch
   * @returns Promise resolving to mock station data
   */
  private async fetchMockStations(
    type: 'ev_charging' | 'petrol_pump'
  ): Promise<Station[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock data based on type
    if (type === 'ev_charging') {
      return [
        {
          id: 'ev-1',
          name: 'ChargePoint Station',
          address: '123 Main St, City',
          location: { latitude: 37.7749, longitude: -122.4194 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 5,
          pricePerKwh: 0.35,
        },
        {
          id: 'ev-2',
          name: 'Tesla Supercharger',
          address: '456 Oak Ave, City',
          location: { latitude: 37.7849, longitude: -122.4094 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 8,
          totalSlots: 12,
          pricePerKwh: 0.28,
        },
      ];
    } else {
      return [
        {
          id: 'petrol-1',
          name: 'Shell Gas Station',
          address: '789 Elm St, City',
          location: { latitude: 37.7649, longitude: -122.4294 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 6,
          totalSlots: 8,
          pricePerKwh: 0,
        },
        {
          id: 'petrol-2',
          name: 'Chevron Station',
          address: '321 Pine Rd, City',
          location: { latitude: 37.7549, longitude: -122.4394 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 4,
          totalSlots: 6,
          pricePerKwh: 0,
        },
      ];
    }
  }
}
