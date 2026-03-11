import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocationService } from './LocationService';

describe('LocationService', () => {
  let service: LocationService;
  let mockGeolocation: any;

  beforeEach(() => {
    service = new LocationService();
    
    // Create a mock geolocation object
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isGeolocationAvailable', () => {
    it('should return true when geolocation is available', () => {
      // Mock navigator.geolocation
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
        writable: true,
      });

      expect(service.isGeolocationAvailable()).toBe(true);
    });

    it('should return false when geolocation is not available', () => {
      // Save original geolocation
      const originalGeolocation = globalThis.navigator.geolocation;
      
      // Remove geolocation from navigator
      // @ts-ignore - intentionally deleting for test
      delete globalThis.navigator.geolocation;

      expect(service.isGeolocationAvailable()).toBe(false);
      
      // Restore original geolocation
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
        writable: true,
      });
    });
  });

  describe('getCurrentLocation', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });
    });

    it('should return valid coordinates when geolocation succeeds', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const result = await service.getCurrentLocation();

      expect(result).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      });
    });

    it('should throw error when geolocation is not available', async () => {
      // Save original geolocation
      const originalGeolocation = globalThis.navigator.geolocation;
      
      // Remove geolocation from navigator
      // @ts-ignore - intentionally deleting for test
      delete globalThis.navigator.geolocation;

      await expect(service.getCurrentLocation()).rejects.toThrow(
        'Geolocation is not supported by this browser'
      );
      
      // Restore original geolocation
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
        writable: true,
      });
    });

    it('should throw error when permission is denied', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_: any, error: any) => {
        error(mockError);
      });

      await expect(service.getCurrentLocation()).rejects.toThrow(
        'Location access denied'
      );
    });

    it('should throw error when position is unavailable', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_: any, error: any) => {
        error(mockError);
      });

      await expect(service.getCurrentLocation()).rejects.toThrow(
        'Location information is unavailable'
      );
    });

    it('should throw error when request times out', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_: any, error: any) => {
        error(mockError);
      });

      await expect(service.getCurrentLocation()).rejects.toThrow(
        'Location request timed out'
      );
    });

    it('should reject invalid coordinates (latitude out of range)', async () => {
      const mockPosition = {
        coords: {
          latitude: 95, // Invalid: > 90
          longitude: -122.4194,
          accuracy: 10,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      await expect(service.getCurrentLocation()).rejects.toThrow(
        'Invalid coordinates received from geolocation API'
      );
    });

    it('should reject invalid coordinates (longitude out of range)', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -185, // Invalid: < -180
          accuracy: 10,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      await expect(service.getCurrentLocation()).rejects.toThrow(
        'Invalid coordinates received from geolocation API'
      );
    });

    it('should accept coordinates at boundary values', async () => {
      const mockPosition = {
        coords: {
          latitude: 90, // Max valid latitude
          longitude: 180, // Max valid longitude
          accuracy: 10,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const result = await service.getCurrentLocation();

      expect(result.latitude).toBe(90);
      expect(result.longitude).toBe(180);
    });

    it('should accept coordinates at negative boundary values', async () => {
      const mockPosition = {
        coords: {
          latitude: -90, // Min valid latitude
          longitude: -180, // Min valid longitude
          accuracy: 10,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const result = await service.getCurrentLocation();

      expect(result.latitude).toBe(-90);
      expect(result.longitude).toBe(-180);
    });
  });

  describe('setManualLocation', () => {
    it('should throw error for empty address', async () => {
      await expect(service.setManualLocation('')).rejects.toThrow(
        'Address cannot be empty'
      );
    });

    it('should throw error for whitespace-only address', async () => {
      await expect(service.setManualLocation('   ')).rejects.toThrow(
        'Address cannot be empty'
      );
    });

    it('should throw error indicating geocoding service is needed', async () => {
      await expect(service.setManualLocation('123 Main St, San Francisco, CA')).rejects.toThrow(
        'Manual location entry requires geocoding service integration'
      );
    });
  });
});
