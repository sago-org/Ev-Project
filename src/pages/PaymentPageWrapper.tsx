import { useNavigate } from 'react-router-dom';
import { Payment } from '../components';
import { useAppContext } from '../context/AppContext';

/**
 * Payment page wrapper with routing integration
 */
export function PaymentPageWrapper() {
  const navigate = useNavigate();
  const { state, setTransactionId } = useAppContext();

  const handlePaymentSuccess = (transactionId: string) => {
    setTransactionId(transactionId);
    navigate('/receipt');
  };

  const handleBack = () => {
    navigate('/summary');
  };

  if (!state.sessionSummary) {
    navigate('/');
    return null;
  }

  return (
    <Payment 
      summary={state.sessionSummary}
      onPaymentSuccess={handlePaymentSuccess}
      onBack={handleBack}
    />
  );
}
