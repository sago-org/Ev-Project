# Design Document: EV Charging Station Finder

## Overview

The EV Charging Station Finder is a web-based application that provides a complete workflow for electric vehicle owners to discover, reserve, and pay for charging services. The system integrates location services, real-time availability tracking, charging session management, and payment processing into a seamless user experience.

The architecture follows a component-based design with clear separation between the presentation layer (UI components), business logic layer (service components), and data layer (state management and external APIs). The system is designed to be responsive, real-time, and fault-tolerant with graceful fallback mechanisms.

Key design principles:
- Real-time data synchronization for parking slot availability
- Graceful degradation when EV stations are unavailable
- Secure payment processing with QR code generation
- Comprehensive session tracking and receipt generation
- Mobile-first responsive design

## Architecture

The system follows a layered architecture with the following components:

### Presentation Layer
- **Landing Page Component**: Entry point for users to initiate station search
- **Station List Component**: Displays nearby charging stations with availability
- **Station Detail Component**: Shows detailed information and parking slot grid
- **Charging Session Component**: Real-time charging status display
- **Payment Component**: QR code display and payment confirmation
- **Receipt Component**: Receipt generation and download interface

### Business Logic Layer
- **Location Service**: Handles geolocation detection and manual location entry
- **Station Finder Service**: Searches for charging stations and fallback petrol pumps
- **Availability Service**: Manages real-time parking slot status updates
- **Charging Session Manager**: Tracks charging sessions and calculates costs
- **Payment Gateway Service**: Generates QR codes and processes payments
- **Receipt Generator Service**: Creates PDF receipts with session details

### Data Layer
- **Station Repository**: Interfaces with charging station database/API
- **Session Store**: Maintains active and historical charging sessions
- **Payment Store**: Records payment transactions and status
- **User Location Store**: Caches user location data

### External Integrations
- **Geolocation API**: Browser-based location detection
- **Charging Station API**: Third-party or proprietary station database
- **Payment Gateway API**: QR code generation and payment verification
- **PDF Generation Library**: Receipt document creation

### Data Flow

1. User initiates location detection → Location Service → Geolocation API
2. Location obtained → Station Finder Service → Charging Station API
3. Stations displayed → User selects station → Station Detail Component
4. User starts charging → Charging Session Manager → Availability Service
5. Real-time updates → Availability Service → Station Detail Component
6. User stops charging → Charging Session Manager calculates cost
7. Payment initiated → Payment Gateway Service → QR code displayed
8. Payment completed → Receipt Generator Service → PDF download

## Components and Interfaces

### Location Service

**Responsibilities:**
- Detect user's geographic coordinates using browser geolocation
- Handle location permission requests and denials
- Provide manual location entry fallback
- Validate and normalize location data

**Interface:**
```typescript
interface LocationService {
  // Request user's current location
  getCurrentLocation(): Promise<Coordinates>;
  
  // Handle manual location entry
  setManualLocation(address: string): Promise<Coordinates>;
  
  // Check if geolocation is available
  isGeolocationAvailable(): boolean;
}

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}
```

### Station Finder Service

**Responsibilities:**
- Search for EV charging stations within specified radius
- Sort stations by distance from user location
- Provide fallback to petrol pumps when no EV stations found
- Calculate distances between coordinates

**Interface:**
```typescript
interface StationFinderService {
  // Find EV charging stations within radius
  findChargingStations(location: Coordinates, radiusKm: number): Promise<Station[]>;
  
  // Find petrol pumps as fallback
  findPetrolPumps(location: Coordinates, radiusKm: number): Promise<Station[]>;
  
  // Calculate distance between two coordinates
  calculateDistance(from: Coordinates, to: Coordinates): number;
}

interface Station {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
  distance: number; // in kilometers
  type: 'ev_charging' | 'petrol_pump';
  availableSlots: number;
  totalSlots: number;
  pricePerKwh: number;
}
```

### Availability Service

**Responsibilities:**
- Track real-time parking slot availability
- Update slot status when sessions start/stop
- Provide slot status updates within 5 seconds
- Handle concurrent slot reservations

**Interface:**
```typescript
interface AvailabilityService {
  // Get current slot availability for a station
  getSlotAvailability(stationId: string): Promise<SlotStatus[]>;
  
  // Subscribe to real-time availability updates
  subscribeToUpdates(stationId: string, callback: (slots: SlotStatus[]) => void): Subscription;
  
  // Mark slot as occupied
  occupySlot(stationId: string, slotNumber: string): Promise<void>;
  
  // Mark slot as available
  releaseSlot(stationId: string, slotNumber: string): Promise<void>;
}

interface SlotStatus {
  slotNumber: string;
  isAvailable: boolean;
  lastUpdated: Date;
}

interface Subscription {
  unsubscribe(): void;
}
```

