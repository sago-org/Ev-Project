# Demo Data Information

## Station Locations

The app currently uses **mock data** for demonstration purposes. Here are the locations where you'll find stations:

### EV Charging Stations

| City | Location | Coordinates |
|------|----------|-------------|
| **San Francisco, CA** | ChargePoint Station | 37.7749, -122.4194 |
| **San Francisco, CA** | Tesla Supercharger | 37.7849, -122.4094 |
| **New York, NY** | EVgo Fast Charging | 40.7128, -74.0060 |
| **Los Angeles, CA** | Electrify America | 34.0522, -118.2437 |
| **London, UK** | BP Pulse Charging | 51.5074, -0.1278 |
| **Chennai, India** | Tata Power Charging | 13.0827, 80.2707 |
| **Mumbai, India** | Ather Grid Charging | 19.0760, 72.8777 |
| **Bangalore, India** | Statiq EV Charging | 12.9716, 77.5946 |

### Petrol Pumps (Fallback)

| City | Location | Coordinates |
|------|----------|-------------|
| **San Francisco, CA** | Shell Gas Station | 37.7649, -122.4294 |
| **San Francisco, CA** | Chevron Station | 37.7549, -122.4394 |
| **New York, NY** | Exxon Station | 40.7228, -74.0160 |
| **Los Angeles, CA** | Mobil Gas Station | 34.0622, -118.2537 |
| **Chennai, India** | Indian Oil Petrol Pump | 13.0727, 80.2607 |
| **Mumbai, India** | Bharat Petroleum | 19.0660, 72.8677 |
| **Bangalore, India** | HP Petrol Pump | 12.9616, 77.5846 |

---

## Search Radius

- **Current radius**: 50 km (31 miles)
- Stations within this radius will be displayed
- If no EV stations found, petrol pumps are shown as fallback

---

## Testing the App

### Option 1: Use Your Actual Location
1. Allow location access when prompted
2. If you're near any of the cities above, you'll see stations
3. If not, you'll see "No stations found" or petrol pump fallback

### Option 2: Use Manual Location Entry
1. Deny location access or click "Enter location manually"
2. Enter coordinates from the table above
3. Example: `37.7749, -122.4194` (San Francisco)

### Option 3: Test with Browser DevTools
1. Open Chrome DevTools (F12)
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "sensors" and select "Show Sensors"
4. Choose a location from the dropdown or enter custom coordinates
5. Reload the page

---

## Why Am I Not Seeing Stations?

### Possible Reasons:

1. **You're too far from demo locations**
   - The mock data only has stations in specific cities
   - Try using manual entry with coordinates from the table above

2. **Location permission denied**
   - The app needs your location to search for nearby stations
   - Click "Enter location manually" and use demo coordinates

3. **Search radius too small**
   - Current radius is 50km
   - If you're more than 50km from any demo location, no stations will show

---

## For Production Use

To use real station data, you need to:

1. **Get an API key** from a charging station provider:
   - [Open Charge Map](https://openchargemap.org/site/develop/api)
   - [PlugShare API](https://www.plugshare.com/)
   - [ChargePoint API](https://www.chargepoint.com/developers/)

2. **Update StationFinderService.ts**:
   - Replace `fetchMockStations()` with actual API calls
   - Add API key to environment variables
   - Parse API response to match Station interface

3. **Example API integration**:
```typescript
async findChargingStations(location: Coordinates, radiusKm: number = 10): Promise<Station[]> {
  const response = await fetch(
    `https://api.openchargemap.io/v3/poi/?` +
    `latitude=${location.latitude}&` +
    `longitude=${location.longitude}&` +
    `distance=${radiusKm}&` +
    `distanceunit=km&` +
    `key=${process.env.VITE_CHARGING_API_KEY}`
  );
  
  const data = await response.json();
  return this.parseApiResponse(data);
}
```

---

## Quick Test Coordinates

Copy and paste these into the manual entry form:

- **San Francisco**: `37.7749, -122.4194`
- **New York**: `40.7128, -74.0060`
- **Los Angeles**: `34.0522, -118.2437`
- **London**: `51.5074, -0.1278`
- **Chennai**: `13.0827, 80.2707`
- **Mumbai**: `19.0760, 72.8777`
- **Bangalore**: `12.9716, 77.5946`

---

## Need Help?

If you're still not seeing stations:

1. Check browser console for errors (F12)
2. Verify location permissions are granted
3. Try manual entry with coordinates above
4. Clear browser cache and reload
5. Check that you're using HTTPS (required for geolocation)

---

## Summary

✅ **Mock data** includes 8 EV stations and 7 petrol pumps  
✅ **Search radius** is 50km  
✅ **Locations** span USA, UK, and India  
✅ **Manual entry** available if location access denied  

For production, integrate with a real charging station API!
