import { useNavigate } from 'react-router-dom';
import { ChargingSession } from '../components';
import { useAppContext } from '../context/AppContext';

/**
 * Charging session page wrapper with routing integration
 */
export function ChargingSessionPageWrapper() {
  const navigate = useNavigate();
  const { state, setSessionSummary } = useAppContext();

  const handleSessionComplete = async (_sessionId: string, summary?: import('../models').ChargingSessionSummary) => {
    if (summary) {
      setSessionSummary(summary);
    }
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
      stationId={state.selectedStation.id}
      stationName={state.selectedStation.name}
      slotNumber={state.selectedSlot.slotNumber}
      userId="USER-001" // In production, get from auth context
      onSessionComplete={handleSessionComplete}
      onBack={handleBack}
    />
  );
}