### Charging Session Manager

**Responsibilities:**
- Create and track charging sessions
- Record energy delivered and duration
- Calculate total cost based on station pricing
- Manage session lifecycle (start, active, stopped)

**Interface:**
```typescript
interface ChargingSessionManager {
  // Start a new charging session
  startSession(stationId: string, slotNumber: string, userId: string): Promise<ChargingSession>;
  
  // Get current session status
  getSessionStatus(sessionId: string): Promise<ChargingSession>;
  
  // Stop charging session
  stopSession(sessionId: string): Promise<ChargingSessionSummary>;
  
  // Calculate session cost
  calculateCost(energyKwh: number, pricePerKwh: number): number;
}

interface ChargingSession {
  sessionId: string;
  stationId: string;
  slotNumber: string;
  userId: string;
  startTime: Date;
  status: 'active' | 'stopped';
  energyDelivered: number; // kWh
  elapsedTime: number; // seconds
}

interface ChargingSessionSummary {
  sessionId: string;
  stationName: string;
  slotNumber: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  energyDelivered: number; // kWh
  pricePerKwh: number;
  subtotal: number;
  taxes: number;
  fees: number;
  totalAmount: number;
}
```

### Payment Gateway Service

**Responsibilities:**
- Generate QR codes with payment information
- Encode payment details (amount, merchant ID, transaction reference)
- Verify payment completion
- Handle payment failures and retries

**Interface:**
```typescript
interface PaymentGatewayService {
  // Generate QR code for payment
  generatePaymentQR(paymentInfo: PaymentInfo): Promise<QRCode>;
  
  // Verify payment status
  verifyPayment(transactionId: string): Promise<PaymentStatus>;
  
  // Initiate payment retry
  retryPayment(transactionId: string): Promise<PaymentStatus>;
}

interface PaymentInfo {
  amount: number;
  currency: string;
  merchantId: string;
  transactionReference: string;
  sessionId: string;
}

interface QRCode {
  imageData: string; // Base64 encoded image
  paymentUrl: string;
}

interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  errorMessage?: string;
}
```

### Receipt Generator Service

**Responsibilities:**
- Create PDF receipts with session and payment details
- Include all required information (station, slot, duration, energy, cost)
- Provide download functionality
- Support email delivery

**Interface:**
```typescript
interface ReceiptGeneratorService {
  // Generate receipt PDF
  generateReceipt(receiptData: ReceiptData): Promise<ReceiptDocument>;
  
  // Download receipt to user's device
  downloadReceipt(receiptDocument: ReceiptDocument): void;
  
  // Email receipt to user
  emailReceipt(receiptDocument: ReceiptDocument, email: string): Promise<void>;
}

interface ReceiptData {
  transactionId: string;
  sessionSummary: ChargingSessionSummary;
  paymentInfo: PaymentInfo;
  stationDetails: Station;
  timestamp: Date;
}

interface ReceiptDocument {
  documentId: string;
  pdfData: Blob;
  filename: string;
}
```

## Data Models

### Station Model
```typescript
interface Station {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
  distance: number;
  type: 'ev_charging' | 'petrol_pump';
  availableSlots: number;
  totalSlots: number;
  pricePerKwh: number;
  operatingHours: OperatingHours;
  amenities: string[];
}

interface OperatingHours {
  open: string; // HH:MM format
  close: string; // HH:MM format
  is24Hours: boolean;
}
```

### Charging Session Model
```typescript
interface ChargingSession {
  sessionId: string;
  stationId: string;
  slotNumber: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'stopped' | 'cancelled';
  energyDelivered: number;
  elapsedTime: number;
  realTimeUpdates: SessionUpdate[];
}

interface SessionUpdate {
  timestamp: Date;
  energyDelivered: number;
  elapsedTime: number;
}
```

### Payment Transaction Model
```typescript
interface PaymentTransaction {
  transactionId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'qr_code' | 'card' | 'wallet';
  merchantId: string;
  timestamp: Date;
  qrCodeData?: string;
  receiptId?: string;
}
```

### Parking Slot Model
```typescript
interface ParkingSlot {
  stationId: string;
  slotNumber: string;
  isAvailable: boolean;
  lastUpdated: Date;
  currentSessionId?: string;
  chargingPower: number; // kW
  connectorType: string;
}
```

