import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary, ProtectedRoute } from './components';
import {
  LandingPageWrapper,
  StationListPageWrapper,
  StationDetailPageWrapper,
  ChargingSessionPageWrapper,
  ChargingSummaryPageWrapper,
  PaymentPageWrapper,
  ReceiptPageWrapper,
} from './pages';

/**
 * Main application component with routing and error handling
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <div className="app">
            <Routes>
              {/* Landing page - no protection needed */}
              <Route path="/" element={<LandingPageWrapper />} />

              {/* Station list - requires location */}
              <Route
                path="/stations"
                element={
                  <ProtectedRoute requireLocation>
                    <StationListPageWrapper />
                  </ProtectedRoute>
                }
              />

              {/* Station detail - requires location and station */}
              <Route
                path="/station-detail"
                element={
                  <ProtectedRoute requireLocation requireStation>
                    <StationDetailPageWrapper />
                  </ProtectedRoute>
                }
              />

              {/* Charging session - requires location, station, and slot */}
              <Route
                path="/charging"
                element={
                  <ProtectedRoute requireLocation requireStation requireSlot>
                    <ChargingSessionPageWrapper />
                  </ProtectedRoute>
                }
              />

              {/* Charging summary - requires session summary */}
              <Route
                path="/summary"
                element={
                  <ProtectedRoute requireSummary>
                    <ChargingSummaryPageWrapper />
                  </ProtectedRoute>
                }
              />

              {/* Payment - requires session summary */}
              <Route
                path="/payment"
                element={
                  <ProtectedRoute requireSummary>
                    <PaymentPageWrapper />
                  </ProtectedRoute>
                }
              />

              {/* Receipt - requires session summary and transaction */}
              <Route
                path="/receipt"
                element={
                  <ProtectedRoute requireSummary>
                    <ReceiptPageWrapper />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
