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
    // Tamil Nadu, India - EV Charging Stations and Petrol Pumps
    if (type === 'ev_charging') {
      return [
        // Chennai
        {
          id: 'ev-1',
          name: 'Tata Power EZ Charge - Anna Salai',
          address: 'Anna Salai, Mount Road, Chennai, Tamil Nadu 600002',
          location: { latitude: 13.0569, longitude: 80.2497 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 4,
          totalSlots: 6,
          pricePerKwh: 12.50,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        {
          id: 'ev-2',
          name: 'Ather Grid - T Nagar',
          address: 'Pondy Bazaar, T Nagar, Chennai, Tamil Nadu 600017',
          location: { latitude: 13.0418, longitude: 80.2341 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 4,
          pricePerKwh: 13.00,
          operatingHours: { is24Hours: false, open: '06:00', close: '22:00' },
        },
        {
          id: 'ev-3',
          name: 'Statiq EV Charging - OMR',
          address: 'Old Mahabalipuram Road, Thoraipakkam, Chennai, Tamil Nadu 600097',
          location: { latitude: 12.9391, longitude: 80.2304 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 6,
          totalSlots: 8,
          pricePerKwh: 11.80,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        {
          id: 'ev-4',
          name: 'ChargeZone - Velachery',
          address: 'Velachery Main Road, Chennai, Tamil Nadu 600042',
          location: { latitude: 12.9750, longitude: 80.2170 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 5,
          totalSlots: 6,
          pricePerKwh: 12.00,
          operatingHours: { is24Hours: false, open: '07:00', close: '23:00' },
        },
        {
          id: 'ev-5',
          name: 'Tata Power - Porur',
          address: 'Mount Poonamallee Road, Porur, Chennai, Tamil Nadu 600116',
          location: { latitude: 13.0358, longitude: 80.1557 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 4,
          totalSlots: 5,
          pricePerKwh: 12.20,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Coimbatore
        {
          id: 'ev-6',
          name: 'Ather Grid - RS Puram',
          address: 'Diwan Bahadur Road, RS Puram, Coimbatore, Tamil Nadu 641002',
          location: { latitude: 11.0015, longitude: 76.9604 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 5,
          pricePerKwh: 11.50,
          operatingHours: { is24Hours: false, open: '06:00', close: '22:00' },
        },
        {
          id: 'ev-7',
          name: 'Statiq - Saibaba Colony',
          address: 'Avinashi Road, Saibaba Colony, Coimbatore, Tamil Nadu 641011',
          location: { latitude: 11.0240, longitude: 76.9630 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 4,
          totalSlots: 6,
          pricePerKwh: 11.80,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Madurai
        {
          id: 'ev-8',
          name: 'Tata Power - Anna Nagar',
          address: 'Anna Nagar, Madurai, Tamil Nadu 625020',
          location: { latitude: 9.9252, longitude: 78.1198 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 4,
          pricePerKwh: 11.00,
          operatingHours: { is24Hours: false, open: '07:00', close: '21:00' },
        },
        {
          id: 'ev-9',
          name: 'ChargeZone - Bypass Road',
          address: 'Madurai Bypass Road, Madurai, Tamil Nadu 625010',
          location: { latitude: 9.9195, longitude: 78.1354 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 5,
          totalSlots: 6,
          pricePerKwh: 11.50,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Trichy
        {
          id: 'ev-10',
          name: 'Ather Grid - Thillai Nagar',
          address: 'Thillai Nagar, Tiruchirappalli, Tamil Nadu 620018',
          location: { latitude: 10.8155, longitude: 78.6869 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 4,
          totalSlots: 5,
          pricePerKwh: 11.20,
          operatingHours: { is24Hours: false, open: '06:00', close: '22:00' },
        },
        // Salem
        {
          id: 'ev-11',
          name: 'Statiq - Cherry Road',
          address: 'Cherry Road, Salem, Tamil Nadu 636007',
          location: { latitude: 11.6643, longitude: 78.1460 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 4,
          pricePerKwh: 11.00,
          operatingHours: { is24Hours: false, open: '07:00', close: '21:00' },
        },
        // Vellore
        {
          id: 'ev-12',
          name: 'Tata Power - Katpadi',
          address: 'Katpadi, Vellore, Tamil Nadu 632007',
          location: { latitude: 12.9698, longitude: 79.1325 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 4,
          totalSlots: 5,
          pricePerKwh: 11.50,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Tirunelveli
        {
          id: 'ev-13',
          name: 'ChargeZone - Palayamkottai',
          address: 'Palayamkottai, Tirunelveli, Tamil Nadu 627002',
          location: { latitude: 8.7289, longitude: 77.7085 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 4,
          pricePerKwh: 10.80,
          operatingHours: { is24Hours: false, open: '07:00', close: '21:00' },
        },
        // Erode
        {
          id: 'ev-14',
          name: 'Ather Grid - Perundurai Road',
          address: 'Perundurai Road, Erode, Tamil Nadu 638011',
          location: { latitude: 11.3410, longitude: 77.7172 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 3,
          totalSlots: 5,
          pricePerKwh: 11.00,
          operatingHours: { is24Hours: false, open: '06:00', close: '22:00' },
        },
        // Thanjavur
        {
          id: 'ev-15',
          name: 'Statiq - Medical College Road',
          address: 'Medical College Road, Thanjavur, Tamil Nadu 613004',
          location: { latitude: 10.7870, longitude: 79.1378 },
          distance: 0,
          type: 'ev_charging',
          availableSlots: 2,
          totalSlots: 3,
          pricePerKwh: 11.00,
          operatingHours: { is24Hours: false, open: '07:00', close: '21:00' },
        },
      ];
    } else {
      return [
        // Chennai
        {
          id: 'petrol-1',
          name: 'Indian Oil Petrol Pump - Anna Salai',
          address: 'Anna Salai, Chennai, Tamil Nadu 600002',
          location: { latitude: 13.0525, longitude: 80.2511 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 8,
          totalSlots: 12,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        {
          id: 'petrol-2',
          name: 'Bharat Petroleum - OMR',
          address: 'Old Mahabalipuram Road, Chennai, Tamil Nadu 600096',
          location: { latitude: 12.9450, longitude: 80.2350 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 10,
          totalSlots: 14,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        {
          id: 'petrol-3',
          name: 'HP Petrol Pump - Porur',
          address: 'Mount Poonamallee Road, Porur, Chennai, Tamil Nadu 600116',
          location: { latitude: 13.0380, longitude: 80.1520 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 6,
          totalSlots: 10,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        {
          id: 'petrol-4',
          name: 'Indian Oil - Velachery',
          address: 'Velachery Main Road, Chennai, Tamil Nadu 600042',
          location: { latitude: 12.9800, longitude: 80.2200 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 7,
          totalSlots: 10,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Coimbatore
        {
          id: 'petrol-5',
          name: 'Bharat Petroleum - Avinashi Road',
          address: 'Avinashi Road, Coimbatore, Tamil Nadu 641018',
          location: { latitude: 11.0270, longitude: 76.9670 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 8,
          totalSlots: 12,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        {
          id: 'petrol-6',
          name: 'HP Petrol Pump - Gandhipuram',
          address: 'Gandhipuram, Coimbatore, Tamil Nadu 641012',
          location: { latitude: 11.0168, longitude: 76.9558 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 6,
          totalSlots: 10,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Madurai
        {
          id: 'petrol-7',
          name: 'Indian Oil - Bypass Road',
          address: 'Madurai Bypass Road, Madurai, Tamil Nadu 625010',
          location: { latitude: 9.9220, longitude: 78.1380 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 7,
          totalSlots: 10,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        {
          id: 'petrol-8',
          name: 'Bharat Petroleum - Anna Nagar',
          address: 'Anna Nagar, Madurai, Tamil Nadu 625020',
          location: { latitude: 9.9280, longitude: 78.1220 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 6,
          totalSlots: 8,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Trichy
        {
          id: 'petrol-9',
          name: 'HP Petrol Pump - Thillai Nagar',
          address: 'Thillai Nagar, Tiruchirappalli, Tamil Nadu 620018',
          location: { latitude: 10.8180, longitude: 78.6900 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 8,
          totalSlots: 12,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Salem
        {
          id: 'petrol-10',
          name: 'Indian Oil - Cherry Road',
          address: 'Cherry Road, Salem, Tamil Nadu 636007',
          location: { latitude: 11.6670, longitude: 78.1490 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 6,
          totalSlots: 10,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Vellore
        {
          id: 'petrol-11',
          name: 'Bharat Petroleum - Katpadi',
          address: 'Katpadi, Vellore, Tamil Nadu 632007',
          location: { latitude: 12.9720, longitude: 79.1350 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 7,
          totalSlots: 10,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
        // Tirunelveli
        {
          id: 'petrol-12',
          name: 'HP Petrol Pump - Palayamkottai',
          address: 'Palayamkottai, Tirunelveli, Tamil Nadu 627002',
          location: { latitude: 8.7310, longitude: 77.7110 },
          distance: 0,
          type: 'petrol_pump',
          availableSlots: 5,
          totalSlots: 8,
          pricePerKwh: 0,
          operatingHours: { is24Hours: true, open: '', close: '' },
        },
      ];
    }
  }
}
