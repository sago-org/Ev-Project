import { useNavigate } from 'react-router-dom';
import { LandingPage } from '../components';
import { useAppContext } from '../context/AppContext';
import type { Coordinates } from '../models';

/**
 * Landing page wrapper with routing integration
 */
export function LandingPageWrapper() {
  const navigate = useNavigate();
  const { setUserLocation } = useAppContext();

  const handleLocationDetected = (coordinates: Coordinates) => {
    setUserLocation(coordinates);
    navigate('/stations');
  };

  return <LandingPage onLocationDetected={handleLocationDetected} />;
}
