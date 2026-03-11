# Demo Data - Tamil Nadu, India

## EV Charging Stations (15 Locations)

### Chennai (5 stations)
| Station Name | Address | Coordinates | Price/kWh |
|--------------|---------|-------------|-----------|
| Tata Power EZ Charge | Anna Salai, Mount Road | 13.0569, 80.2497 | ₹12.50 |
| Ather Grid | Pondy Bazaar, T Nagar | 13.0418, 80.2341 | ₹13.00 |
| Statiq EV Charging | OMR, Thoraipakkam | 12.9391, 80.2304 | ₹11.80 |
| ChargeZone | Velachery Main Road | 12.9750, 80.2170 | ₹12.00 |
| Tata Power | Mount Poonamallee Road, Porur | 13.0358, 80.1557 | ₹12.20 |

### Coimbatore (2 stations)
| Station Name | Address | Coordinates | Price/kWh |
|--------------|---------|-------------|-----------|
| Ather Grid | Diwan Bahadur Road, RS Puram | 11.0015, 76.9604 | ₹11.50 |
| Statiq | Avinashi Road, Saibaba Colony | 11.0240, 76.9630 | ₹11.80 |

### Madurai (2 stations)
| Station Name | Address | Coordinates | Price/kWh |
|--------------|---------|-------------|-----------|
| Tata Power | Anna Nagar | 9.9252, 78.1198 | ₹11.00 |
| ChargeZone | Madurai Bypass Road | 9.9195, 78.1354 | ₹11.50 |

### Other Cities (6 stations)
| City | Station Name | Coordinates | Price/kWh |
|------|--------------|-------------|-----------|
| **Tiruchirappalli** | Ather Grid - Thillai Nagar | 10.8155, 78.6869 | ₹11.20 |
| **Salem** | Statiq - Cherry Road | 11.6643, 78.1460 | ₹11.00 |
| **Vellore** | Tata Power - Katpadi | 12.9698, 79.1325 | ₹11.50 |
| **Tirunelveli** | ChargeZone - Palayamkottai | 8.7289, 77.7085 | ₹10.80 |
| **Erode** | Ather Grid - Perundurai Road | 11.3410, 77.7172 | ₹11.00 |
| **Thanjavur** | Statiq - Medical College Road | 10.7870, 79.1378 | ₹11.00 |

---

## Petrol Pumps (12 Locations)

### Chennai (4 pumps)
| Pump Name | Address | Coordinates |
|-----------|---------|-------------|
| Indian Oil | Anna Salai | 13.0525, 80.2511 |
| Bharat Petroleum | OMR | 12.9450, 80.2350 |
| HP Petrol Pump | Porur | 13.0380, 80.1520 |
| Indian Oil | Velachery Main Road | 12.9800, 80.2200 |

### Other Cities (8 pumps)
| City | Pump Name | Coordinates |
|------|-----------|-------------|
| **Coimbatore** | Bharat Petroleum - Avinashi Road | 11.0270, 76.9670 |
| **Coimbatore** | HP Petrol Pump - Gandhipuram | 11.0168, 76.9558 |
| **Madurai** | Indian Oil - Bypass Road | 9.9220, 78.1380 |
| **Madurai** | Bharat Petroleum - Anna Nagar | 9.9280, 78.1220 |
| **Tiruchirappalli** | HP Petrol Pump - Thillai Nagar | 10.8180, 78.6900 |
| **Salem** | Indian Oil - Cherry Road | 11.6670, 78.1490 |
| **Vellore** | Bharat Petroleum - Katpadi | 12.9720, 79.1350 |
| **Tirunelveli** | HP Petrol Pump - Palayamkottai | 8.7310, 77.7110 |

---

## Quick Test Coordinates

Copy and paste these into the manual entry form:

### Major Cities
- **Chennai (Anna Salai)**: `13.0569, 80.2497`
- **Chennai (T Nagar)**: `13.0418, 80.2341`
- **Chennai (OMR)**: `12.9391, 80.2304`
- **Coimbatore**: `11.0015, 76.9604`
- **Madurai**: `9.9252, 78.1198`
- **Tiruchirappalli**: `10.8155, 78.6869`
- **Salem**: `11.6643, 78.1460`
- **Vellore**: `12.9698, 79.1325`

