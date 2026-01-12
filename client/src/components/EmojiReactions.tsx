import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Smile, Plus } from "lucide-react";

interface EmojiReactionsProps {
  itemId: string;
  itemType: "post" | "comment";
  reactions: Record<string, number>;
  className?: string;
}

const popularEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "💯", "🎉"];

export function EmojiReactions({ itemId, itemType, reactions, className = "" }: EmojiReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest("POST", `/api/${itemType}s/${itemId}/reactions`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/comments", itemId] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add reaction",
        variant: "destructive",
      });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest("DELETE", `/api/${itemType}s/${itemId}/reactions`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/comments", itemId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove reaction",
        variant: "destructive",
      });
    },
  });

  const handleEmojiClick = async (emoji: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react to posts",
        variant: "destructive",
      });
      return;
    }

    // If user already reacted with this emoji, remove it; otherwise add it
    // For simplicity, we'll just add the reaction (server handles the logic)
    try {
      await addReactionMutation.mutateAsync(emoji);
    } catch (error) {
      // If adding fails, it might be because user already reacted, try removing
      await removeReactionMutation.mutateAsync(emoji);
    }
  };

  const handleExistingReactionClick = async (emoji: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react to posts",
        variant: "destructive",
      });
      return;
    }

    await removeReactionMutation.mutateAsync(emoji);
  };

  const reactionEntries = Object.entries(reactions).filter(([_, count]) => count > 0);

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {/* Existing reactions */}
      {reactionEntries.map(([emoji, count]) => (
        <Button
          key={emoji}
          variant="outline"
          size="sm"
          className="h-7 px-2 py-1 text-xs hover:bg-gray-50 border-gray-200"
          onClick={() => handleExistingReactionClick(emoji)}
          disabled={removeReactionMutation.isPending}
        >
          <span className="mr-1">{emoji}</span>
          <span className="text-gray-600">{count}</span>
        </Button>
      ))}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            disabled={addReactionMutation.isPending}
          >
            {reactionEntries.length === 0 ? <Smile className="h-4 w-4" /> : <Plus className="h-3 w-3" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {popularEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                onClick={() => handleEmojiClick(emoji)}
                disabled={addReactionMutation.isPending}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}