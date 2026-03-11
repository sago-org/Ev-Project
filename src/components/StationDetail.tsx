import { useState, useEffect } from 'react';
import { AvailabilityService } from '../services/AvailabilityService';
import type { Station } from '../models/Station';
import type { SlotStatus } from '../models/ParkingSlot';
import './StationDetail.css';

interface StationDetailProps {
  station: Station;
  onProceed?: (station: Station, selectedSlot?: string) => void;
  onBack?: () => void;
}

/**
 * Station detail component with parking slot grid
 * Displays detailed station information and real-time parking slot availability
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3
 */
export function StationDetail({ station, onProceed, onBack }: StationDetailProps) {
  const [availabilityService] = useState(() => new AvailabilityService());
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch initial slot availability
        const slotData = await availabilityService.getSlotAvailability(station.id);
        setSlots(slotData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load slot availability';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadSlots();

    // Subscribe to real-time updates
    const subscription = availabilityService.subscribeToUpdates(
      station.id,
      (updatedSlots) => {
        setSlots(updatedSlots);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [station.id, availabilityService]);

  const handleSlotClick = (slotNumber: string, isAvailable: boolean) => {
    if (isAvailable) {
      setSelectedSlot(slotNumber === selectedSlot ? null : slotNumber);
    }
  };

  const handleProceed = () => {
    onProceed?.(station, selectedSlot || undefined);
  };

  const availableCount = slots.filter(s => s.isAvailable).length;
  const occupiedCount = slots.length - availableCount;

  if (isLoading) {
    return (
      <div className="station-detail">
        <div className="loading-state" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading station details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="station-detail">
        <div className="error-state" role="alert">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="station-detail">
      {onBack && (
        <button className="back-button" onClick={onBack} aria-label="Go back">
          ← Back to stations
        </button>
      )}

      <header className="station-header">
        <h1 className="station-name">{station.name}</h1>
        {station.type === 'petrol_pump' && (
          <span className="station-type-badge fallback-badge" aria-label="Petrol pump">
            Petrol Pump
          </span>
        )}
      </header>

      <section className="station-info">
        <div className="info-item">
          <span className="icon" aria-hidden="true">📍</span>
          <div>
            <span className="info-label">Address</span>
            <span className="info-value">{station.address}</span>
          </div>
        </div>

        <div className="info-item">
          <span className="icon" aria-hidden="true">🚗</span>
          <div>
            <span className="info-label">Distance</span>
            <span className="info-value">{station.distance} km</span>
          </div>
        </div>

        {station.type === 'ev_charging' && station.pricePerKwh > 0 && (
          <div className="info-item">
            <span className="icon" aria-hidden="true">💰</span>
            <div>
              <span className="info-label">Price</span>
              <span className="info-value">${station.pricePerKwh.toFixed(2)}/kWh</span>
            </div>
          </div>
        )}

        {station.operatingHours && (
          <div className="info-item">
            <span className="icon" aria-hidden="true">🕐</span>
            <div>
              <span className="info-label">Hours</span>
              <span className="info-value">
                {station.operatingHours.is24Hours
                  ? '24 Hours'
                  : `${station.operatingHours.open} - ${station.operatingHours.close}`}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="parking-slots-section">
        <header className="slots-header">
          <h2>Parking Slots</h2>
          <div className="slots-summary">
            <span className="summary-item available">
              <span className="summary-indicator available-indicator" aria-hidden="true"></span>
              {availableCount} Available
            </span>
            <span className="summary-item occupied">
              <span className="summary-indicator occupied-indicator" aria-hidden="true"></span>
              {occupiedCount} Occupied
            </span>
          </div>
        </header>

        <div className="slots-legend">
          <div className="legend-item">
            <span className="legend-indicator available-indicator" aria-hidden="true"></span>
            <span>Available - Click to select</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator occupied-indicator" aria-hidden="true"></span>
            <span>Occupied</span>
          </div>
          {selectedSlot && (
            <div className="legend-item">
              <span className="legend-indicator selected-indicator" aria-hidden="true"></span>
              <span>Selected</span>
            </div>
          )}
        </div>

        <div className="parking-slots-grid" role="list" aria-label="Parking slots">
          {slots.map((slot) => {
            const isSelected = slot.slotNumber === selectedSlot;
            const slotClass = `parking-slot ${
              isSelected ? 'selected' : slot.isAvailable ? 'available' : 'occupied'
            }`;

            return (
              <button
                key={slot.slotNumber}
                className={slotClass}
                onClick={() => handleSlotClick(slot.slotNumber, slot.isAvailable)}
                disabled={!slot.isAvailable}
                aria-label={`Slot ${slot.slotNumber}, ${
                  isSelected ? 'selected' : slot.isAvailable ? 'available' : 'occupied'
                }`}
                aria-pressed={isSelected}
                role="listitem"
              >
                <span className="slot-number">{slot.slotNumber}</span>
                <span className="slot-status" aria-hidden="true">
                  {isSelected ? '✓' : slot.isAvailable ? '' : '✕'}
                </span>
              </button>
            );
          })}
        </div>

        {slots.length === 0 && (
          <div className="empty-slots" role="status">
            <p>No parking slot information available for this station.</p>
          </div>
        )}
      </section>

      <footer className="station-footer">
        {selectedSlot && (
          <div className="selection-info" role="status" aria-live="polite">
            <span className="icon" aria-hidden="true">✓</span>
            <span>Slot {selectedSlot} selected</span>
          </div>
        )}
        <button
          className="proceed-button"
          onClick={handleProceed}
          aria-label="Proceed with selected station"
        >
          Proceed
        </button>
      </footer>
    </div>
  );
}
