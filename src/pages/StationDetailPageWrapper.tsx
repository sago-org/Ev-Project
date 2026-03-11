import { useNavigate } from 'react-router-dom';
import { StationDetail } from '../components';
import { useAppContext } from '../context/AppContext';
import type { Station, ParkingSlot } from '../models';

/**
 * Station detail page wrapper with routing integration
 */
export function StationDetailPageWrapper() {
  const navigate = useNavigate();
  const { state, setSelectedSlot } = useAppContext();

  const handleProceed = (station: Station, selectedSlotNumber?: string) => {
    if (selectedSlotNumber) {
      // Create a ParkingSlot object from the selected slot number
      const slot: ParkingSlot = {
        slotNumber: selectedSlotNumber,
        isAvailable: true,
        stationId: station.id,
        lastUpdated: new Date(),
        chargingPower: 50, // Default 50kW
        connectorType: 'CCS', // Default connector type
      };
      setSelectedSlot(slot);
    }
    navigate('/charging');
  };

  const handleBack = () => {
    navigate('/stations');
  };

  if (!state.selectedStation) {
    navigate('/');
    return null;
  }

  return (
    <StationDetail 
      station={state.selectedStation}
      onProceed={handleProceed}
      onBack={handleBack}
    />
  );
}
