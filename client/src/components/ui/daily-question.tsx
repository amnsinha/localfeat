import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { MessageCircle, Pin, Send, Heart, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyQuestionProps {
  userLocation: { latitude: number; longitude: number; name?: string } | null;
}

const DAILY_QUESTIONS = [
  "What's your plan for Saturday?",
  "Which café nearby makes the best chai?",
  "What's the best spot for morning walks in the area?",
  "Anyone know a good place for weekend brunch?",
  "What's your favorite local restaurant?",
  "Best time to visit the gym to avoid crowds?",
  "Any good study spots with WiFi around here?",
  "Where do you go for the best street food?",
  "What's happening in the neighborhood this weekend?",
  "Best place to buy fresh groceries nearby?",
  "Anyone tried the new restaurant on Main Street?",
  "Where's the quietest place to work remotely?",
  "What's your go-to evening activity after work?",
  "Best local spot to watch the sunset?",
  "Any recommendations for a quick lunch break?"
];

export function DailyQuestion({ userLocation }: DailyQuestionProps) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [showResponses, setShowResponses] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Select question based on current day for consistency
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const questionIndex = dayOfYear % DAILY_QUESTIONS.length;
    setQuestion(DAILY_QUESTIONS[questionIndex]);
  }, []);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['/api/daily-question/responses'],
    enabled: showResponses,
  });

  const responseList = Array.isArray(responses) ? responses : [];

  const submitResponseMutation = useMutation({
    mutationFn: async (responseText: string) => {
      return apiRequest("POST", '/api/daily-question/responses', { 
        question,
        response: responseText,
        location: userLocation?.name || 'Unknown'
      });
    },
    onSuccess: () => {
      setResponse("");
      queryClient.invalidateQueries({ queryKey: ['/api/daily-question/responses'] });
      toast({
        title: "Response shared!",
        description: "Your response has been added to today's discussion.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share response",
        variant: "destructive",
      });
    },
  });

  const handleSubmitResponse = () => {
    if (!response.trim()) return;
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    submitResponseMutation.mutate(response.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-100 rounded-full">
            <Pin className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Daily Question</h3>
            <p className="text-xs text-gray-500">{getTimeOfDay()} • {userLocation?.name || 'Your Area'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Refreshes daily</span>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-2">"{question}"</h2>
        <p className="text-sm text-gray-600">
          Share your thoughts and see what others in your area are saying!
        </p>
      </div>

      {/* Response Input */}
      <div className="mb-4">
        {isAuthenticated ? (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <Input
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your answer..."
                className="bg-white border-indigo-200 focus:border-indigo-400"
                disabled={submitResponseMutation.isPending}
              />
            </div>
            <Button
              onClick={handleSubmitResponse}
              disabled={!response.trim() || submitResponseMutation.isPending}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => window.location.href = '/api/login'}
            variant="outline"
            className="w-full justify-start bg-white text-gray-600 border-indigo-200 hover:bg-indigo-50"
          >
            Sign in to share your answer...
          </Button>
        )}
      </div>

      {/* View Responses */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResponses(!showResponses)}
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {showResponses ? 'Hide responses' : `View responses${responseList.length > 0 ? ` (${responseList.length})` : ''}`}
        </Button>

        {responseList.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Heart className="h-3 w-3" />
            <span>{responseList.length} {responseList.length === 1 ? 'person' : 'people'} responded</span>
          </div>
        )}
      </div>

      {/* Responses */}
      {showResponses && (
        <div className="mt-4 pt-4 border-t border-indigo-100">
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading responses...</div>
          ) : responseList.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">No responses yet</p>
              <p className="text-xs text-gray-400">Be the first to share your answer!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responseList.slice(0, 5).map((resp: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {resp.authorName?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900">{resp.authorName || 'Anonymous'}</span>
                        <span className="text-xs text-gray-500">{resp.location}</span>
                      </div>
                      <p className="text-sm text-gray-700">{resp.response}</p>
                    </div>
                  </div>
                </div>
              ))}
              {responseList.length > 5 && (
                <Button variant="ghost" size="sm" className="text-indigo-600 text-xs">
                  View all {responseList.length} responses
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}