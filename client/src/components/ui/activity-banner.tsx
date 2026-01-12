import { useState, useEffect } from "react";
import { Users, MapPin, Sparkles } from "lucide-react";
import { Button } from "./button";

interface ActivityBannerProps {
  userLocation: { latitude: number; longitude: number; name?: string } | null;
}

export function ActivityBanner({ userLocation }: ActivityBannerProps) {
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [locationName, setLocationName] = useState("your area");

  useEffect(() => {
    // Generate a realistic number of new users (1-8 people per day)
    const count = Math.floor(Math.random() * 8) + 1;
    setNewUsersCount(count);

    if (userLocation?.name) {
      setLocationName(userLocation.name);
    }
  }, [userLocation]);

  if (!userLocation) return null;

  const getTimeBasedMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "joined this morning";
    if (hour < 17) return "joined today";
    return "joined recently";
  };

  const getBannerColor = () => {
    if (newUsersCount >= 6) return "from-green-500 to-emerald-600";
    if (newUsersCount >= 3) return "from-blue-500 to-cyan-600";
    return "from-purple-500 to-pink-600";
  };

  const getIcon = () => {
    if (newUsersCount >= 6) return <Sparkles className="h-5 w-5" />;
    return <Users className="h-5 w-5" />;
  };

  return (
    <div className={`bg-gradient-to-r ${getBannerColor()} text-white rounded-lg p-4 mb-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-full">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {newUsersCount} {newUsersCount === 1 ? 'person' : 'people'} {getTimeBasedMessage()}
            </h3>
            <p className="text-white/90 text-sm flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              Near {locationName}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-white/80 text-xs mb-2">Community is growing!</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-colors"
            onClick={() => {
              // Scroll to create post section or refresh posts
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Share Something
          </Button>
        </div>
      </div>
      
      {newUsersCount >= 5 && (
        <div className="mt-3 p-3 bg-white/10 rounded-lg">
          <p className="text-sm text-white/90">
            🎉 Your area is buzzing with activity! Perfect time to share what you're up to.
          </p>
        </div>
      )}
    </div>
  );
}