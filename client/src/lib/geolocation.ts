export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends Coordinates {
  locationName?: string;
}

export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    // First check permission state if available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'denied') {
          reject(new Error("Location access was denied. Please click the location icon in your browser's address bar and select 'Allow', then refresh the page."));
          return;
        }
        requestLocation();
      }).catch(() => {
        // Fallback if permissions API not available
        requestLocation();
      });
    } else {
      requestLocation();
    }

    function requestLocation() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get location name using reverse geocoding
          getLocationName(latitude, longitude)
            .then(locationName => {
              resolve({
                latitude,
                longitude,
                locationName,
              });
            })
            .catch(() => {
              // If reverse geocoding fails, just return coordinates
              resolve({
                latitude,
                longitude,
                locationName: "Unknown location",
              });
            });
        },
        (error) => {
          let errorMessage = "Location access failed";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access was denied. Please click the location icon in your browser's address bar and select 'Allow', then refresh the page.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please check your device's location services.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false, // Less accurate but more reliable
          timeout: 15000, // 15 seconds
          maximumAge: 0, // Don't use cached location to avoid permission issues
        }
      );
    }
  });
}

async function getLocationName(latitude: number, longitude: number): Promise<string> {
  // For demo purposes, return a generic location name
  // In production, you would use a geocoding service like Google Maps API
  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    return "< 0.1km away";
  }
  return `${distance.toFixed(1)}km away`;
}
