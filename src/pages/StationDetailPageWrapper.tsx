import { useNavigate } from 'react-router-dom';
import { StationDetail } from '../components';
import { useAppContext } from '../context/AppContext';
import type { ParkingSlot } from '../models';

/**
 * Station detail page wrapper with routing integration
 */
export function StationDetailPageWrapper() {
  const navigate = useNavigate();
  const { state, setSelectedSlot } = useAppContext();

  const handleSlotSelect = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
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
      onSlotSelect={handleSlotSelect}
      onBack={handleBack}
    />
  );
}
