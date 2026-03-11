import { useNavigate } from 'react-router-dom';
import { Receipt } from '../components';
import { useAppContext } from '../context/AppContext';

/**
 * Receipt page wrapper with routing integration
 */
export function ReceiptPageWrapper() {
  const navigate = useNavigate();
  const { state, resetState } = useAppContext();

  const handleComplete = () => {
    resetState();
    navigate('/');
  };

  if (!state.sessionSummary || !state.selectedStation || !state.transactionId) {
    navigate('/');
    return null;
  }

  // Create payment info from session summary
  const paymentInfo = {
    amount: state.sessionSummary.totalAmount,
    currency: 'INR',
    merchantId: 'MERCHANT-001',
    transactionReference: state.transactionId,
    sessionId: state.sessionSummary.sessionId,
  };

  return (
    <Receipt 
      transactionId={state.transactionId}
      sessionSummary={state.sessionSummary}
      paymentInfo={paymentInfo}
      stationDetails={state.selectedStation}
      onComplete={handleComplete}
    />
  );
}
