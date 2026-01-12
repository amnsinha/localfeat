import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/ui/post-card";
import { CreatePostModal } from "@/components/ui/create-post-modal";
import { LocationBanner } from "@/components/ui/location-banner";
import { LocationPicker } from "@/components/ui/location-picker";
import { SearchBar } from "@/components/ui/search-bar";
import { MultiSelectHashtags } from "@/components/ui/multi-select-hashtags";
import { DonationBanner } from "@/components/ui/donation-banner";
import { Plus, Search, Bell, MapPin, Filter, X, LogOut, Heart, MessageCircle, MessageSquare, User, BarChart3, BookOpen, Copy } from "lucide-react";
import { getCurrentLocation } from "@/lib/geolocation";
import { useAuth } from "@/hooks/useAuth";
import localFeatIcon from "@assets/Gemini_Generated_Image_jl3yyjjl3yyjjl3y_1754341702424.png";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { trackEvent } from "@/lib/analytics";
import { useSeo } from "@/hooks/useSeo";
import type { Post } from "@shared/schema";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { EmojiReactions } from "@/components/EmojiReactions";
import { ActivityBanner } from "@/components/ui/activity-banner";
import { DailyQuestion } from "@/components/ui/daily-question";
import { AdminPanel } from "@/components/ui/admin-panel";
import { Navigation } from "@/components/ui/navigation";
import { PostShare } from "@/components/ui/post-share";

