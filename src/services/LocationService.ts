import { Coordinates } from '../models/Coordinates';

/**
 * Service for handling user location detection and validation
 */
export class LocationService {
  /**
   * Check if geolocation is available in the browser
   */
  isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get the user's current location using the browser Geolocation API
   * @throws Error if geolocation is not available or permission is denied
   */
  async getCurrentLocation(): Promise<Coordinates> {
    if (!this.isGeolocationAvailable()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          // Validate coordinates
          if (!this.validateCoordinates(coords)) {
            reject(new Error('Invalid coordinates received from geolocation API'));
            return;
          }

          resolve(coords);
        },
        (error) => {
          // Map geolocation errors to user-friendly messages
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions or enter your location manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please try again or enter your location manually.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again or enter your location manually.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting your location.';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Set location manually using an address (placeholder for geocoding)
   * In a real implementation, this would use a geocoding service to convert address to coordinates
   * @param address The address to convert to coordinates
   */
  async setManualLocation(address: string): Promise<Coordinates> {
    if (!address || address.trim().length === 0) {
      throw new Error('Address cannot be empty');
    }

    // TODO: Implement actual geocoding service integration
    // For now, this is a placeholder that would need to call a geocoding API
    // like Google Maps Geocoding API, Mapbox, or OpenStreetMap Nominatim
    throw new Error('Manual location entry requires geocoding service integration');
  }

  /**
   * Validate that coordinates are within valid ranges
   * Latitude: -90 to 90
   * Longitude: -180 to 180
   */
  private validateCoordinates(coords: Coordinates): boolean {
    return (
      coords.latitude >= -90 &&
      coords.latitude <= 90 &&
      coords.longitude >= -180 &&
      coords.longitude <= 180
    );
  }
}
