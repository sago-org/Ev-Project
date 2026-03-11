import { useNavigate } from 'react-router-dom';
import { ChargingSummary } from '../components';
import { useAppContext } from '../context/AppContext';

/**
 * Charging summary page wrapper with routing integration
 */
export function ChargingSummaryPageWrapper() {
  const navigate = useNavigate();
  const { state } = useAppContext();

  const handleProceedToPayment = () => {
    navigate('/payment');
  };

  const handleBack = () => {
    navigate('/charging');
  };

  if (!state.sessionSummary) {
    navigate('/');
    return null;
  }

  return (
    <ChargingSummary 
      summary={state.sessionSummary}
      onProceedToPayment={handleProceedToPayment}
      onBack={handleBack}
    />
  );
}
