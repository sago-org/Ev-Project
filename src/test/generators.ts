/**
 * Custom generators for property-based testing with fast-check
 * These generators create realistic test data for the EV Charging Station Finder
 */
import * as fc from 'fast-check';
import type {
  Coordinates,
  Station,
  ChargingSession,
  PaymentInfo,
  ParkingSlot,
  SlotStatus,
} from '@/models';

/**
 * Generate valid geographic coordinates
 * Latitude: -90 to 90, Longitude: -180 to 180
 */
export const coordinateGen = fc.record({
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  accuracy: fc.option(fc.double({ min: 0, max: 1000, noNaN: true })),
}) as fc.Arbitrary<Coordinates>;

/**
 * Generate a realistic charging station
 */
export const stationGen = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    address: fc.string({ minLength: 10, maxLength: 200 }),
    location: coordinateGen,
    distance: fc.double({ min: 0, max: 10, noNaN: true }),
    type: fc.constantFrom('ev_charging' as const, 'petrol_pump' as const),
    availableSlots: fc.nat({ max: 50 }),
    totalSlots: fc.nat({ max: 50 }),
    pricePerKwh: fc.double({ min: 0.1, max: 2.0, noNaN: true }),
  })
  .map((station) => ({
    ...station,
    // Ensure availableSlots <= totalSlots
    availableSlots: Math.min(station.availableSlots, station.totalSlots),
  })) as fc.Arbitrary<Station>;

/**
 * Generate a charging session
 */
export const sessionGen = fc.record({
  sessionId: fc.uuid(),
  stationId: fc.uuid(),
  slotNumber: fc.string({ minLength: 1, maxLength: 10 }),
  userId: fc.uuid(),
  startTime: fc.date(),
  status: fc.constantFrom('active' as const, 'stopped' as const),
  energyDelivered: fc.double({ min: 0, max: 100, noNaN: true }),
  elapsedTime: fc.nat({ max: 7200 }), // up to 2 hours
}) as fc.Arbitrary<ChargingSession>;

/**
 * Generate payment amount (positive, non-zero)
 */
export const paymentAmountGen = fc.double({
  min: 0.01,
  max: 1000.0,
  noNaN: true,
});

/**
 * Generate payment information
 */
export const paymentInfoGen = fc.record({
  amount: paymentAmountGen,
  currency: fc.constantFrom('USD', 'EUR', 'GBP'),
  merchantId: fc.uuid(),
  transactionReference: fc.uuid(),
  sessionId: fc.uuid(),
}) as fc.Arbitrary<PaymentInfo>;

/**
 * Generate a parking slot
 */
export const parkingSlotGen = fc.record({
  stationId: fc.uuid(),
  slotNumber: fc.string({ minLength: 1, maxLength: 10 }),
  isAvailable: fc.boolean(),
  lastUpdated: fc.date(),
  currentSessionId: fc.option(fc.uuid()),
  chargingPower: fc.double({ min: 7, max: 350, noNaN: true }), // 7kW to 350kW
  connectorType: fc.constantFrom('Type 1', 'Type 2', 'CCS', 'CHAdeMO'),
}) as fc.Arbitrary<ParkingSlot>;

/**
 * Generate slot status
 */
export const slotStatusGen = fc.record({
  slotNumber: fc.string({ minLength: 1, maxLength: 10 }),
  isAvailable: fc.boolean(),
  lastUpdated: fc.date(),
}) as fc.Arbitrary<SlotStatus>;

/**
 * Generate an array of stations within a radius
 */
export const stationsWithinRadiusGen = (
  maxDistanceKm: number
): fc.Arbitrary<Station[]> => {
  return fc.array(
    stationGen.map((station) => ({
      ...station,
      distance: Math.min(station.distance, maxDistanceKm),
    })),
    { minLength: 0, maxLength: 20 }
  );
};

/**
 * Generate a non-empty array of stations
 */
export const nonEmptyStationsGen = fc.array(stationGen, {
  minLength: 1,
  maxLength: 20,
});
