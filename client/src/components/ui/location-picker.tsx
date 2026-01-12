import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { MapPin, Search, X, Locate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { trackEvent, pushToDataLayer } from "@/lib/analytics";

interface LocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; locationName: string }) => void;
  onClose: () => void;
  initialLocation?: { latitude: number; longitude: number };
}

const defaultCenter = {
  lat: 28.6139, // Delhi coordinates as default
  lng: 77.2090,
};

interface MapComponentProps {
  center: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  selectedLocation: { lat: number; lng: number } | null;
}

// Declare global google maps types
declare global {
  interface Window {
    google: any;
  }
  const google: any;
}

function MapComponent({ center, onLocationSelect, selectedLocation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Initialize map
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Initialize geocoder
    geocoderRef.current = new google.maps.Geocoder();

    // Add click listener
    googleMapRef.current.addListener('click', async (event: any) => {
      if (!event.latLng || !geocoderRef.current) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Update marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        animation: google.maps.Animation.DROP,
      });

      // Get location name
      try {
        const response = await geocoderRef.current.geocode({
          location: { lat, lng },
        });

        let locationName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (response.results && response.results.length > 0) {
          locationName = response.results[0].formatted_address;
        }

        onLocationSelect(lat, lng, locationName);
      } catch (error) {
        console.error("Geocoding failed:", error);
        onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [center, onLocationSelect]);

  useEffect(() => {
    if (selectedLocation && googleMapRef.current) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new google.maps.Marker({
        position: selectedLocation,
        map: googleMapRef.current,
        animation: google.maps.Animation.DROP,
      });
      googleMapRef.current.setCenter(selectedLocation);
      googleMapRef.current.setZoom(15);
    }
  }, [selectedLocation]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}

export function LocationPicker({ onLocationSelect, onClose, initialLocation }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [locationName, setLocationName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    // Load Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setLoadError('Failed to load Google Maps');
    };

    if (!window.google) {
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleMapLocationSelect = useCallback((lat: number, lng: number, name: string) => {
    setSelectedLocation({ lat, lng });
    setLocationName(name);
    trackEvent('map_location_selected', 'location_picker', name);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google) return;

    setIsSearching(true);
    trackEvent('location_search', 'location_picker', searchQuery);
    
    const geocoder = new google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ address: searchQuery });
      
      if (response.results && response.results.length > 0) {
        const location = response.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const name = response.results[0].formatted_address;
        
        setSelectedLocation({ lat, lng });
        setLocationName(name);
        trackEvent('location_search_success', 'location_picker', name);
      } else {
        trackEvent('location_search_no_results', 'location_picker', searchQuery);
      }
    } catch (error) {
      console.error("Search failed:", error);
      trackEvent('location_search_error', 'location_picker', error.message || 'Unknown error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    trackEvent('use_my_location_clicked', 'location_picker');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (window.google) {
          const geocoder = new google.maps.Geocoder();
          try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results && response.results.length > 0) {
              const name = response.results[0].formatted_address;
              setSelectedLocation({ lat, lng });
              setLocationName(name);
              trackEvent('my_location_success', 'location_picker', name);
            }
          } catch (error) {
            console.error("Geocoding failed:", error);
            setSelectedLocation({ lat, lng });
            setLocationName(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } else {
          setSelectedLocation({ lat, lng });
          setLocationName(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please check your browser settings.");
        trackEvent('my_location_error', 'location_picker', error.message || 'Unknown error');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && locationName) {
      trackEvent('location_confirmed', 'location_picker', locationName);
      pushToDataLayer({
        event: 'location_selection_complete',
        location_name: locationName,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      });
      onLocationSelect({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        locationName: locationName,
      });
    }
  };

  if (loadError) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Location
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading Google Maps</p>
            <p className="text-sm text-gray-600 mt-2">Please check your API key and try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Location
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p>Loading Google Maps...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Box and Use My Location */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={handleUseMyLocation} 
            disabled={isGettingLocation}
            variant="outline"
            className="w-full"
          >
            <Locate className="h-4 w-4 mr-2" />
            {isGettingLocation ? "Getting your location..." : "Use My Location"}
          </Button>
        </div>

        {/* Map */}
        <div className="border rounded-lg overflow-hidden">
          <MapComponent
            center={initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : defaultCenter}
            onLocationSelect={handleMapLocationSelect}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-900">Selected Location:</p>
            <p className="text-sm text-blue-700 mt-1">{locationName}</p>
            <p className="text-xs text-blue-600 mt-1">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleConfirmLocation}
            disabled={!selectedLocation || isSearching}
            className="flex-1"
          >
            {isSearching ? "Loading..." : "Use This Location"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <p className="text-xs text-gray-600 text-center">
          Click on the map or search for a location to select it
        </p>
      </CardContent>
    </Card>
  );
}