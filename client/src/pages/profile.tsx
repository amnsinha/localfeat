import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Edit2, Share2, QrCode, Copy, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/ui/navigation";
import type { UserProfile } from "@shared/schema";
import QRCode from "qrcode";
import { Link, useParams } from "wouter";

export default function Profile() {
  const { userId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const isOwnProfile = !userId || userId === user?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [editData, setEditData] = useState({
    displayName: "",
    bio: "",
    profileImageUrl: ""
  });

  // Fetch user profile (either own profile or another user's profile)
  const profileUserId = userId || user?.id;
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/profile/${profileUserId}`],
    enabled: !!profileUserId,
  });

  // Fetch the profile user's basic info when viewing someone else's profile
  const { data: profileUser } = useQuery({
    queryKey: [`/api/users/${profileUserId}`],
    enabled: !!userId && userId !== user?.id, // Only fetch when viewing someone else's profile
  });

  // Create/Update profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: typeof editData) => {
      const endpoint = profile ? `/api/profile/${user?.id}` : "/api/profile";
      const method = profile ? "PUT" : "POST";
      const response = await apiRequest(method, endpoint, { 
        ...data, 
        userId: user?.id,
        displayName: data.displayName || user?.username || "Anonymous User"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Upload to database
        const response = await apiRequest("POST", "/api/upload/profile-image", {
          imageData: base64Data,
          imageType: file.type
        });
        
        const data = await response.json();
        return { imageUrl: data.imageUrl };
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: (data: { imageUrl: string }) => {
      setEditData(prev => ({ ...prev, profileImageUrl: data.imageUrl }));
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
      toast({
        title: "Image Uploaded",
        description: "Profile picture uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const startEditing = () => {
    setEditData({
      displayName: (profile as UserProfile)?.displayName || user?.username || "",
      bio: (profile as UserProfile)?.bio || "",
      profileImageUrl: (profile as UserProfile)?.profileImageUrl || ""
    });
    setIsEditing(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate(file);
    }
  };

  const generateQRCode = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${user?.id}`;
      const qrUrl = await QRCode.toDataURL(profileUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });
      setQrCodeUrl(qrUrl);
      setShowShareModal(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const copyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${user?.id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const profileUrl = `${window.location.origin}/profile/${user?.id}`;
    const text = `Check out my LocalFeat profile!`;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + profileUrl)}`
    };
    
    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
            <Button onClick={() => window.location.href = "/auth"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayName = (profile as UserProfile)?.displayName || 
                     (isOwnProfile ? user?.username : `${profileUser?.firstName || ''} ${profileUser?.lastName || ''}`.trim()) || 
                     "Anonymous User";
  const profileImage = (profile as UserProfile)?.profileImageUrl || editData.profileImageUrl;
  const username = isOwnProfile ? user?.username : profileUser?.username;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-violet-600 hover:text-violet-700" onClick={() => window.location.href = '/'}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-semibold">Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900">Profile Dashboard</h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Show fallback on error
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {!profileImage || profileImage.includes('dicebear') ? (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  ) : null}
                </div>
                {isEditing && (
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                {isEditing && isOwnProfile ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.displayName}
                      onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Display Name"
                      maxLength={50}
                      className="text-xl font-bold"
                    />
                    <Textarea
                      value={editData.bio}
                      onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Write a short bio about yourself (max 100 characters)"
                      maxLength={100}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="text-sm text-gray-500">
                      {editData.bio.length}/100 characters
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => profileMutation.mutate(editData)}
                        disabled={profileMutation.isPending}
                      >
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
                    <Badge variant="secondary" className="mb-4">
                      @{username}
                    </Badge>
                    {(profile as UserProfile)?.bio && (
                      <p className="text-gray-600 mb-4 max-w-md">{(profile as UserProfile).bio}</p>
                    )}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {isOwnProfile && (
                        <Button onClick={startEditing} variant="outline">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                      <Button onClick={generateQRCode} variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500">Total posts created</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Likes Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500">From your posts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Member Since</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(profile as UserProfile)?.createdAt ? new Date((profile as UserProfile).createdAt!).toLocaleDateString() : "Today"}
              </div>
              <p className="text-xs text-gray-500">Join date</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation />

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Profile</DialogTitle>
            <DialogDescription>
              Share your LocalFeat profile across social platforms
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCodeUrl} alt="Profile QR Code" className="w-48 h-48 border rounded-lg" />
                <p className="text-sm text-gray-600 text-center">
                  Scan this QR code to visit your profile
                </p>
              </div>
            )}
            
            <Separator />
            
            {/* Copy Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Link</label>
              <div className="flex space-x-2">
                <Input 
                  value={`${window.location.origin}/profile/${user?.id}`}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={copyProfileLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Social Sharing */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Share on Social Media</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => shareToSocial('twitter')}
                  className="w-full"
                >
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => shareToSocial('facebook')}
                  className="w-full"
                >
                  Facebook
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => shareToSocial('linkedin')}
                  className="w-full"
                >
                  LinkedIn
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => shareToSocial('whatsapp')}
                  className="w-full"
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}