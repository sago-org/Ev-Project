import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireLocation?: boolean;
  requireStation?: boolean;
  requireSlot?: boolean;
  requireSession?: boolean;
  requireSummary?: boolean;
  requirePayment?: boolean;
}

/**
 * Protected route component that guards routes based on required state
 */
export function ProtectedRoute({
  children,
  requireLocation = false,
  requireStation = false,
  requireSlot = false,
  requireSession = false,
  requireSummary = false,
  requirePayment = false,
}: ProtectedRouteProps) {
  const { state } = useAppContext();

  // Check if all required state is present
  if (requireLocation && !state.userLocation) {
    return <Navigate to="/" replace />;
  }

  if (requireStation && !state.selectedStation) {
    return <Navigate to="/" replace />;
  }

  if (requireSlot && !state.selectedSlot) {
    return <Navigate to="/stations" replace />;
  }

  if (requireSession && !state.activeSession) {
    return <Navigate to="/" replace />;
  }

  if (requireSummary && !state.sessionSummary) {
    return <Navigate to="/" replace />;
  }

  if (requirePayment && !state.paymentInfo) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
