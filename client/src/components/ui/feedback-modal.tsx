import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Lightbulb, Bug, Send } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<"feature" | "bug">("feature");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: feedbackType,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Thank you!",
          description: feedbackType === "feature" 
            ? "Your feature suggestion has been submitted"
            : "Your bug report has been submitted",
        });
        
        // Reset form and close modal
        setContent("");
        setFeedbackType("feature");
        onClose();
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent("");
      setFeedbackType("feature");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Share Your Feedback</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What would you like to share?</Label>
            <RadioGroup
              value={feedbackType}
              onValueChange={(value: "feature" | "bug") => setFeedbackType(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature" id="feature" />
                <Label htmlFor="feature" className="flex items-center space-x-2 cursor-pointer">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>Feature Idea</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bug" id="bug" />
                <Label htmlFor="bug" className="flex items-center space-x-2 cursor-pointer">
                  <Bug className="h-4 w-4 text-red-500" />
                  <span>Bug Report</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {feedbackType === "feature" 
                ? "Describe your feature idea" 
                : "Describe the bug you encountered"}
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                feedbackType === "feature"
                  ? "I'd love to see a feature that..."
                  : "I encountered a problem when..."
              }
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {content.length}/500
            </div>
          </div>

          {!user && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Sign in to get updates on your feedback
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}