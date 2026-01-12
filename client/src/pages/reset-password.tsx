import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import localFeatIcon from "@assets/Gemini_Generated_Image_jl3yyjjl3yyjjl3y_1754341702424.png";
import { resetPasswordSchema, type ResetPasswordData } from "@shared/schema";
import { z } from "zod";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (!resetToken) {
      toast({
        title: "Invalid reset link",
        description: "No reset token found in the URL",
        variant: "destructive",
      });
      setLocation('/auth');
      return;
    }

    setToken(resetToken);

    // Validate the token
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token/${resetToken}`);
        const result = await response.json();
        
        if (result.valid) {
          setIsTokenValid(true);
        } else {
          toast({
            title: "Invalid or expired link",
            description: result.message || "This password reset link is invalid or has expired",
            variant: "destructive",
          });
          setLocation('/auth');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to validate reset token",
          variant: "destructive",
        });
        setLocation('/auth');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;

    try {
      const validatedData = resetPasswordSchema.parse({ 
        token, 
        password, 
        confirmPassword 
      });
      
      setIsLoading(true);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Password reset successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || "Please check your password requirements";
        toast({
          title: "Invalid input",
          description: errorMessage,
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

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
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
                Password Reset Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">
                  Your password has been successfully reset! You can now sign in with your new password.
                </p>
              </div>
              
              <Link href="/auth">
                <Button className="w-full bg-violet-600 hover:bg-violet-700">
                  Sign In Now
                </Button>
              </Link>
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

  if (!isTokenValid) {
    return null; // Will redirect to auth page
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
              Set New Password
            </CardTitle>
            <p className="text-sm text-gray-600">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={isLoading}
                    className="pr-10"
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={isLoading}
                    className="pr-10"
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600">
                  Passwords don't match
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={isLoading || !password.trim() || !confirmPassword.trim() || password !== confirmPassword}
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
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