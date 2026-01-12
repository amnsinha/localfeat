import { useState } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Heart, MessageCircle, Share, MapPin, MoreHorizontal, Send, User, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CommentSection } from "./comment-section";
import { CountdownTimer } from "./countdown-timer";
import { MessageDialog } from "@/components/ui/message-dialog";
import { PostShare } from "./post-share";
import { EmojiReactions } from "../EmojiReactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistance, calculateDistance } from "@/lib/geolocation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Post } from "@shared/schema";
import { useLocation } from "wouter";

interface PostCardProps {
  post: Post;
  userLocation: { latitude: number; longitude: number } | null;
}

export function PostCard({ post, userLocation }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const likePostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setIsLiked(true);
      toast({
        title: "Post liked!",
        description: "Thanks for showing your interest",
      });
    },
    onError: (error) => {
      console.error('Like error:', error);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post deleted",
        description: "Your post has been permanently deleted",
      });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const getDistance = () => {
    if (!userLocation) return "Unknown distance";
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      post.latitude,
      post.longitude
    );
    return formatDistance(distance);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${post.authorName} is looking for activity partners`,
      text: post.content,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const text = `${post.content}\n\n#LocalFeat - Find activity partners near you!`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Shared!",
          description: "Post content copied to clipboard",
        });
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast({
      title: "Shared!",
      description: "Post content copied to clipboard",
    });
  };

  const getColorForTag = (tag: string) => {
    const colors = {
      gym: "bg-blue-100 text-blue-800",
      fitness: "bg-green-100 text-green-800",
      travel: "bg-blue-100 text-blue-800",
      study: "bg-indigo-100 text-indigo-800",
      food: "bg-yellow-100 text-yellow-800",
      music: "bg-purple-100 text-purple-800",
      hiking: "bg-green-100 text-green-800",
      morning: "bg-purple-100 text-purple-800",
      weekend: "bg-yellow-100 text-yellow-800",
      finals: "bg-red-100 text-red-800",
      library: "bg-gray-100 text-gray-800",
    };
    return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setLocation(`/profile/${post.authorId}`)}
              className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
            >
              <span>{post.authorInitials}</span>
            </button>
            <div>
              <button 
                onClick={() => setLocation(`/profile/${post.authorId}`)}
                className="hover:underline"
              >
                <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
              </button>
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <MapPin className="h-3 w-3 text-violet-500" />
                <span>{getDistance()}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
              <CountdownTimer expiresAt={post.expiresAt} className="mt-1" />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-900 text-base leading-relaxed">{post.content}</p>
        </div>
        
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.hashtags.map((tag) => (
              <Badge key={tag} className={getColorForTag(tag)}>
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Emoji Reactions */}
        <EmojiReactions 
          itemId={post.id}
          itemType="post"
          reactions={post.reactions as Record<string, number> || {}}
          className="mb-3"
        />
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => likePostMutation.mutate()}
              disabled={likePostMutation.isPending}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? "text-red-600" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  window.location.href = '/auth';
                  return;
                }
                setShowComments(!showComments);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Comment</span>
            </button>
            <PostShare 
              postId={post.id}
              postContent={post.content}
              authorName={post.authorName}
              locationName={post.locationName || "Unknown location"}
            />
          </div>
          
          {isAuthenticated && (
            <Button
              onClick={() => setShowMessageDialog(true)}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Message</span>
            </Button>
          )}
        </div>
      </div>
      
      {showComments && <CommentSection postId={post.id} />}
      
      <MessageDialog 
        isOpen={showMessageDialog}
        onClose={() => setShowMessageDialog(false)}
        recipientName={post.authorName}
        recipientId={post.authorId || ''}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostMutation.mutate()}
              disabled={deletePostMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
