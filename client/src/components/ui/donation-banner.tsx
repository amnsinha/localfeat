import { useState } from "react";
import { Heart, X, Copy } from "lucide-react";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";

export function DonationBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    // Show banner if user hasn't dismissed it in the last 7 days
    const lastDismissed = localStorage.getItem('donationBannerDismissed');
    if (!lastDismissed) return true;
    
    const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed >= 7;
  });
  const { toast } = useToast();

  const handleDismiss = () => {
    localStorage.setItem('donationBannerDismissed', Date.now().toString());
    setIsVisible(false);
  };

  const handleUPIDonate = () => {
    const upiId = 'aman.sri651@ybl';
    // Create UPI payment link
    const upiLink = `upi://pay?pa=${upiId}&pn=LocalFeat&mc=0000&mode=02&purpose=00`;
    
    // Try to open UPI link first
    const upiWindow = window.open(upiLink, '_blank');
    
    // If UPI link doesn't work (likely on desktop), copy UPI ID to clipboard
    setTimeout(() => {
      if (!upiWindow || upiWindow.closed) {
        navigator.clipboard.writeText(upiId).then(() => {
          toast({
            title: "UPI ID Copied!",
            description: `${upiId} has been copied to your clipboard`,
          });
        }).catch(() => {
          // Fallback: show UPI ID in an alert
          alert(`UPI ID: ${upiId}\n\nThis has been copied to your clipboard. Use any UPI app to make a donation.`);
        });
      }
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 relative">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Heart className="h-5 w-5 text-pink-200" />
          <div>
            <p className="font-medium">Support Our Community 💝</p>
            <p className="text-sm text-pink-100">
              LocalFeat is a non-profit platform. Your donations help us keep the community thriving!
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="text-pink-200 hover:text-white hover:bg-pink-600"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleUPIDonate}
            className="bg-white text-purple-600 hover:bg-pink-50"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-2" />
            Donate
          </Button>
        </div>
      </div>
    </div>
  );
}