import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import localFeatIcon from "@assets/Gemini_Generated_Image_jl3yyjjl3yyjjl3y_1754341702424.png";
import { forgotPasswordSchema, type ForgotPasswordData } from "@shared/schema";
import { z } from "zod";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;

    try {
      const validatedData = forgotPasswordSchema.parse({ email });
      setIsLoading(true);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Reset link sent",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send reset email",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid email",
          description: error.errors[0]?.message || "Please enter a valid email address",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src={localFeatIcon} 
                  alt="LocalFeat" 
                  className="w-12 h-12 rounded-full mr-3"
                />
                <h1 className="text-2xl font-bold text-gray-900">LocalFeat</h1>
              </div>
              <CardTitle className="text-xl text-green-600">
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Mail className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Check your email and click the link to reset your password. The link will expire in 1 hour.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
                
                <Link href="/auth">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <footer className="text-center mt-8">
            <p className="text-xs text-gray-400">
              Built with 💙 in India, Data never sold
            </p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={localFeatIcon} 
                alt="LocalFeat" 
                className="w-12 h-12 rounded-full mr-3"
              />
              <h1 className="text-2xl font-bold text-gray-900">LocalFeat</h1>
            </div>
            <CardTitle className="text-xl">
              Reset Your Password
            </CardTitle>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  "Sending Reset Link..."
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-xs text-gray-400">
            Built with 💙 in India, Data never sold
          </p>
        </footer>
      </div>
    </div>
  );
}