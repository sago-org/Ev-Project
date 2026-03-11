import { useState } from 'react';
import { LocationService } from '../services/LocationService';
import { Coordinates } from '../models';
import './LandingPage.css';

interface LandingPageProps {
  onLocationDetected?: (coordinates: Coordinates) => void;
}

/**
 * Landing page component for EV Charging Station Finder
 * Provides search interface with location detection and manual entry
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
 */
export function LandingPage({ onLocationDetected }: LandingPageProps) {
  const [locationService] = useState(() => new LocationService());
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const handleLocationDetection = async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const coords = await locationService.getCurrentLocation();
      setCoordinates(coords);
      onLocationDetected?.(coords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect location';
      setError(errorMessage);
      
      // Show manual entry form if location access is denied
      if (errorMessage.includes('denied') || errorMessage.includes('unavailable') || errorMessage.includes('timed out')) {
        setShowManualEntry(true);
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!manualAddress.trim()) {
      setError('Please enter a valid address');
      return;
    }

    try {
      const coords = await locationService.setManualLocation(manualAddress);
      setCoordinates(coords);
      onLocationDetected?.(coords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process manual location';
      setError(errorMessage);
    }
  };

  const handleShowManualEntry = () => {
    setShowManualEntry(true);
    setError(null);
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>EV Charging Station Finder</h1>
        <p className="subtitle">Find nearby electric vehicle charging stations</p>
      </header>

      <section className="search-interface">
        <div className="instructions">
          <h2>How to use:</h2>
          <ol>
            <li>Click "Detect My Location" to automatically find your position</li>
            <li>Or enter your location manually if automatic detection is unavailable</li>
            <li>View nearby charging stations sorted by distance</li>
            <li>Select a station to see available parking slots</li>
            <li>Start charging and complete payment when done</li>
          </ol>
        </div>

        <div className="location-detection">
          <button
            className="detect-location-btn"
            onClick={handleLocationDetection}
            disabled={isDetecting}
            aria-label="Detect my current location"
          >
            {isDetecting ? 'Detecting Location...' : 'Detect My Location'}
          </button>

          {!showManualEntry && (
            <button
              className="manual-entry-toggle"
              onClick={handleShowManualEntry}
              aria-label="Enter location manually"
            >
              Enter Location Manually
            </button>
          )}
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {showManualEntry && (
          <form className="manual-entry-form" onSubmit={handleManualSubmit}>
            <label htmlFor="manual-address">
              Enter your address or location:
            </label>
            <input
              id="manual-address"
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g., 123 Main St, City, State"
              aria-label="Manual address input"
            />
            <button type="submit" aria-label="Submit manual location">
              Search
            </button>
          </form>
        )}

        {coordinates && (
          <div className="coordinates-display" role="status">
            <p>Location detected:</p>
            <p>
              Latitude: {coordinates.latitude.toFixed(6)}, 
              Longitude: {coordinates.longitude.toFixed(6)}
            </p>
            {coordinates.accuracy && (
              <p className="accuracy">Accuracy: ±{coordinates.accuracy.toFixed(0)}m</p>
            )}
          </div>
        )}
      </section>

      <section className="features">
        <h2>Features</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <h3>Real-time Availability</h3>
            <p>See which parking slots are available in real-time</p>
          </div>
          <div className="feature-item">
            <h3>Distance Sorting</h3>
            <p>Stations are sorted by distance from your location</p>
          </div>
          <div className="feature-item">
            <h3>Session Tracking</h3>
            <p>Monitor your charging session with live updates</p>
          </div>
          <div className="feature-item">
            <h3>Easy Payment</h3>
            <p>Pay with QR code and download your receipt</p>
          </div>
        </div>
      </section>
    </div>
  );
}
