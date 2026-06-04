import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    const success = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError(null);
    };

    const handleError = () => {
      setError('Unable to retrieve your location');
    };

    navigator.geolocation.getCurrentPosition(success, handleError);
  }, []);

  return { location, error };
}
