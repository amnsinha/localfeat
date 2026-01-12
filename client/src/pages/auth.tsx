import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { registrationSchema, loginSchema, type RegistrationData, type LoginData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useSeo } from "@/hooks/useSeo";
import { Link } from "wouter";
import localFeatIcon from "@assets/Gemini_Generated_Image_jl3yyjjl3yyjjl3y_1754341702424.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // SEO optimization for auth page - updates when switching between login/register
  useSeo({
    title: isLogin ? "Sign In - LocalFeat" : "Join LocalFeat - Create Account",
    description: isLogin ? "Sign in to LocalFeat to connect with activity partners in your local community." : "Join LocalFeat today and start connecting with like-minded people in your neighborhood for activities and events.",
    keywords: "sign in, login, register, join community, create account, local activities",
    canonical: "https://localfeat.com/auth"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
    mode: "onChange",
  });

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const registerForm = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
    },
    mode: "onChange",
  });

  const handleLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const userData = await response.json();
      
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${userData.username}`,
      });
      
      // Invalidate user query and redirect to home page
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirect to home page
      setTimeout(() => {
        window.location.href = "/home";
      }, 100);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Create registration data from separate state variables
    const registrationData: RegistrationData = {
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
    };
    
    try {
      const response = await apiRequest("POST", "/api/auth/register", registrationData);
      const userData = await response.json();
      
      toast({
        title: "Account Created!",
        description: `Welcome to LocalFeat, ${userData.username}!`,
      });
      
      // Invalidate user query and redirect to home page
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirect to home page
      setTimeout(() => {
        window.location.href = "/home";
      }, 100);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please check your information and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={localFeatIcon} 
            alt="LocalFeat" 
            className="w-16 h-16 mx-auto rounded-full mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">LocalFeat</h1>
          <p className="text-gray-600 mt-2">Connect with your local community</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              <span>{isLogin ? "Sign In" : "Create Account"}</span>
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Welcome back! Please sign in to your account" 
                : "Join our community and start connecting with local people"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your email or username" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password" 
                              value={field.value || ""}
                              onChange={field.onChange}
                              name={field.name}
                              ref={field.ref}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <Input 
                      placeholder="Choose a username" 
                      value={regUsername}
                      onChange={(e) => {
                        setRegUsername(e.target.value);
                        registerForm.setValue('username', e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input 
                      type="email"
                      placeholder="Enter your email address" 
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        registerForm.setValue('email', e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input 
                      type="tel"
                      placeholder="Enter your phone number" 
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        registerForm.setValue('phone', e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password" 
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          registerForm.setValue('password', e.target.value);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
            )}

            {/* Social Login Options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                  onClick={() => window.location.href = "/api/auth/google"}
                  disabled={isLoading}
                >
                  <FaGoogle className="h-4 w-4" />
                  <span>{isLogin ? "Sign in" : "Sign up"} with Google</span>
                </Button>
              </div>
            </div>

{/* Forgot password link - only show for login */}
            {isLogin && (
              <div className="mt-4 text-center">
                <Link href="/forgot-password">
                  <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700">
                    Forgot your password?
                  </Button>
                </Link>
              </div>
            )}

            {/* Switch between login and register */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <Button
                  variant="link"
                  className="ml-1 p-0 h-auto font-semibold text-blue-600"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Create one" : "Sign in"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-xs text-gray-400">
            Built with 💙 in India, Data never sold
          </p>
        </div>
      </div>
    </div>
  );
}