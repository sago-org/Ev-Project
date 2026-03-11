import { useState, useEffect } from 'react';
import { StationFinderService } from '../services/StationFinderService';
import type { Station, Coordinates } from '../models';
import './StationList.css';

interface StationListProps {
  location: Coordinates;
  onStationSelect?: (station: Station) => void;
}

/**
 * Station list component to display search results
 * Shows EV charging stations or fallback petrol pumps sorted by distance
 * 
 * Requirements: 3.2, 3.3, 3.4, 4.2
 */
export function StationList({ location, onStationSelect }: StationListProps) {
  const [stationService] = useState(() => new StationFinderService());
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    const searchStations = async () => {
      setIsLoading(true);
      setError(null);
      setIsFallback(false);

      try {
        // First, try to find EV charging stations
        const evStations = await stationService.findChargingStations(location, 10);
        
        if (evStations.length > 0) {
          // Found EV stations - display them
          setStations(evStations);
        } else {
          // No EV stations found - fallback to petrol pumps
          const petrolPumps = await stationService.findPetrolPumps(location, 10);
          setStations(petrolPumps);
          setIsFallback(true);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search for stations';
        setError(errorMessage);
        setStations([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchStations();
  }, [location, stationService]);

  const handleStationClick = (station: Station) => {
    onStationSelect?.(station);
  };

  if (isLoading) {
    return (
      <div className="station-list">
        <div className="loading-state" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <p>Searching for nearby stations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="station-list">
        <div className="error-state" role="alert">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="station-list">
        <div className="empty-state" role="status">
          <p>No stations found within 10 kilometers of your location.</p>
          <p>Try searching from a different location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="station-list">
      <header className="station-list-header">
        <h2>
          {isFallback ? 'Nearby Petrol Pumps' : 'Nearby Charging Stations'}
        </h2>
        {isFallback && (
          <div className="fallback-notice" role="alert">
            <span className="fallback-icon" aria-hidden="true">ℹ️</span>
            <p>
              No EV charging stations found nearby. 
              Showing petrol pumps as alternative locations.
            </p>
          </div>
        )}
        <p className="results-count">
          Found {stations.length} {stations.length === 1 ? 'station' : 'stations'}
        </p>
      </header>

      <ul className="stations" role="list">
        {stations.map((station) => (
          <li key={station.id} className="station-item">
            <button
              className="station-card"
              onClick={() => handleStationClick(station)}
              aria-label={`Select ${station.name}`}
            >
              <div className="station-header">
                <h3 className="station-name">{station.name}</h3>
                {station.type === 'petrol_pump' && (
                  <span 
                    className="station-type-badge fallback-badge" 
                    aria-label="Petrol pump"
                  >
                    Petrol Pump
                  </span>
                )}
              </div>

              <div className="station-details">
                <p className="station-address">
                  <span className="icon" aria-hidden="true">📍</span>
                  {station.address}
                </p>

                <div className="station-metrics">
                  <div className="metric">
                    <span className="icon" aria-hidden="true">🚗</span>
                    <span className="metric-label">Distance:</span>
                    <span className="metric-value">{station.distance} km</span>
                  </div>

                  <div className="metric">
                    <span className="icon" aria-hidden="true">🅿️</span>
                    <span className="metric-label">Available slots:</span>
                    <span className="metric-value">
                      {station.availableSlots} / {station.totalSlots}
                    </span>
                  </div>

                  {station.type === 'ev_charging' && station.pricePerKwh > 0 && (
                    <div className="metric">
                      <span className="icon" aria-hidden="true">💰</span>
                      <span className="metric-label">Price:</span>
                      <span className="metric-value">
                        ${station.pricePerKwh.toFixed(2)}/kWh
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="station-footer">
                <span className="select-hint">Click to view details →</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
