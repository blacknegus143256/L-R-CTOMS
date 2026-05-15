import { useCallback, useState } from 'react';
import showNotification from '@/utils/notification';

export default function useDirections(auth) {
  const [browserLocation, setBrowserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const openGoogleMapsRoute = useCallback((originLat, originLng, destLat, destLng) => {
    if (
      originLat === undefined ||
      originLat === null ||
      originLng === undefined ||
      originLng === null ||
      destLat === undefined ||
      destLat === null ||
      destLng === undefined ||
      destLng === null
    ) {
      showNotification.error('Location coordinates are required for routing.');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const fetchBrowserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      showNotification.error('Location access is required for routing.');
      return null;
    }

    setIsLocating(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const nextLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setBrowserLocation(nextLocation);
      return nextLocation;
    } catch (error) {
      showNotification.error('Location access is required for routing.');
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handleGetDirections = useCallback((destLat, destLng) => {
    const customerLat = auth?.user?.profile?.latitude;
    const customerLng = auth?.user?.profile?.longitude;

    const hasSavedCoordinates =
      customerLat !== undefined &&
      customerLat !== null &&
      customerLng !== undefined &&
      customerLng !== null;

    if (hasSavedCoordinates) {
      openGoogleMapsRoute(customerLat, customerLng, destLat, destLng);
      return;
    }

    if (browserLocation?.lat !== undefined && browserLocation?.lat !== null && browserLocation?.lng !== undefined && browserLocation?.lng !== null) {
      openGoogleMapsRoute(browserLocation.lat, browserLocation.lng, destLat, destLng);
      return;
    }

    showNotification.error('Location access is required for routing.');
  }, [auth, browserLocation, openGoogleMapsRoute]);

  return {
    fetchBrowserLocation,
    handleGetDirections,
    isLocating,
    browserLocation,
  };
}