### User Location Model
```typescript
interface UserLocation {
  userId: string;
  coordinates: Coordinates;
  address?: string;
  timestamp: Date;
  source: 'gps' | 'manual' | 'ip';
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Location Detection Triggers Coordinate Request

*For any* user-initiated location detection action, the Location Service should request geographic coordinates from the geolocation API.

**Validates: Requirements 2.1**

### Property 2: Successful Location Access Returns Valid Coordinates

*For any* granted location permission, the Location Service should return coordinates with valid latitude (-90 to 90) and longitude (-180 to 180) values.

**Validates: Requirements 2.2**

### Property 3: Denied Location Access Triggers Manual Entry

*For any* denied location permission, the Location Service should provide a manual location entry interface.

**Validates: Requirements 2.3**

### Property 4: Station Search Respects Radius Constraint

*For any* valid user location, all EV charging stations returned by the Station Finder should be within 10 kilometers of that location.

**Validates: Requirements 3.1**

### Property 5: Station Results Are Sorted By Distance

*For any* set of stations returned by the search (EV charging or petrol pumps), the stations should be ordered by increasing distance from the user's location.

**Validates: Requirements 3.2, 4.3**

### Property 6: Station Display Contains Required Information

*For any* charging station displayed in search results, the rendered output should contain the station name, address, distance, and available slot count.

**Validates: Requirements 3.3, 3.4**

### Property 7: Empty EV Search Triggers Petrol Pump Fallback

*For any* user location where no EV charging stations exist within 10 kilometers, the Station Finder should search for and return petrol pumps within 10 kilometers.

**Validates: Requirements 4.1**

### Property 8: Fallback Results Are Correctly Typed

*For any* station returned as a fallback result, the station type should be marked as 'petrol_pump' and not 'ev_charging'.

**Validates: Requirements 4.2**

### Property 9: Station Selection Displays Complete Slot Information

*For any* selected charging station, the detail view should display all parking slot numbers with their availability status (available or occupied).

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 10: Slot Status Updates Propagate to Display

*For any* parking slot status change, the updated status should be reflected in the UI display.

**Validates: Requirements 6.3**

### Property 11: Session Start Creates Active Session With Tracking

*For any* charging initiation request with valid station and slot, a new charging session should be created with status 'active' and display current charging status, elapsed time, and energy delivered.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 12: Session Start and Stop Round-Trip Slot Status

*For any* parking slot, starting a charging session should mark it as occupied, and stopping that session should mark it as available again.

**Validates: Requirements 7.5, 8.5**

### Property 13: Session Stop Records Complete Data and Calculates Cost

*For any* active charging session, stopping the session should terminate charge delivery, record the total energy delivered (kWh) and duration (seconds), and calculate the total cost based on energy × station price per kWh.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 14: Session Summary Contains All Required Fields

*For any* stopped charging session, the summary display should include energy delivered, duration, price per kWh, subtotal, taxes, fees, and total payment amount.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 15: Payment QR Code Is Generated For All Sessions

*For any* charging session summary displayed, the Payment Gateway should generate a QR code containing payment information.

**Validates: Requirements 10.1**

### Property 16: QR Code Encoding Round-Trip

*For any* generated QR code, decoding it should yield the payment amount, merchant identifier, and transaction reference that were encoded.

**Validates: Requirements 10.2**

### Property 17: Payment Amount Displayed Alongside QR Code

*For any* payment screen with a QR code, the payment amount should also be displayed in text format.

**Validates: Requirements 10.4**

### Property 18: Payment Amount Formatted With Two Decimals

*For any* displayed payment amount, the value should be formatted with the currency symbol and exactly two decimal places.

**Validates: Requirements 11.2**

### Property 19: Payment Completion Triggers Verification

*For any* payment completion event, the Payment Gateway should verify the payment status before proceeding.

**Validates: Requirements 12.1**

### Property 20: Successful Payment Shows Confirmation

*For any* payment with status 'completed', the Payment Gateway should display a payment confirmation message.

**Validates: Requirements 12.2**

### Property 21: Failed Payment Shows Error and Retry Option

*For any* payment with status 'failed', the Payment Gateway should display an error message and provide a retry option.

**Validates: Requirements 12.3**

### Property 22: Payment Transactions Record Metadata

*For any* payment attempt, the system should record the timestamp and transaction identifier.

**Validates: Requirements 12.4**

### Property 23: Confirmed Payment Generates Receipt

*For any* payment with status 'completed', the Receipt Generator should create a receipt document.

**Validates: Requirements 13.1**

### Property 24: Receipt Contains All Required Information

*For any* generated receipt, it should include station name, parking slot number, charging duration, energy delivered, payment amount, transaction identifier, and session date/time.

**Validates: Requirements 13.2, 13.3**

### Property 25: Receipt Format Is PDF

*For any* generated receipt document, the file format should be PDF.

**Validates: Requirements 13.4**

### Property 26: Download Request Initiates File Transfer

*For any* user-initiated receipt download request, the Receipt Generator should trigger a file download to the user's device.

**Validates: Requirements 13.5**

## Error Handling

The system must handle various error conditions gracefully:

### Location Service Errors
- **Geolocation unavailable**: Display message explaining browser doesn't support geolocation, immediately show manual entry form
- **Permission denied**: Show friendly message explaining why location is needed, provide manual entry option
- **Timeout**: Retry once, then fall back to manual entry
- **Invalid manual address**: Validate address format, show error message with correction suggestions

### Station Finder Errors
- **API unavailable**: Display cached stations if available, otherwise show error with retry option
- **No stations found**: Automatically trigger petrol pump fallback search
- **Network timeout**: Retry with exponential backoff (1s, 2s, 4s), then show error
- **Invalid coordinates**: Validate coordinate ranges before API call, show error if invalid

### Availability Service Errors
- **WebSocket connection lost**: Attempt reconnection, fall back to polling every 5 seconds
- **Stale data**: Display last update timestamp, show warning if data is older than 30 seconds
- **Concurrent slot reservation**: Show error that slot was just taken, refresh availability
- **Update timeout**: Continue showing last known state, display warning indicator

### Charging Session Errors
- **Session creation fails**: Show error message, ensure slot is not marked as occupied
- **Connection lost during charging**: Buffer updates locally, sync when connection restored
- **Invalid energy readings**: Validate readings are non-negative and within reasonable bounds
- **Session stop fails**: Retry stop operation, prevent user from leaving until confirmed

### Payment Gateway Errors
- **QR code generation fails**: Retry generation, fall back to displaying payment details as text
- **Payment verification timeout**: Poll for status up to 60 seconds, then show manual verification option
- **Payment declined**: Show specific error from gateway, provide retry and alternative payment options
- **Network error during payment**: Prevent duplicate charges by checking transaction ID before retry

### Receipt Generator Errors
- **PDF generation fails**: Retry once, fall back to HTML receipt with print option
- **Download blocked by browser**: Show instructions to allow downloads, provide alternative email option
- **Email delivery fails**: Show error, allow user to retry or download instead
- **Missing session data**: Log error, show partial receipt with available data and support contact

### General Error Handling Principles
- All errors should be logged with context (user ID, session ID, timestamp, error details)
- User-facing error messages should be clear, non-technical, and actionable
- Critical errors (payment, session data) should trigger alerts for monitoring
- Transient errors should be retried automatically with exponential backoff
- All user actions should have loading states and timeout limits

## Testing Strategy

The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for comprehensive coverage of universal properties. Both testing approaches are complementary and necessary:

- **Property-based tests** verify universal properties across many randomly generated inputs, providing broad coverage and catching edge cases that might not be anticipated
- **Unit tests** verify specific examples, UI element presence, integration points, and error conditions with concrete test cases

Together, these approaches ensure both general correctness (property tests) and specific behavior validation (unit tests).

### Property-Based Testing

Property-based testing will be implemented using **fast-check** (for TypeScript/JavaScript), which provides robust random input generation and shrinking capabilities for failing test cases.

**Configuration Requirements:**
- Minimum 100 iterations per property test (due to randomization)
- Each test MUST be tagged with a comment: **Feature: ev-charging-station-finder, Property {number}: {property_text}**
- Each correctness property from the design MUST be implemented by a SINGLE property-based test
- Seed-based reproducibility for failed test cases
- Custom generators for domain-specific types (Coordinates, Station, ChargingSession)

**Property Test Implementation:**

Each of the 26 correctness properties defined above must be implemented as a property-based test:

1. **Property 1-3: Location Service**
   - Generate random permission states and coordinate values
   - Test coordinate validation ranges (-90 to 90 latitude, -180 to 180 longitude)
   - Test fallback behavior on permission denial

2. **Property 4-8: Station Finder**
   - Generate random user locations and station databases
   - Test radius constraints (all results within 10km)
   - Test sorting invariants (results ordered by distance)
   - Test fallback triggering when no EV stations found
   - Test station type marking for fallback results

3. **Property 9-10: Availability Service**
   - Generate random slot status changes
   - Test real-time update propagation to UI

4. **Property 11-14: Charging Session Management**
   - Generate random session parameters (energy, duration, pricing)
   - Test session creation and status tracking
   - Test round-trip slot status (start occupies, stop releases)
   - Test cost calculation formula (energy × price)
   - Test session summary completeness

5. **Property 15-22: Payment Gateway**
   - Generate random payment amounts and transaction data
   - Test QR code encoding/decoding round-trip
   - Test payment amount formatting (currency symbol, 2 decimals)
   - Test payment status transitions (pending → completed/failed)
   - Test confirmation/error message display based on status
   - Test metadata recording (timestamp, transaction ID)

6. **Property 23-26: Receipt Generator**
   - Generate random session and payment data
   - Test receipt generation on payment confirmation
   - Test receipt completeness (all required fields present)
   - Test PDF format validation
   - Test download triggering

### Unit Testing

Unit tests focus on specific examples, UI element presence, edge cases, and integration points that complement the property-based tests.

**Unit Test Coverage:**

1. **UI Element Presence Tests** (Requirements 1.1, 1.2, 1.3, 5.4, 10.3, 11.1, 11.3, 13.6)
   - Landing page displays search interface
   - Landing page has location detection button
   - Landing page displays usage instructions
   - Station detail view has proceed button
   - Payment screen displays QR code prominently
   - Payment amount shown in large, readable text
   - Payment amount appears on both QR and confirmation screens
   - Receipt screen has email button

2. **Visual Layout Tests** (Requirements 6.1, 6.2)
   - Parking slots displayed in grid or list format
   - Available and occupied slots have distinct visual indicators

3. **Edge Cases**
   - Empty station list (no EV stations, no petrol pumps within radius)
   - Single station with all slots occupied
   - Session with zero energy delivered
   - Payment amount of exactly zero
   - Very long station names or addresses (truncation/wrapping)
   - Coordinates at boundary values (poles, date line)
   - Session duration of less than 1 second
   - Slot status update timing (within 5 seconds per Requirement 6.4)

4. **Integration Points**
   - Location Service → Station Finder data flow
   - Station selection → Availability Service subscription setup
   - Session stop → Payment Gateway → Receipt Generator workflow
   - Real-time updates → UI component re-rendering

5. **Error Conditions**
   - Network failures at each external API call
   - Invalid data formats from external services
   - Timeout scenarios for long-running operations
   - Concurrent slot reservations (race conditions)
   - Payment verification timeout
   - PDF generation failure

### Test Data Generators

Custom generators for property-based testing:

```typescript
// Coordinate generator with valid ranges
const coordinateGen = fc.record({
  latitude: fc.double({ min: -90, max: 90 }),
  longitude: fc.double({ min: -180, max: 180 }),
  accuracy: fc.option(fc.double({ min: 0, max: 1000 }))
});

