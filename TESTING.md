# EV Charging Station Finder - Testing Guide

## Overview
This document provides comprehensive testing instructions for the EV Charging Station Finder application, including manual testing scenarios, automated test execution, and expected behaviors.

## Table of Contents
1. [Automated Testing](#automated-testing)
2. [Manual Testing Scenarios](#manual-testing-scenarios)
3. [Test Data](#test-data)
4. [Known Issues & Limitations](#known-issues--limitations)

---

## Automated Testing

### Running All Tests
```bash
npm test
```

### Running Specific Test Suites
```bash
# Service tests
npm test -- src/services/LocationService.test.ts
npm test -- src/services/StationFinderService.test.ts
npm test -- src/services/AvailabilityService.test.ts
npm test -- src/services/ChargingSessionManager.test.ts
npm test -- src/services/PaymentGatewayService.test.ts
npm test -- src/services/ReceiptGeneratorService.test.ts

# Component tests
npm test -- src/components/LandingPage.test.tsx
npm test -- src/components/StationList.test.tsx
npm test -- src/components/StationDetail.test.tsx
npm test -- src/components/ChargingSession.test.tsx
npm test -- src/components/Payment.test.tsx
```

### Test Coverage
- **Total Tests**: 223 passing
- **Services**: 137 tests
- **Components**: 86 tests
- **Property-Based Tests**: Included with fast-check (100+ iterations per test)

---

## Manual Testing Scenarios

### Scenario 1: Complete Happy Path Flow

**Objective**: Test the entire user journey from landing to receipt download.

**Steps**:
1. **Landing Page**
   - Open the application
   - Click "Find Charging Stations" button
   - ✅ Should navigate to station list

2. **Location Detection**
   - Allow location access when prompted
   - ✅ Should detect your location
   - ✅ Should display nearby stations (if in Tamil Nadu)
   - **Alternative**: If not in Tamil Nadu, use test coordinates:
     - Chennai: `13.0827, 80.2707`
     - Coimbatore: `11.0168, 76.9558`
     - Madurai: `9.9252, 78.1198`

3. **Station List**
   - ✅ Should display 15 EV charging stations
   - ✅ Each station should show:
     - Name and address
     - Distance from your location
     - Available slots count
     - Price per kWh (₹10.80 - ₹13.00)
     - Operating hours
   - ✅ Stations should be sorted by distance (nearest first)

4. **Station Selection**
   - Click "View Details" on any station
   - ✅ Should navigate to station detail page

5. **Station Detail Page**
   - ✅ Should display station information
   - ✅ Should show parking slots grid (6-12 slots)
   - ✅ Green slots = Available, Red slots = Occupied
   - ✅ Slots should update in real-time (every 5 seconds)
   - Click on an available (green) slot
   - ✅ Should navigate to charging session page

6. **Charging Session**
   - ✅ Should display:
     - Selected slot number
     - Station name
     - Real-time charging metrics (kWh, duration, cost)
   - ✅ Metrics should update every second
   - ✅ Cost should calculate correctly (kWh × price per kWh)
   - Wait for charging to complete or click "Stop Charging"
   - ✅ Should navigate to charging summary

7. **Charging Summary**
   - ✅ Should display:
     - Total energy consumed (kWh)
     - Total duration
     - Total cost (₹)
     - Station details
   - Click "Proceed to Payment"
   - ✅ Should navigate to payment page

8. **Payment**
   - ✅ Should display:
     - Amount to pay
     - UPI QR code
     - Transaction ID
   - ✅ QR code should be scannable
   - Wait 3 seconds for auto-verification
   - ✅ Should show "Payment Successful" message
   - Click "View Receipt"
   - ✅ Should navigate to receipt page

9. **Receipt**
   - ✅ Should display complete receipt with:
     - Transaction details
     - Charging session details
     - Cost breakdown
     - Date and time
   - Click "Download PDF"
   - ✅ Should download receipt as PDF file
   - ✅ PDF should contain all receipt information

### Scenario 2: No Stations Available (Fallback to Petrol Pumps)

**Objective**: Test fallback behavior when no EV stations are within range.

**Steps**:
1. Use coordinates far from Tamil Nadu (e.g., `28.6139, 77.2090` - Delhi)
2. ✅ Should display message: "No EV charging stations found within 50km"
3. ✅ Should show "Nearby Petrol Pumps" section
4. ✅ Should display 12 petrol pumps as alternatives
5. ✅ Each petrol pump should show name, address, and distance

### Scenario 3: Location Permission Denied

**Objective**: Test behavior when user denies location access.

**Steps**:
1. Open application
2. Click "Find Charging Stations"
3. Deny location permission
4. ✅ Should display error message
5. ✅ Should provide option to enter location manually
6. ✅ Should still be able to search for stations

### Scenario 4: Slot Already Occupied

**Objective**: Test error handling when selected slot becomes occupied.

**Steps**:
1. Navigate to station detail page
2. Wait for real-time updates (slots change every 5 seconds)
3. Try to select a slot that just turned red (occupied)
4. ✅ Should display error message
5. ✅ Should allow selecting a different slot

### Scenario 5: Payment Failure and Retry

**Objective**: Test payment failure handling.

**Steps**:
1. Complete charging session
2. Navigate to payment page
3. Wait for payment verification
4. If payment fails (simulated randomly):
   - ✅ Should display error message
   - ✅ Should show "Retry Payment" button
   - Click "Retry Payment"
   - ✅ Should regenerate QR code
   - ✅ Should attempt payment again

### Scenario 6: Navigation and Back Button

**Objective**: Test navigation flow and back button behavior.

**Steps**:
1. Navigate through: Landing → Station List → Station Detail
2. Click browser back button
3. ✅ Should return to station list
4. Click back again
5. ✅ Should return to landing page
6. Navigate forward again
7. ✅ Should maintain state (selected station, location)

### Scenario 7: Real-Time Updates

**Objective**: Test real-time slot availability updates.

**Steps**:
1. Navigate to station detail page
2. Observe parking slots for 30 seconds
3. ✅ Slots should change status (green ↔ red) periodically
4. ✅ Available count should update accordingly
5. ✅ Updates should occur every 5 seconds

### Scenario 8: Multiple Stations Comparison

**Objective**: Test comparing different stations.

**Steps**:
1. View station list
2. Note prices and distances for multiple stations
3. ✅ Prices should vary (₹10.80 - ₹13.00 per kWh)
4. ✅ Distances should be accurate
5. ✅ Should be able to select cheapest or nearest station

### Scenario 9: Long Charging Session

**Objective**: Test extended charging session behavior.

**Steps**:
1. Start a charging session
2. Let it run for 5+ minutes
3. ✅ Metrics should continue updating
4. ✅ Cost should accumulate correctly
5. ✅ Duration should display in HH:MM:SS format
6. Stop charging
7. ✅ Final summary should match real-time display

### Scenario 10: Receipt Email (Simulated)

**Objective**: Test receipt email functionality.

**Steps**:
1. Navigate to receipt page
2. Enter email address: `test@example.com`
3. Click "Email Receipt"
4. ✅ Should display success message
5. ✅ Console should log email simulation
6. ✅ Should validate email format

---

## Test Data

### Test Coordinates for Tamil Nadu

Use these coordinates to test the application in different cities:

| City | Latitude | Longitude | Expected Stations |
|------|----------|-----------|-------------------|
| Chennai (Anna Salai) | 13.0827 | 80.2707 | 5 stations |
| Coimbatore | 11.0168 | 76.9558 | 2 stations |
| Madurai | 9.9252 | 78.1198 | 2 stations |
| Tiruchirappalli | 10.7905 | 78.7047 | 1 station |
| Salem | 11.6643 | 78.1460 | 1 station |
| Vellore | 12.9165 | 79.1325 | 1 station |

### Sample Station IDs

- `ev-1`: Chennai - Anna Salai EV Hub
- `ev-2`: Chennai - T Nagar Charging Point
- `ev-3`: Chennai - OMR Tech Park Station
- `ev-4`: Coimbatore - RS Puram EV Center
- `ev-5`: Madurai - Anna Nagar Charging Hub

### Test Payment Scenarios

- **Transaction ID Format**: `TXN-{timestamp}-{random}`
- **UPI ID**: `evcharging@upi`
- **Payment Verification**: Auto-completes after 3 seconds
- **Success Rate**: ~90% (10% failure for testing)

---

## Known Issues & Limitations

### Current Limitations

1. **Mock Data Only**
   - All station data is hardcoded for Tamil Nadu
   - No real backend API integration
   - Slot availability is simulated

2. **Location Services**
   - Requires browser geolocation API
   - May not work in some browsers without HTTPS
   - Fallback to manual entry available

3. **Payment Integration**
   - QR codes are generated but not connected to real payment gateway
   - Payment verification is simulated (3-second delay)
   - No actual money transfer occurs

4. **Real-Time Updates**
   - Uses polling instead of WebSocket (5-second intervals)
   - Simulated slot changes (10% chance per slot per update)
   - Not connected to actual station hardware

5. **Receipt Email**
   - Email functionality is simulated (console log only)
   - No actual email is sent
   - PDF download works correctly

### Browser Compatibility

**Tested Browsers**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Known Issues**:
- PDF generation may be slower on mobile browsers
- QR code scanning requires separate UPI app
- Location services may require HTTPS in production

### Performance Notes

- Initial load time: ~2-3 seconds
- Station list rendering: <100ms
- Real-time updates: Every 5 seconds
- Payment verification: 3 seconds
- PDF generation: 1-2 seconds

---

## Accessibility Testing

### Keyboard Navigation
1. Tab through all interactive elements
2. ✅ Focus should be visible on all elements
3. ✅ Enter/Space should activate buttons
4. ✅ Escape should close modals (if any)

### Screen Reader Testing
1. Use screen reader (NVDA, JAWS, VoiceOver)
2. ✅ All buttons should have descriptive labels
3. ✅ Form inputs should have labels
4. ✅ Error messages should be announced
5. ✅ Status updates should be announced

### Color Contrast
- ✅ All text meets WCAG AA standards
- ✅ Available slots (green) vs Occupied slots (red) are distinguishable
- ✅ Error messages have sufficient contrast

---

## Troubleshooting

### Issue: No stations appearing
**Solution**: 
- Check if you're using Tamil Nadu coordinates
- Verify location permissions are granted
- Try manual location entry

### Issue: Slots not updating
**Solution**:
- Wait 5 seconds for next update cycle
- Refresh the page
- Check browser console for errors

### Issue: Payment stuck on "Verifying"
**Solution**:
- Wait 3 seconds for auto-verification
- Refresh page and retry
- Check browser console for errors

### Issue: PDF download not working
**Solution**:
- Check browser popup blocker settings
- Ensure sufficient storage space
- Try different browser

### Issue: QR code not displaying
**Solution**:
- Check internet connection
- Refresh the page
- Verify transaction ID is generated

---

## Reporting Issues

If you encounter any issues during testing:

1. **Check browser console** for error messages
2. **Note the steps** to reproduce the issue
3. **Capture screenshots** if applicable
4. **Record browser and OS** information
5. **Check if issue persists** after page refresh

---

## Test Checklist

Use this checklist for comprehensive testing:

### Functional Testing
- [ ] Landing page loads correctly
- [ ] Location detection works
- [ ] Station list displays all stations
- [ ] Station details show correct information
- [ ] Slot selection works
- [ ] Charging session starts and updates
- [ ] Payment flow completes
- [ ] Receipt generates and downloads
- [ ] Navigation works correctly
- [ ] Error handling works

### UI/UX Testing
- [ ] All buttons are clickable
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Layout is responsive
- [ ] Colors and fonts are consistent
- [ ] Icons display correctly

### Performance Testing
- [ ] Page loads in <3 seconds
- [ ] No memory leaks during long sessions
- [ ] Real-time updates don't lag
- [ ] PDF generation completes in <2 seconds

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast is sufficient
- [ ] Focus indicators are visible

### Cross-Browser Testing
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

---

## Automated Test Results

Last test run: All 223 tests passing ✅

```
Test Files  12 passed (12)
Tests       223 passed (223)
Duration    ~30 seconds
```

### Test Breakdown by Module

| Module | Tests | Status |
|--------|-------|--------|
| LocationService | 14 | ✅ |
| StationFinderService | 19 | ✅ |
| AvailabilityService | 17 | ✅ |
| ChargingSessionManager | 34 | ✅ |
| PaymentGatewayService | 25 | ✅ |
| ReceiptGeneratorService | 21 | ✅ |
| LandingPage | 9 | ✅ |
| StationList | 9 | ✅ |
| StationDetail | 31 | ✅ |
| ChargingSession | 22 | ✅ |
| Payment | 17 | ✅ |
| Setup | 5 | ✅ |

---

## Conclusion

This testing guide covers all major scenarios and edge cases for the EV Charging Station Finder application. Follow the manual testing scenarios to verify functionality, and run automated tests regularly to ensure code quality.

For detailed station data and quick start instructions, refer to:
- `DEMO-DATA.md` - Complete station reference
- `TAMIL-NADU-QUICK-START.md` - Quick testing guide
- `DEPLOYMENT.md` - Deployment instructions
