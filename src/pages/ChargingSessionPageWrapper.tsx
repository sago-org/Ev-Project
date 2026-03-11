import { useNavigate } from 'react-router-dom';
import { ChargingSession } from '../components';
import { useAppContext } from '../context/AppContext';
import { ChargingSessionManager } from '../services/ChargingSessionManager';

/**
 * Charging session page wrapper with routing integration
 */
export function ChargingSessionPageWrapper() {
  const navigate = useNavigate();
  const { state, setSessionSummary } = useAppContext();

  const handleSessionComplete = async (sessionId: string) => {
    try {
      // Get the session summary
      const sessionManager = ChargingSessionManager.getInstance();
      const summary = await sessionManager.stopSession(sessionId);
      setSessionSummary(summary);
      navigate('/summary');
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
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
