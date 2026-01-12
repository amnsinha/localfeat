import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Comment } from "@shared/schema";
import { EmojiReactions } from "../EmojiReactions";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

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

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/posts', postId, 'comments'],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/comments', {
        postId,
        content,
        authorName: getAuthorName(),
        authorInitials: getAuthorInitials(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
      setNewComment("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest('POST', `/api/comments/${commentId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
    },
  });

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

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

  if (isLoading) {
    return (
      <div className="border-t border-gray-100 bg-gray-50 p-4">
        <div className="text-sm text-gray-500">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      <div className="p-4 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              <span>{comment.authorInitials}</span>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-semibold text-gray-900 text-sm">{comment.authorName}</h4>
                <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{formatTimeAgo(comment.createdAt)}</span>
                  <button className="hover:text-blue-600 transition-colors">Reply</button>
                  <button
                    onClick={() => likeCommentMutation.mutate(comment.id)}
                    className="flex items-center space-x-1 hover:text-red-600 transition-colors"
                    disabled={likeCommentMutation.isPending}
                  >
                    <Heart className="h-3 w-3" />
                    <span>{comment.likes}</span>
                  </button>
                </div>
                
                <EmojiReactions 
                  itemId={comment.id}
                  itemType="comment"
                  reactions={comment.reactions as Record<string, number> || {}}
                  className="scale-75"
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold">
            <span>AU</span>
          </div>
          <div className="flex-1">
            {isAuthenticated ? (
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a comment..."
                className="bg-white"
              />
            ) : (
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-full justify-start bg-white text-gray-500"
              >
                Sign in to write a comment...
              </Button>
            )}
          </div>
          {isAuthenticated && (
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              size="sm"
            >
              {createCommentMutation.isPending ? "Posting..." : "Post"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