// Station generator with realistic data
const stationGen = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  address: fc.string({ minLength: 10, maxLength: 200 }),
  location: coordinateGen,
  distance: fc.double({ min: 0, max: 10 }),
  type: fc.constantFrom('ev_charging', 'petrol_pump'),
  availableSlots: fc.nat({ max: 50 }),
  totalSlots: fc.nat({ max: 50 }),
  pricePerKwh: fc.double({ min: 0.1, max: 2.0 })
});

// Charging session generator
const sessionGen = fc.record({
  sessionId: fc.uuid(),
  stationId: fc.uuid(),
  slotNumber: fc.string({ minLength: 1, maxLength: 10 }),
  userId: fc.uuid(),
  startTime: fc.date(),
  status: fc.constantFrom('active', 'stopped'),
  energyDelivered: fc.double({ min: 0, max: 100 }),
  elapsedTime: fc.nat({ max: 7200 })
});

// Payment amount generator
const paymentAmountGen = fc.double({ min: 0.01, max: 1000.00, noNaN: true });

// QR code data generator
const qrCodeDataGen = fc.record({
  amount: paymentAmountGen,
  merchantId: fc.uuid(),
  transactionReference: fc.uuid()
});
```

### Testing Tools and Frameworks

- **Unit Testing**: Jest or Vitest
- **Property-Based Testing**: fast-check (required, do not implement from scratch)
- **Component Testing**: React Testing Library (if using React) or similar for other frameworks
- **E2E Testing**: Playwright or Cypress
- **API Mocking**: MSW (Mock Service Worker)
- **Code Coverage**: Istanbul/nyc (target: 80% coverage minimum)

### Continuous Integration

- All tests (unit and property-based) run on every pull request
- Property tests run with fixed seed for reproducibility
- Failed property tests report minimal failing example (via fast-check shrinking)
- Coverage reports generated and tracked over time
- Performance benchmarks for critical paths (station search, session start/stop, payment processing)
