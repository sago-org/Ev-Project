import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { 
  Coordinates, 
  Station, 
  ChargingSession, 
  ChargingSessionSummary,
  PaymentInfo,
  ParkingSlot 
} from '../models';

/**
 * Application state interface
 */
interface AppState {
  userLocation: Coordinates | null;
  selectedStation: Station | null;
  selectedSlot: ParkingSlot | null;
  activeSession: ChargingSession | null;
  sessionSummary: ChargingSessionSummary | null;
  paymentInfo: PaymentInfo | null;
  transactionId: string | null;
}

/**
 * Application context interface
 */
interface AppContextType {
  state: AppState;
  setUserLocation: (location: Coordinates) => void;
  setSelectedStation: (station: Station) => void;
  setSelectedSlot: (slot: ParkingSlot) => void;
  setActiveSession: (session: ChargingSession) => void;
  setSessionSummary: (summary: ChargingSessionSummary) => void;
  setPaymentInfo: (info: PaymentInfo) => void;
  setTransactionId: (id: string) => void;
  resetState: () => void;
}

const initialState: AppState = {
  userLocation: null,
  selectedStation: null,
  selectedSlot: null,
  activeSession: null,
  sessionSummary: null,
  paymentInfo: null,
  transactionId: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'ev-charging-app-state';

/**
 * App context provider component
 * Manages global application state with persistence
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    // Try to restore state from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.activeSession) {
          parsed.activeSession.startTime = new Date(parsed.activeSession.startTime);
        }
        if (parsed.sessionSummary) {
          parsed.sessionSummary.startTime = new Date(parsed.sessionSummary.startTime);
          parsed.sessionSummary.endTime = new Date(parsed.sessionSummary.endTime);
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
    return initialState;
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }, [state]);

  const setUserLocation = (location: Coordinates) => {
    setState(prev => ({ ...prev, userLocation: location }));
  };

  const setSelectedStation = (station: Station) => {
    setState(prev => ({ ...prev, selectedStation: station }));
  };

  const setSelectedSlot = (slot: ParkingSlot) => {
    setState(prev => ({ ...prev, selectedSlot: slot }));
  };

  const setActiveSession = (session: ChargingSession) => {
    setState(prev => ({ ...prev, activeSession: session }));
  };

  const setSessionSummary = (summary: ChargingSessionSummary) => {
    setState(prev => ({ ...prev, sessionSummary: summary }));
  };

  const setPaymentInfo = (info: PaymentInfo) => {
    setState(prev => ({ ...prev, paymentInfo: info }));
  };

  const setTransactionId = (id: string) => {
    setState(prev => ({ ...prev, transactionId: id }));
  };

  const resetState = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AppContextType = {
    state,
    setUserLocation,
    setSelectedStation,
    setSelectedSlot,
    setActiveSession,
    setSessionSummary,
    setPaymentInfo,
    setTransactionId,
    resetState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to use app context
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
