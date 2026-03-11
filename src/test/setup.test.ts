import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { coordinateGen, stationGen, sessionGen } from './generators';

describe('Testing Setup', () => {
  it('should have vitest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have fast-check available', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n;
      })
    );
  });

  it('should generate valid coordinates', () => {
    fc.assert(
      fc.property(coordinateGen, (coord) => {
        return (
          coord.latitude >= -90 &&
          coord.latitude <= 90 &&
          coord.longitude >= -180 &&
          coord.longitude <= 180
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid stations', () => {
    fc.assert(
      fc.property(stationGen, (station) => {
        return (
          station.id.length > 0 &&
          station.availableSlots <= station.totalSlots &&
          station.distance >= 0 &&
          station.pricePerKwh > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid charging sessions', () => {
    fc.assert(
      fc.property(sessionGen, (session) => {
        return (
          session.sessionId.length > 0 &&
          session.energyDelivered >= 0 &&
          session.elapsedTime >= 0 &&
          (session.status === 'active' || session.status === 'stopped')
        );
      }),
      { numRuns: 100 }
    );
  });
});
