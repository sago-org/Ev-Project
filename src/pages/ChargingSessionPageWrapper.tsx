import { useNavigate } from 'react-router-dom';
import { ChargingSession } from '../components';
import { useAppContext } from '../context/AppContext';
import type { ChargingSessionSummary } from '../models';

/**
 * Charging session page wrapper with routing integration
 */
export function ChargingSessionPageWrapper() {
  const navigate = useNavigate();
  const { state, setSessionSummary } = useAppContext();

  const handleSessionComplete = (summary: ChargingSessionSummary) => {
    setSessionSummary(summary);
    navigate('/summary');
  };

  const handleBack = () => {
    navigate('/station-detail');
  };

  if (!state.selectedStation || !state.selectedSlot) {
    navigate('/');
    return null;
  }

  return (
    <ChargingSession 
      station={state.selectedStation}
      slot={state.selectedSlot}
      onSessionComplete={handleSessionComplete}
      onBack={handleBack}
    />
  );
}
