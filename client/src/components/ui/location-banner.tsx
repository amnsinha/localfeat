import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "./button";
import { getCurrentLocation } from "@/lib/geolocation";

interface LocationBannerProps {
  onLocationGranted: (location: { latitude: number; longitude: number }) => void;
}

export function LocationBanner({ onLocationGranted }: LocationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const hasLocationPermission = localStorage.getItem('locationPermissionHandled');
    const savedLocation = localStorage.getItem('userLocation');
    
    // Only show banner if no permission handled AND no saved location
    if ((!hasLocationPermission || hasLocationPermission === 'dismissed') && !savedLocation) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestLocation = async () => {
    setIsRequesting(true);
    try {
      console.log('Banner requesting location...');
      const location = await getCurrentLocation();
      console.log('Banner got location:', location);
      localStorage.setItem('locationPermissionHandled', 'true');
      localStorage.setItem('userLocation', JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude
      }));
      onLocationGranted(location);
      setIsVisible(false);
      console.log('Location saved and banner hidden');
    } catch (error) {
      console.error('Banner location request failed:', error);
      // Don't hide the banner on error, let user try again
      const errorMessage = error instanceof Error ? error.message : 'Location access failed';
      alert(`${errorMessage}\n\nTo enable location:\n1. Click the location icon in your browser's address bar\n2. Select "Allow" for location access\n3. Refresh the page`);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('locationPermissionHandled', 'dismissed');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="h-5 w-5 text-blue-200" />
          <div>
            <p className="font-medium">Enable location access</p>
            <p className="text-sm text-blue-200">We need your location to show nearby posts and requests</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white hover:bg-blue-700"
          >
            Later
          </Button>
          <Button
            onClick={handleRequestLocation}
            disabled={isRequesting}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            {isRequesting ? "Getting location..." : "Allow Location"}
          </Button>
        </div>
      </div>
    </div>
  );
}
