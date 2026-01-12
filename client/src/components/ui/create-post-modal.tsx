import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { MultiSelectHashtags } from "./multi-select-hashtags";
import { MapPin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const HASHTAG_OPTIONS = ["gym", "travel", "study", "food", "music", "hiking", "fitness", "morning", "weekend", "library"];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number; locationName?: string } | null;
  onPostCreated: () => void;
}

export function CreatePostModal({ isOpen, onClose, userLocation, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const getAuthorName = () => {
    if (!user) return "Anonymous User";
    return user.firstName || user.username || "User";
  };

  const getAuthorInitials = () => {
    if (!user) return "AU";
    if (user.firstName) {
      const names = user.firstName.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.firstName.substring(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }

    if (!userLocation) {
      toast({
        title: "Error",
        description: "Location is required to create a post",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          authorName: getAuthorName(),
          authorInitials: getAuthorInitials(),
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          locationName: userLocation.locationName || "Unknown location",
          hashtags: selectedHashtags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Post creation error:', errorData);
        throw new Error(errorData.message || 'Failed to create post');
      }

      toast({
        title: "Success",
        description: "Your post has been created!",
      });

      setContent("");
      setSelectedHashtags([]);
      onClose();
      onPostCreated();
    } catch (error) {
      console.error('Post creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you looking for?
            </label>
            <Textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe what you're looking for... (e.g., Need a gym buddy for morning workouts)"
              className="resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tags
            </label>
            <MultiSelectHashtags
              availableHashtags={HASHTAG_OPTIONS}
              selectedHashtags={selectedHashtags}
              onSelectionChange={setSelectedHashtags}
            />
          </div>
          
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-violet-700">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Location automatically detected</span>
            </div>
            <p className="text-sm text-violet-600 mt-1">
              {userLocation?.locationName || "Getting location..."}
            </p>
            <p className="text-xs text-violet-500 mt-1">
              Only users within 1km will see your post
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !userLocation}>
            {isSubmitting ? "Posting..." : "Post Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
