import { describe, it, expect, beforeEach } from 'vitest';
import { StationFinderService } from './StationFinderService';
import type { Coordinates } from '../models';

describe('StationFinderService', () => {
  let service: StationFinderService;
  const userLocation: Coordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  beforeEach(() => {
    service = new StationFinderService();
  });

  describe('findChargingStations', () => {
    it('should return EV charging stations within radius', async () => {
      const stations = await service.findChargingStations(userLocation, 10);
      
      expect(stations).toBeDefined();
      expect(Array.isArray(stations)).toBe(true);
      
      // All stations should be EV charging type
      stations.forEach(station => {
        expect(station.type).toBe('ev_charging');
      });
    });

    it('should calculate distance for each station', async () => {
      const stations = await service.findChargingStations(userLocation, 10);
      
      // All stations should have a distance property
      stations.forEach(station => {
        expect(station.distance).toBeDefined();
        expect(typeof station.distance).toBe('number');
        expect(station.distance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should filter stations within specified radius', async () => {
      const radius = 5;
      const stations = await service.findChargingStations(userLocation, radius);
      
      // All stations should be within the specified radius
      stations.forEach(station => {
        expect(station.distance).toBeLessThanOrEqual(radius);
      });
    });

    it('should sort stations by distance in ascending order', async () => {
      const stations = await service.findChargingStations(userLocation, 10);
      
      // Check if sorted by distance
      for (let i = 1; i < stations.length; i++) {
        expect(stations[i]?.distance).toBeGreaterThanOrEqual(stations[i - 1]?.distance ?? 0);
      }
    });

    it('should return empty array when no stations within radius', async () => {
      // Use a location far from mock stations with very small radius
      const remoteLocation: Coordinates = {
        latitude: 0,
        longitude: 0,
      };
      const stations = await service.findChargingStations(remoteLocation, 0.1);
      
      expect(stations).toEqual([]);
    });
  });

  describe('findPetrolPumps', () => {
    it('should return petrol pump stations within radius', async () => {
      const pumps = await service.findPetrolPumps(userLocation, 10);
      
      expect(pumps).toBeDefined();
      expect(Array.isArray(pumps)).toBe(true);
      
      // All stations should be petrol pump type
      pumps.forEach(pump => {
        expect(pump.type).toBe('petrol_pump');
      });
    });

    it('should calculate distance for each petrol pump', async () => {
      const pumps = await service.findPetrolPumps(userLocation, 10);
      
      // All pumps should have a distance property
      pumps.forEach(pump => {
        expect(pump.distance).toBeDefined();
        expect(typeof pump.distance).toBe('number');
        expect(pump.distance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should filter petrol pumps within specified radius', async () => {
      const radius = 5;
      const pumps = await service.findPetrolPumps(userLocation, radius);
      
      // All pumps should be within the specified radius
      pumps.forEach(pump => {
        expect(pump.distance).toBeLessThanOrEqual(radius);
      });
    });

    it('should sort petrol pumps by distance in ascending order', async () => {
      const pumps = await service.findPetrolPumps(userLocation, 10);
      
      // Check if sorted by distance
      for (let i = 1; i < pumps.length; i++) {
        expect(pumps[i]?.distance).toBeGreaterThanOrEqual(pumps[i - 1]?.distance ?? 0);
      }
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates using Haversine formula', () => {
      const from: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const to: Coordinates = { latitude: 37.7849, longitude: -122.4094 };
      
      const distance = service.calculateDistance(from, to);
      
      expect(distance).toBeDefined();
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    it('should return 0 for same coordinates', () => {
      const location: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      
      const distance = service.calculateDistance(location, location);
      
      expect(distance).toBe(0);
    });

    it('should handle coordinates at poles', () => {
      const northPole: Coordinates = { latitude: 90, longitude: 0 };
      const southPole: Coordinates = { latitude: -90, longitude: 0 };
      
      const distance = service.calculateDistance(northPole, southPole);
      
      // Distance between poles should be approximately half Earth's circumference
      expect(distance).toBeGreaterThan(20000);
      expect(distance).toBeLessThan(20100);
    });

    it('should handle coordinates at date line', () => {
      const west: Coordinates = { latitude: 0, longitude: -179 };
      const east: Coordinates = { latitude: 0, longitude: 179 };
      
      const distance = service.calculateDistance(west, east);
      
      // Should calculate shortest distance across date line
      expect(distance).toBeDefined();
      expect(distance).toBeGreaterThan(0);
    });

    it('should return distance rounded to 2 decimal places', () => {
      const from: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const to: Coordinates = { latitude: 37.7750, longitude: -122.4195 };
      
      const distance = service.calculateDistance(from, to);
      
      // Check that result has at most 2 decimal places
      const decimalPlaces = (distance.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should handle negative coordinates', () => {
      const from: Coordinates = { latitude: -33.8688, longitude: 151.2093 }; // Sydney
      const to: Coordinates = { latitude: -37.8136, longitude: 144.9631 }; // Melbourne
      
      const distance = service.calculateDistance(from, to);
      
      // Distance between Sydney and Melbourne is approximately 714 km
      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(750);
    });

    it('should be symmetric (distance A to B equals B to A)', () => {
      const locationA: Coordinates = { latitude: 37.7749, longitude: -122.4194 };
      const locationB: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      
      const distanceAB = service.calculateDistance(locationA, locationB);
      const distanceBA = service.calculateDistance(locationB, locationA);
      
      expect(distanceAB).toBe(distanceBA);
    });
  });

  describe('integration scenarios', () => {
    it('should handle workflow: search EV stations, then fallback to petrol pumps', async () => {
      // First try EV stations
      const evStations = await service.findChargingStations(userLocation, 10);
      
      // If no EV stations, search for petrol pumps
      let results = evStations;
      if (results.length === 0) {
        results = await service.findPetrolPumps(userLocation, 10);
      }
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very small radius', async () => {
      const stations = await service.findChargingStations(userLocation, 0.001);
      
      expect(Array.isArray(stations)).toBe(true);
      // May be empty or have very close stations
    });

    it('should handle very large radius', async () => {
      const stations = await service.findChargingStations(userLocation, 1000);
      
      expect(Array.isArray(stations)).toBe(true);
      // Should include all mock stations
    });
  });
});
