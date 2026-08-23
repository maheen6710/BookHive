import { useState, useEffect } from "react";

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      setError("Your browser doesn't support location services.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus("granted");
      },
      (err) => {
        setStatus("denied");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Enable it to see nearby sellers."
            : "Couldn't determine your location."
        );
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  return { location, status, error };
}
