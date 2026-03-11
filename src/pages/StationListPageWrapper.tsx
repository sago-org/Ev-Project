import { useNavigate } from 'react-router-dom';
import { StationList } from '../components';
import { useAppContext } from '../context/AppContext';
import type { Station } from '../models';

/**
 * Station list page wrapper with routing integration
 */
export function StationListPageWrapper() {
  const navigate = useNavigate();
  const { state, setSelectedStation } = useAppContext();

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    navigate('/station-detail');
  };

  if (!state.userLocation) {
    navigate('/');
    return null;
  }

  return (
    <StationList 
      location={state.userLocation} 
      onStationSelect={handleStationSelect}
    />
  );
}
