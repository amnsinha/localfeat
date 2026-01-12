import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Loader2, Bot, Zap, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminPanelProps {
  userLocation: { latitude: number; longitude: number } | null;
}

export function AdminPanel({ userLocation }: AdminPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  const seedActivityMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/seed-activity", userLocation);
    },
    onSuccess: () => {
      toast({
        title: "Activity Seeding Started",
        description: "The bot is now creating posts and engagement in your area.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start activity seeding",
        variant: "destructive",
      });
    },
  });

  const createBotPostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/bot-post", userLocation);
    },
    onSuccess: () => {
      toast({
        title: "Bot Post Created",
        description: "A new bot post has been added to the feed.",
      });
      // Refresh the page to show new content
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bot post",
        variant: "destructive",
      });
    },
  });

  // Secret key combination to show admin panel
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      setIsVisible(!isVisible);
    }
  };

  if (!isVisible) {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        onKeyDown={handleKeyPress}
        tabIndex={-1}
      />
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50" onKeyDown={handleKeyPress} tabIndex={0}>
      <Card className="w-80 bg-gray-900 text-white border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Bot className="h-5 w-5 text-blue-400" />
            <span>Activity Bot Panel</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Tools to boost engagement in low-activity areas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => seedActivityMutation.mutate()}
            disabled={seedActivityMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {seedActivityMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Seed Full Activity
          </Button>
          
          <Button
            onClick={() => createBotPostMutation.mutate()}
            disabled={createBotPostMutation.isPending}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            size="sm"
          >
            {createBotPostMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Create Single Post
          </Button>

          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-2">
              Press Ctrl+Shift+A to toggle panel
            </p>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="w-full text-gray-400 hover:text-white"
            >
              Hide Panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}