import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const HASHTAG_FILTERS = ["gym", "travel", "study", "food", "music", "hiking", "fitness", "morning", "weekend", "library"];
const POPULAR_HASHTAGS = ["gym", "study", "food", "travel", "hiking", "fitness", "music", "morning"];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // SEO optimization for home page
  useSeo({
    title: "LocalFeat - Find Activity Partners Near You",
    description: "Connect with like-minded people within 1km of your location. Find gym buddies, study partners, hiking companions, and more in your local community.",
    keywords: "local community, activity partners, gym buddy, study partner, hiking companion, neighborhood activities, local events",
    canonical: "https://localfeat.com/"
  });
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; locationName?: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [allLoadedPosts, setAllLoadedPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // Simple approach - check for saved location first
    const savedLocation = localStorage.getItem('userLocation');
    
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation({ 
          latitude: location.latitude, 
          longitude: location.longitude, 
          locationName: location.locationName || "Your location"
        });
        return;
      } catch (error) {
        console.error('Invalid saved location, clearing:', error);
        localStorage.removeItem('userLocation');
        localStorage.removeItem('locationPermissionHandled');
      }
    }
    
    // If no saved location, show location setup screen
    // Don't attempt automatic location access to avoid permission loops
  }, []);

  // Load initial posts
  const { data: initialPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts', userLocation?.latitude, userLocation?.longitude, selectedHashtags, searchQuery],
    enabled: !!userLocation,
    queryFn: async () => {
      if (!userLocation) return [];
      
      const params = new URLSearchParams({
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString(),
        limit: '10',
        offset: '0',
      });

      if (selectedHashtags.length > 0) {
        params.append('hashtag', selectedHashtags[0]);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const posts = await response.json();
      
      // Reset pagination state when filters change
      setAllLoadedPosts(posts);
      setCurrentPage(0);
      setHasMorePosts(posts.length === 10);
      
      return posts;
    }
  });

  // Load more posts function
  const loadMorePosts = async () => {
    if (!userLocation || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const params = new URLSearchParams({
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString(),
        limit: '10',
        offset: (nextPage * 10).toString(),
      });

      if (selectedHashtags.length > 0) {
        params.append('hashtag', selectedHashtags[0]);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/posts?${params}`);
      if (response.ok) {
        const newPosts = await response.json();
        setAllLoadedPosts(prev => [...prev, ...newPosts]);
        setCurrentPage(nextPage);
        setHasMorePosts(newPosts.length === 10);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Query for initial posts for "Currently Active Near You" section
  const { data: queryPosts = [], isLoading: isLoadingAllPosts } = useQuery<Post[]>({
    queryKey: ['/api/posts/nearby', userLocation?.latitude, userLocation?.longitude],
    enabled: !!userLocation && currentPage === 0,
    queryFn: async () => {
      if (!userLocation) return [];
      
      const params = new URLSearchParams({
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString(),
        limit: '10',
        offset: '0'
      });

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const posts = await response.json();
      setAllLoadedPosts(posts);
      setHasMorePosts(posts.length === 10);
      return posts;
    }
  });

  // All posts for display (initial + loaded via pagination)
  const allPostsNearby = allLoadedPosts;

  const handleLocationGranted = async (location: { latitude: number; longitude: number }) => {
    try {
      const fullLocation = await getCurrentLocation();
      setUserLocation(fullLocation);
    } catch (error) {
      setUserLocation(location);
    }
  };

  const handleRequestLocationManually = async () => {
    try {
      setIsLoadingLocation(true);
      const location = await getCurrentLocation();
      localStorage.setItem('locationPermissionHandled', 'true');
      localStorage.setItem('userLocation', JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        locationName: location.locationName
      }));
      setUserLocation(location);
      setIsLoadingLocation(false);
      toast({
        title: "Success",
        description: "Location access enabled successfully!",
      });
    } catch (error) {
      setIsLoadingLocation(false);
      toast({
        title: "Location Access Failed",
        description: error instanceof Error ? error.message : "Please try the manual location option below.",
        variant: "destructive",
      });
    }
  };

  const handleManualLocationEntry = (lat: number, lng: number, name: string) => {
    const location = { latitude: lat, longitude: lng, locationName: name };
    localStorage.setItem('locationPermissionHandled', 'true');
    localStorage.setItem('userLocation', JSON.stringify({
      latitude: lat,
      longitude: lng,
      locationName: name
    }));
    setUserLocation(location);
    trackEvent('location_set', 'user_action', name);
    toast({
      title: "Success",
      description: `Location set to ${name}`,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      trackEvent('search_posts', 'search', query);
    }
  };

  const handleClearFilters = () => {
    setSelectedHashtags([]);
    setSearchQuery("");
  };

  const handlePostCreated = () => {
    // Refresh posts by invalidating query cache and resetting pagination
    queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    setCurrentPage(0);
    setAllLoadedPosts([]);
    setHasMorePosts(true);
  };

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LocationBanner onLocationGranted={handleLocationGranted} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-6">
              <img 
                src={localFeatIcon} 
                alt="LocalFeat" 
                className="w-16 h-16 mx-auto rounded-full mb-4"
              />
              <MapPin className={`h-12 w-12 text-gray-400 mx-auto mb-4 ${isLoadingLocation ? 'animate-pulse' : ''}`} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isLoadingLocation ? "Getting Your Location..." : "Location Access Required"}
            </h2>
            <p className="text-gray-600 mb-6">
              {isLoadingLocation 
                ? "Please allow location access when prompted by your browser."
                : "LocalFeat needs your location to show nearby posts and connect you with your local community within a 1km radius."
              }
            </p>
            <div className="space-y-4">
              <Button 
                onClick={handleRequestLocationManually}
                disabled={isLoadingLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <MapPin className={`h-4 w-4 mr-2 ${isLoadingLocation ? 'animate-pulse' : ''}`} />
                {isLoadingLocation ? "Getting Location..." : "Try Auto Location"}
              </Button>
              
              <div className="text-center text-gray-500">
                <p className="text-sm mb-3">Or choose your location manually:</p>
              </div>
              
              <Button 
                onClick={() => setShowLocationPicker(true)}
                variant="outline"
                size="lg"
                className="w-full mb-4 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Search className="h-4 w-4 mr-2" />
                Select on Map
              </Button>
              
              <div className="text-center text-gray-500">
                <p className="text-xs mb-3">Quick city selection:</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleManualLocationEntry(28.6139, 77.2090, "New Delhi")}
                  variant="outline"
                  className="text-left justify-start"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  New Delhi
                </Button>
                <Button 
                  onClick={() => handleManualLocationEntry(19.0760, 72.8777, "Mumbai")}
                  variant="outline"
                  className="text-left justify-start"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  Mumbai
                </Button>
                <Button 
                  onClick={() => handleManualLocationEntry(12.9716, 77.5946, "Bangalore")}
                  variant="outline"
                  className="text-left justify-start"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  Bangalore
                </Button>
                <Button 
                  onClick={() => handleManualLocationEntry(13.0827, 80.2707, "Chennai")}
                  variant="outline"
                  className="text-left justify-start"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  Chennai
                </Button>
                <Button 
                  onClick={() => handleManualLocationEntry(22.5726, 88.3639, "Kolkata")}
                  variant="outline"
                  className="text-left justify-start"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  Kolkata
                </Button>
                <Button 
                  onClick={() => handleManualLocationEntry(17.3850, 78.4867, "Hyderabad")}
                  variant="outline"
                  className="text-left justify-start"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  Hyderabad
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
                <p className="font-semibold mb-1">Note:</p>
                <p>You can choose any city to start exploring LocalFeat. You'll see posts from that area and can create your own posts there.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Donation Banner */}
      <DonationBanner />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={localFeatIcon} 
                  alt="LocalFeat" 
                  className="w-8 h-8 rounded-full"
                />
                <h1 className="text-xl font-bold text-gray-900">LocalFeat</h1>
              </div>
              <button 
                onClick={() => setShowLocationPicker(true)}
                className="flex items-center text-sm text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-full transition-colors cursor-pointer"
                title="Click to change location"
              >
                <MapPin className="h-3 w-3 mr-2" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {userLocation.locationName || "Current location"}, 1km radius
                </span>
                <Search className="h-3 w-3 ml-2 opacity-60" />
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated && user && (
                <Button
                  onClick={() => window.location.href = '/messages'}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Messages</span>
                </Button>
              )}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden hover:ring-2 hover:ring-violet-300 transition-all">
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.firstName || user.username || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (user.firstName || user.username || 'User').charAt(0).toUpperCase()
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/blog'}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Blog</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFeedbackModalOpen(true)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Feedback</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        trackEvent('click_logout', 'authentication', 'header');
                        try {
                          await fetch('/api/auth/logout', { method: 'POST' });
                          window.location.href = '/';
                        } catch (error) {
                          window.location.href = '/';
                        }
                      }}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => {
                    trackEvent('click_sign_in', 'authentication', 'header');
                    window.location.href = '/auth';
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <span>Sign In</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <SearchBar onSearch={handleSearch} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {(selectedHashtags.length > 0 || searchQuery) && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {selectedHashtags.length + (searchQuery ? 1 : 0)}
                  </span>
                )}
              </Button>
              {(selectedHashtags.length > 0 || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="pt-3 border-t border-gray-100">
                <MultiSelectHashtags
                  availableHashtags={HASHTAG_FILTERS}
                  selectedHashtags={selectedHashtags}
                  onSelectionChange={setSelectedHashtags}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <main className="flex-1 max-w-4xl">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : allLoadedPosts.length === 0 ? (
          selectedHashtags.length === 0 && searchQuery === "" ? (
            // Welcome content when no filters are applied
            <div className="max-w-3xl mx-auto text-center py-12">
              <div className="mb-6">
                <img 
                  src={localFeatIcon} 
                  alt="LocalFeat" 
                  className="w-16 h-16 mx-auto rounded-full"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why LocalFeat?</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Find activity partners within 1km of your location. Whether you're looking for a gym buddy, 
                study partner, hiking companion, or someone to grab coffee with - connect with like-minded 
                people in your neighborhood.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location-Based</h3>
                  <p className="text-sm text-gray-600">Connect with people within 1km radius of your current location</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Activity Matching</h3>
                  <p className="text-sm text-gray-600">Use hashtags to find people with similar interests and activities</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Direct Messaging</h3>
                  <p className="text-sm text-gray-600">Securely message and coordinate activities with potential partners</p>
                </div>
              </div>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <Button onClick={() => setIsCreateModalOpen(true)} size="lg" className="bg-violet-600 hover:bg-violet-700">
                    Create Your First Post
                  </Button>
                  <p className="text-sm text-gray-500">Share what activity you're looking for and connect with nearby people</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => window.location.href = '/auth'} size="lg" className="bg-violet-600 hover:bg-violet-700">
                    Sign In to Get Started
                  </Button>
                  <p className="text-sm text-gray-500">Join our community and start finding activity partners today</p>
                </div>
              )}
            </div>
          ) : (
            // Empty state when filters are applied
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">
                No posts match your current filters. Try adjusting your search or hashtag filters.
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {/* Daily Question */}
            <DailyQuestion userLocation={userLocation} />
            
            {/* Activity Banner */}
            <ActivityBanner userLocation={userLocation} />
            
            {/* Filtered Posts Section */}
            {(selectedHashtags.length > 0 || searchQuery) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 
                   selectedHashtags.length > 0 ? `Posts tagged #${selectedHashtags[0]}` : 'Filtered Posts'}
                </h3>
                <div className="space-y-6">
                  {allLoadedPosts.map((post) => (
                    <PostCard key={post.id} post={post} userLocation={userLocation} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Currently Active Near You Section */}
            {!(selectedHashtags.length > 0 || searchQuery) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Active Near You</h3>
                <div className="space-y-6">
                  {allPostsNearby.map((post: Post) => (
                    <PostCard key={post.id} post={post} userLocation={userLocation} />
                  ))}
                </div>
              </div>
            )}
            
            {(selectedHashtags.length === 0 && !searchQuery && allPostsNearby.length === 0) && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <MessageCircle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to post in your area and start connecting with your neighbors!
                </p>
                {isAuthenticated && (
                  <Button onClick={() => setIsCreateModalOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                    Create First Post
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Load More Button */}
        {hasMorePosts && allPostsNearby.length > 0 && !(selectedHashtags.length > 0 || searchQuery) && (
          <div className="text-center py-8">
            <Button 
              variant="outline" 
              onClick={loadMorePosts}
              disabled={isLoadingMore || isLoadingAllPosts}
            >
              {isLoadingMore ? 'Loading...' : 'Load More Posts'}
            </Button>
          </div>
        )}
          </main>
          
          {/* Popular Hashtags Sidebar */}
          <aside className="w-80 hidden lg:block">
            <div className="sticky top-32 space-y-6">
              {/* Popular Hashtags */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Hashtags</h3>
                <div className="space-y-3">
                  {POPULAR_HASHTAGS.map((hashtag) => (
                    <button
                      key={hashtag}
                      onClick={() => {
                        setSelectedHashtags([hashtag]);
                        setSearchQuery("");
                        trackEvent('click_popular_hashtag', 'hashtag', hashtag);
                      }}
                      className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-violet-700">
                        #{hashtag}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-violet-100 group-hover:text-violet-600">
                        Popular
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <>
                      <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full bg-violet-600 hover:bg-violet-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Post
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/messages'}
                        variant="outline"
                        className="w-full"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Messages
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => window.location.href = '/auth'}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                    >
                      Sign In to Post
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Location Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Location</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-violet-600" />
                    <span>{userLocation?.locationName || "Current location"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-4 h-4 bg-violet-100 rounded-full mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                    </div>
                    <span>1km radius</span>
                  </div>
                  <Button 
                    onClick={() => setShowLocationPicker(true)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Change Location
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Action Button */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => {
              setIsCreateModalOpen(true);
              trackEvent('open_create_post', 'post', 'floating_button');
            }}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userLocation={userLocation}
        onPostCreated={handlePostCreated}
      />

      <LocationBanner onLocationGranted={handleLocationGranted} />
      
      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <LocationPicker
            onLocationSelect={({ latitude, longitude, locationName }) => {
              handleManualLocationEntry(latitude, longitude, locationName);
              setShowLocationPicker(false);
            }}
            onClose={() => setShowLocationPicker(false)}
            initialLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : undefined}
          />
        </div>
      )}
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img 
                src={localFeatIcon} 
                alt="LocalFeat" 
                className="w-6 h-6 rounded-full"
              />
              <span className="text-gray-600 font-medium">LocalFeat</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              A non-profit community platform sustained by community donations
            </p>
            <Button
              onClick={() => {
                const upiId = 'aman.sri651@ybl';
                const upiLink = `upi://pay?pa=${upiId}&pn=LocalFeat&mc=0000&mode=02&purpose=00`;
                
                const upiWindow = window.open(upiLink, '_blank');
                
                setTimeout(() => {
                  if (!upiWindow || upiWindow.closed) {
                    navigator.clipboard.writeText(upiId).then(() => {
                      toast({
                        title: "UPI ID Copied!",
                        description: `${upiId} has been copied to your clipboard`,
                      });
                    }).catch(() => {
                      alert(`UPI ID: ${upiId}\n\nThis has been copied to your clipboard. Use any UPI app to make a donation.`);
                    });
                  }
                }, 1000);
              }}
              className="bg-green-600 hover:bg-green-700 text-white mb-4"
              size="sm"
            >
              <Heart className="h-4 w-4 mr-2" />
              Donate via UPI
            </Button>
            <p className="text-xs text-gray-400 mb-2">
              Connecting people through shared activities and local community building
            </p>
            <p className="text-xs text-gray-400">
              Built with 💙 in India, Data never sold
            </p>
          </div>
        </div>
      </footer>
      
      {/* Admin Panel */}
      <AdminPanel userLocation={userLocation} />
      
      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
}