---

## Search Settings

- **Search Radius**: 50 km
- **Currency**: Indian Rupees (₹)
- **Price Range**: ₹10.80 - ₹13.00 per kWh
- **Operating Hours**: Mix of 24/7 and timed stations

---

## Coverage Map

```
Tamil Nadu Coverage:
┌─────────────────────────────┐
│  Vellore (1 EV, 1 Petrol)  │
│                             │
│  Salem (1 EV, 1 Petrol)     │
│                             │
│  Erode (1 EV)               │
│                             │
│  Coimbatore (2 EV, 2 Petrol)│
│                             │
│  Tiruchirappalli (1 EV, 1 P)│
│                             │
│  Thanjavur (1 EV)           │
│                             │
│  Chennai (5 EV, 4 Petrol)   │
│  ├─ Anna Salai              │
│  ├─ T Nagar                 │
│  ├─ OMR                     │
│  ├─ Velachery               │
│  └─ Porur                   │
│                             │
│  Madurai (2 EV, 2 Petrol)   │
│                             │
│  Tirunelveli (1 EV, 1 Petrol)│
└─────────────────────────────┘
```

---

## How to Test

### Option 1: Use Your Actual Location (If in Tamil Nadu)
1. Allow location access when prompted
2. If you're in Tamil Nadu, you'll see nearby stations
3. Stations within 50km will be displayed

### Option 2: Manual Entry (Recommended)
1. Click "Enter location manually" on landing page
2. Enter coordinates from the table above
3. Example: `13.0569, 80.2497` (Chennai Anna Salai)

### Option 3: Browser DevTools
1. Open Chrome DevTools (F12)
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "sensors" and select "Show Sensors"
4. Enter custom coordinates from the table
5. Reload the page

---

## Station Features

### EV Charging Stations
- ✅ Real-time slot availability
- ✅ Price per kWh in Indian Rupees
- ✅ Operating hours (24/7 or timed)
- ✅ Multiple charging slots
- ✅ Major providers: Tata Power, Ather Grid, Statiq, ChargeZone

### Petrol Pumps (Fallback)
- ✅ Shown when no EV stations nearby
- ✅ Major brands: Indian Oil, Bharat Petroleum, HP
- ✅ 24/7 availability
- ✅ Multiple fuel pumps

---

## Pricing Information

| Provider | Average Price/kWh |
|----------|-------------------|
| Tata Power | ₹11.50 - ₹12.50 |
| Ather Grid | ₹11.50 - ₹13.00 |
| Statiq | ₹11.00 - ₹11.80 |
| ChargeZone | ₹10.80 - ₹12.00 |

---

## For Production Use

To integrate real charging station data:

1. **Tamil Nadu EV Infrastructure APIs**:
   - TNEB (Tamil Nadu Electricity Board) EV Portal
   - Open Charge Map India
   - PlugShare India

2. **Update StationFinderService.ts**:
```typescript
async findChargingStations(location: Coordinates, radiusKm: number = 50): Promise<Station[]> {
  const response = await fetch(
    `https://api.openchargemap.io/v3/poi/?` +
    `latitude=${location.latitude}&` +
    `longitude=${location.longitude}&` +
    `distance=${radiusKm}&` +
    `distanceunit=km&` +
    `countrycode=IN&` +
    `key=${process.env.VITE_CHARGING_API_KEY}`
  );
  
  const data = await response.json();
  return this.parseApiResponse(data);
}
```

---

## Summary

✅ **15 EV Charging Stations** across Tamil Nadu  
✅ **12 Petrol Pumps** as fallback  
✅ **9 Cities** covered  
✅ **50km Search Radius**  
✅ **Realistic pricing** in Indian Rupees  
✅ **Operating hours** included  

Perfect for testing and demonstrating the EV Charging Station Finder in Tamil Nadu! 🚗⚡
