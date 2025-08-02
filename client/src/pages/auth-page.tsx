import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { registerSchema, loginSchema, type RegisterData, type LoginData } from "@shared/schema";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [pendingOnboardingData, setPendingOnboardingData] = useState(null);

  // Check for onboarding data and URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromOnboarding = urlParams.get('from') === 'onboarding';
    
    if (fromOnboarding) {
      const savedData = localStorage.getItem('pendingOnboardingData');
      if (savedData) {
        setPendingOnboardingData(JSON.parse(savedData));
        setActiveTab("register");
      }
    }
  }, []);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });
      // Small delay to ensure proper state transition
      setTimeout(() => setLocation("/app"), 50);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      
      // Add a small delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If we have pending onboarding data, create the profile automatically
      if (pendingOnboardingData) {
        try {
          const profileResponse = await apiRequest("POST", "/api/users", pendingOnboardingData);
          if (profileResponse.ok) {
            localStorage.removeItem('pendingOnboardingData');
            toast({
              title: "Welcome to Hook Line Studio!",
              description: "Your account and profile have been created successfully.",
            });
            // Use React routing instead of hard redirect  
            setLocation("/app");
          } else {
            const errorData = await profileResponse.json();
            console.error("Profile creation failed:", errorData);
            throw new Error(errorData.message || "Failed to create profile");
          }
        } catch (error) {
          console.error("Profile creation error:", error);
          toast({
            title: "Account created, but profile setup failed",
            description: "Please complete your profile setup.",
          });
          setLocation("/onboarding");
        }
      } else {
        toast({
          title: "Welcome to Hook Line Studio!",
          description: "Your account has been created successfully.",
        });
        setLocation("/onboarding");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 to-white flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-bold text-heritage-900 mb-2">Hook Line Studio</h1>
            </Link>
            <p className="text-heritage-600">AI-powered hooks for viral content</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue creating hooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    {pendingOnboardingData 
                      ? "Create your account to save your profile and start generating hooks"
                      : "Get started with Hook Line Studio today"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName">First Name</Label>
                        <Input
                          id="register-firstName"
                          placeholder="John"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-lastName">Last Name</Label>
                        <Input
                          id="register-lastName"
                          placeholder="Doe"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-heritage-600 hover:text-heritage-900">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Hero/branding */}
      <div className="hidden lg:flex flex-1 bg-heritage-900 text-white p-12 items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold mb-6">Open strong. Every time.</h2>
          <p className="text-xl text-heritage-200 mb-8">
            Generate platform-optimized hooks that stop the scroll and drive engagement.
          </p>
          <div className="space-y-4 text-heritage-300">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-brass-400 rounded-full"></div>
              <span>10 platform-ready hooks in 30 seconds</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-brass-400 rounded-full"></div>
              <span>Tailored to your brand and audience</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-brass-400 rounded-full"></div>
              <span>Proven copywriting frameworks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}