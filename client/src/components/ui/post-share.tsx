import { useState } from "react";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Input } from "./input";
import { Separator } from "./separator";
import { useToast } from "@/hooks/use-toast";

interface PostShareProps {
  postId: string;
  postContent: string;
  authorName: string;
  locationName?: string;
}

export function PostShare({ postId, postContent, authorName, locationName }: PostShareProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = `Check out this post by ${authorName} on LocalFeat: "${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`;
  
  const copyPostLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Post link copied to clipboard",
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
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(postUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + postUrl)}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`
    };
    
    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>
            Share this post from {authorName} {locationName && `in ${locationName}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Post Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-3">{postContent}</p>
            <p className="text-xs text-gray-500 mt-1">— {authorName}</p>
          </div>
          
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Link</label>
            <div className="flex space-x-2">
              <Input 
                value={postUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={copyPostLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Social Sharing */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share on Social Media</label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => shareToSocial('twitter')}
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => shareToSocial('facebook')}
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                onClick={() => shareToSocial('linkedin')}
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button 
                variant="outline" 
                onClick={() => shareToSocial('whatsapp')}
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                onClick={() => shareToSocial('telegram')}
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Telegram
              </Button>
              <Button 
                variant="outline" 
                onClick={() => shareToSocial('reddit')}
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Reddit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}