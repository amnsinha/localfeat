import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: string;
}

export function MessageDialog({ isOpen, onClose, recipientName, recipientId }: MessageDialogProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/conversations", {
        participantId: recipientId,
      });
    },
    onSuccess: async (response) => {
      const conversationData = await response.json();
      // Send the initial message
      await sendMessageMutation.mutateAsync({
        conversationId: conversationData.id,
        content: message,
      });
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
        description: "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      return await apiRequest("POST", "/api/messages", {
        conversationId: data.conversationId,
        content: data.content,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: `Your message was sent to ${recipientName}`,
      });
      setMessage("");
      onClose();
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
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    createConversationMutation.mutate();
  };

  const isLoading = createConversationMutation.isPending || sendMessageMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Message {recipientName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Send a message to ${recipientName}...`}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!message.trim() || isLoading}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{isLoading ? "Sending..." : "Send"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}