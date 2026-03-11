import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the landing page with search interface', () => {
    render(<LandingPage />);
    
    // Check for main heading (Requirement 1.1)
    expect(screen.getByRole('heading', { name: /EV Charging Station Finder/i })).toBeInTheDocument();
    
    // Check for location detection button (Requirement 1.2)
    expect(screen.getByRole('button', { name: /Detect my current location/i })).toBeInTheDocument();
    
    // Check for instructions (Requirement 1.3)
    expect(screen.getByText(/How to use:/i)).toBeInTheDocument();
  });

  it('displays usage instructions', () => {
    render(<LandingPage />);
    
    // Verify all instruction steps are present (Requirement 1.3)
    expect(screen.getByText(/Click "Detect My Location" to automatically find your position/i)).toBeInTheDocument();
    expect(screen.getByText(/Or enter your location manually/i)).toBeInTheDocument();
    expect(screen.getByText(/View nearby charging stations sorted by distance/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a station to see available parking slots/i)).toBeInTheDocument();
    expect(screen.getByText(/Start charging and complete payment when done/i)).toBeInTheDocument();
  });

  it('shows manual entry button initially', () => {
    render(<LandingPage />);
    
    // Manual entry toggle should be visible
    expect(screen.getByRole('button', { name: /Enter location manually/i })).toBeInTheDocument();
  });

  it('shows manual entry form when manual entry button is clicked', async () => {
    render(<LandingPage />);
    
    const manualEntryButton = screen.getByRole('button', { name: /Enter location manually/i });
    fireEvent.click(manualEntryButton);
    
    // Manual entry form should appear (Requirement 2.3)
    await waitFor(() => {
      expect(screen.getByLabelText(/Enter your address or location:/i)).toBeInTheDocument();
    });
  });

  it('displays error message when manual location is submitted empty', async () => {
    render(<LandingPage />);
    
    // Click manual entry button
    const manualEntryButton = screen.getByRole('button', { name: /Enter location manually/i });
    fireEvent.click(manualEntryButton);
    
    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Enter your address or location:/i)).toBeInTheDocument();
    });
    
    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /Submit manual location/i });
    fireEvent.click(submitButton);
    
    // Error message should appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Please enter a valid address/i);
    });
  });

  it('disables location detection button while detecting', async () => {
    // Mock geolocation API
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        // Simulate a delay
        setTimeout(() => {
          success({
            coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10,
            },
          });
        }, 100);
      }),
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
    
    render(<LandingPage />);
    
    const detectButton = screen.getByRole('button', { name: /Detect my current location/i });
    fireEvent.click(detectButton);
    
    // Button should be disabled while detecting
    expect(detectButton).toBeDisabled();
    expect(detectButton).toHaveTextContent(/Detecting Location.../i);
    
    // Wait for detection to complete
    await waitFor(() => {
      expect(detectButton).not.toBeDisabled();
    });
  });

  it('calls onLocationDetected callback when location is detected', async () => {
    const mockCallback = vi.fn();
    
    // Mock geolocation API
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
          },
        });
      }),
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
    
    render(<LandingPage onLocationDetected={mockCallback} />);
    
    const detectButton = screen.getByRole('button', { name: /Detect my current location/i });
    fireEvent.click(detectButton);
    
    // Callback should be called with coordinates (Requirement 2.2)
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      });
    });
  });

  it('displays coordinates when location is detected', async () => {
    // Mock geolocation API
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
          },
        });
      }),
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
    
    render(<LandingPage />);
    
    const detectButton = screen.getByRole('button', { name: /Detect my current location/i });
    fireEvent.click(detectButton);
    
    // Coordinates should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Location detected:/i)).toBeInTheDocument();
      expect(screen.getByText(/Latitude: 37.774900, Longitude: -122.419400/i)).toBeInTheDocument();
    });
  });

  it('shows manual entry form when location permission is denied', async () => {
    // Mock geolocation API with permission denied error
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success, error) => {
        const geolocationError = {
          code: 1, // PERMISSION_DENIED
          message: 'User denied geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };
        error(geolocationError);
      }),
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
    
    render(<LandingPage />);
    
    const detectButton = screen.getByRole('button', { name: /Detect my current location/i });
    fireEvent.click(detectButton);
    
    // Manual entry form should appear (Requirement 2.3)
    await waitFor(() => {
      expect(screen.getByLabelText(/Enter your address or location:/i)).toBeInTheDocument();
    });
    
    // Error message should be displayed
    expect(screen.getByRole('alert')).toHaveTextContent(/Location access denied/i);
  });
});
