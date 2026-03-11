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
    // Note: In production, this would call a real API with the user's location
    // For demo purposes, we generate stations near common locations
    if (type === 'ev_charging') {
      return [
        // San Francisco Bay Area
        {
          id: 'ev-1',
          name: 'ChargePoint Station',
          address: '123 Main St, San Francisco, CA',
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
          address: '456 Oak Ave, San Francisco, CA',
          location: { latitude: 37.7849, longitude: -122.4094 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 8,
          totalSlots: 12,
          pricePerKwh: 0.28,
        },
        // New York
        {
          id: 'ev-3',
          name: 'EVgo Fast Charging',
          address: '789 Broadway, New York, NY',
          location: { latitude: 40.7128, longitude: -74.0060 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 4,
          totalSlots: 6,
          pricePerKwh: 0.42,
        },
        // Los Angeles
        {
          id: 'ev-4',
          name: 'Electrify America',
          address: '321 Sunset Blvd, Los Angeles, CA',
          location: { latitude: 34.0522, longitude: -118.2437 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 6,
          totalSlots: 10,
          pricePerKwh: 0.38,
        },
        // London
        {
          id: 'ev-5',
          name: 'BP Pulse Charging',
          address: '100 Oxford St, London, UK',
          location: { latitude: 51.5074, longitude: -0.1278 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 5,
          totalSlots: 8,
          pricePerKwh: 0.45,
        },
        // India - Chennai
        {
          id: 'ev-6',
          name: 'Tata Power Charging Station',
          address: 'Anna Salai, Chennai, India',
          location: { latitude: 13.0827, longitude: 80.2707 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 4,
          totalSlots: 6,
          pricePerKwh: 0.15,
        },
        // India - Mumbai
        {
          id: 'ev-7',
          name: 'Ather Grid Charging',
          address: 'Marine Drive, Mumbai, India',
          location: { latitude: 19.0760, longitude: 72.8777 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 5,
          pricePerKwh: 0.18,
        },
        // India - Bangalore
        {
          id: 'ev-8',
          name: 'Statiq EV Charging',
          address: 'MG Road, Bangalore, India',
          location: { latitude: 12.9716, longitude: 77.5946 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 6,
          totalSlots: 8,
          pricePerKwh: 0.16,
        },
      ];
    } else {
      return [
        // San Francisco Bay Area
        {
          id: 'petrol-1',
          name: 'Shell Gas Station',
          address: '789 Elm St, San Francisco, CA',
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
          address: '321 Pine Rd, San Francisco, CA',
          location: { latitude: 37.7549, longitude: -122.4394 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 4,
          totalSlots: 6,
          pricePerKwh: 0,
        },
        // New York
        {
          id: 'petrol-3',
          name: 'Exxon Station',
          address: '456 5th Ave, New York, NY',
          location: { latitude: 40.7228, longitude: -74.0160 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 5,
          totalSlots: 8,
          pricePerKwh: 0,
        },
        // Los Angeles
        {
          id: 'petrol-4',
          name: 'Mobil Gas Station',
          address: '789 Hollywood Blvd, Los Angeles, CA',
          location: { latitude: 34.0622, longitude: -118.2537 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 7,
          totalSlots: 10,
          pricePerKwh: 0,
        },
        // India - Chennai
        {
          id: 'petrol-5',
          name: 'Indian Oil Petrol Pump',
          address: 'Mount Road, Chennai, India',
          location: { latitude: 13.0727, longitude: 80.2607 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 8,
          totalSlots: 12,
          pricePerKwh: 0,
        },
        // India - Mumbai
        {
          id: 'petrol-6',
          name: 'Bharat Petroleum',
          address: 'Linking Road, Mumbai, India',
          location: { latitude: 19.0660, longitude: 72.8677 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 6,
          totalSlots: 10,
          pricePerKwh: 0,
        },
        // India - Bangalore
        {
          id: 'petrol-7',
          name: 'HP Petrol Pump',
          address: 'Brigade Road, Bangalore, India',
          location: { latitude: 12.9616, longitude: 77.5846 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 5,
          totalSlots: 8,
          pricePerKwh: 0,
        },
      ];
    }
  }
}
