import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Video, ArrowLeft, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import type { OnboardingData } from "@/lib/types";

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, backendUser } = useFirebaseAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<OnboardingData>({
    company: "",
    industry: "",
    role: "",
    audience: "",
    voice: "",
    bannedTerms: [],
    safety: "standard",
    platforms: [],
    goals: [],
    examples: ""
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: OnboardingData) => {
      const response = await apiRequest("POST", "/api/users", userData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Profile created successfully!",
        description: "You're ready to start generating hooks.",
      });
      
      // Force a Firebase sync to refresh backend user data and ensure onboarding is marked complete
      try {
        const token = localStorage.getItem('firebase_token');
        if (token) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay to ensure database write completed
          const syncResponse = await fetch('/api/auth/firebase-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
          }
        }
      } catch (error) {
        console.error("Failed to refresh backend user data:", error);
      }
      
      // Force page reload to ensure proper authentication state
      setLocation("/app");
    },
    onError: (error) => {
      console.error("Profile creation error:", error);
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // If user is authenticated, create profile directly
      if (user && user.emailVerified) {
        createUserMutation.mutate(formData);
      } else {
        // Store form data and redirect to auth with onboarding context
        localStorage.setItem('pendingOnboardingData', JSON.stringify(formData));
        setLocation('/auth?from=onboarding');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/");
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addBannedTerm = (term: string) => {
    if (term && !formData.bannedTerms.includes(term)) {
      updateFormData("bannedTerms", [...formData.bannedTerms, term]);
    }
  };

  const removeBannedTerm = (term: string) => {
    updateFormData("bannedTerms", formData.bannedTerms.filter(t => t !== term));
  };

  const toggleArrayValue = (field: 'platforms' | 'goals', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.company && formData.industry && formData.role && formData.audience;
      case 2:
        return formData.voice;
      case 3:
        return formData.platforms.length > 0 && formData.goals.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Hook Line Studio</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`progress-step w-8 ${
                    i + 1 <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="label-text text-muted-foreground">Step {currentStep} of {TOTAL_STEPS}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <div className="text-center mb-12">
            <h2 className="font-serif text-foreground mb-4">
              {currentStep === 1 && "About your work"}
              {currentStep === 2 && "How you sound"}
              {currentStep === 3 && "What you make"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              {currentStep === 1 && "We'll use this to tailor hooks to your audience and brand."}
              {currentStep === 2 && "We'll use this to tailor hooks to your audience and brand."}
              {currentStep === 3 && "We'll use this to tailor hooks to your audience and brand."}
            </p>
          </div>

          <Card className="card-enhanced">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <Label htmlFor="company" className="label-text text-foreground mb-3 block">What's your company or brand?</Label>
                    <Input
                      id="company"
                      placeholder="Acme Fitness"
                      value={formData.company}
                      onChange={(e) => updateFormData("company", e.target.value)}
                      className="h-12 rounded-xl border-border"
                    />
                  </div>
                  
                  <div>
                    <Label className="label-text text-foreground mb-3 block">What do you do?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Agency", "Creator", "E-commerce", "SaaS", "Local business", "Education"].map((industry) => (
                        <Button
                          key={industry}
                          type="button"
                          variant={formData.industry === industry.toLowerCase() ? "default" : "outline"}
                          onClick={() => updateFormData("industry", industry.toLowerCase())}
                          className="btn-enhanced justify-start h-12 rounded-xl"
                        >
                          {industry}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="label-text text-foreground mb-3 block">Your role</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "founder", label: "Founder/CEO" },
                        { value: "marketing-manager", label: "Marketing Manager" },
                        { value: "content-creator", label: "Content Creator" },
                        { value: "social-media-manager", label: "Social Media Manager" },
                        { value: "video-editor", label: "Video Editor" },
                        { value: "freelancer", label: "Freelancer" }
                      ].map((role) => (
                        <Button
                          key={role.value}
                          type="button"
                          variant={formData.role === role.value ? "default" : "outline"}
                          onClick={() => updateFormData("role", role.value)}
                          className="btn-enhanced justify-start h-12 rounded-xl"
                        >
                          {role.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="audience" className="label-text text-foreground mb-3 block">Who is your primary audience?</Label>
                    <Textarea
                      id="audience"
                      placeholder="Busy parents, fitness beginners, ages 25-45"
                      value={formData.audience}
                      onChange={(e) => updateFormData("audience", e.target.value)}
                      className="h-24 resize-none rounded-xl border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Describe who you're creating content for</p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <Label className="label-text text-foreground mb-4 block">Choose your voice</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Authoritative", "Friendly", "Playful", "Contrarian", "Luxury", "Minimal"].map((voice) => (
                        <Button
                          key={voice}
                          type="button"
                          variant={formData.voice === voice ? "default" : "outline"}
                          onClick={() => updateFormData("voice", voice)}
                          className="btn-enhanced justify-start h-12 rounded-xl"
                        >
                          {voice}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="banned-term" className="label-text text-foreground mb-3 block">Banned words or brand sensitivities?</Label>
                    <div className="flex gap-2">
                      <Input
                        id="banned-term"
                        placeholder="Enter a term to avoid"
                        className="h-12 rounded-xl border-border"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            addBannedTerm((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-enhanced h-12 px-6 rounded-xl"
                        onClick={() => {
                          const input = document.getElementById("banned-term") as HTMLInputElement;
                          addBannedTerm(input.value);
                          input.value = "";
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    {formData.bannedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.bannedTerms.map((term) => (
                          <Badge
                            key={term}
                            variant="secondary"
                            className="cursor-pointer px-3 py-1 rounded-full hover:bg-muted"
                            onClick={() => removeBannedTerm(term)}
                          >
                            {term} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="label-text text-foreground mb-4 block">Safe-mode level</Label>
                    <div className="space-y-3">
                      {[
                        { value: "family-friendly", label: "Family-friendly", desc: "Safe for all audiences" },
                        { value: "standard", label: "Standard", desc: "Professional but engaging" },
                        { value: "edgy", label: "Edgy", desc: "Bold and attention-grabbing" }
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={formData.safety === option.value ? "default" : "outline"}
                          onClick={() => updateFormData("safety", option.value)}
                          className="btn-enhanced w-full justify-start h-auto p-4 rounded-xl text-left"
                        >
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm opacity-70 mt-1">{option.desc}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <Label className="label-text text-foreground mb-4 block">Primary platforms</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["TikTok", "Instagram", "YouTube"].map((platform) => (
                        <Button
                          key={platform}
                          type="button"
                          variant={formData.platforms.includes(platform) ? "default" : "outline"}
                          onClick={() => toggleArrayValue("platforms", platform)}
                          className="btn-enhanced h-16 rounded-xl flex-col gap-1"
                        >
                          <span className="text-lg">{platform === "TikTok" ? "🎵" : platform === "Instagram" ? "📷" : "📺"}</span>
                          <span className="text-xs">{platform === "Instagram" ? "Reels" : platform === "YouTube" ? "Shorts" : platform}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="label-text text-foreground mb-4 block">Top 3 content goals</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Views", "Shares/Sends", "Saves", "Click-through", "Follows"].map((goal) => (
                        <Button
                          key={goal}
                          type="button"
                          variant={formData.goals.includes(goal) ? "default" : "outline"}
                          onClick={() => toggleArrayValue("goals", goal)}
                          className="btn-enhanced justify-start h-12 rounded-xl"
                          disabled={!formData.goals.includes(goal) && formData.goals.length >= 3}
                        >
                          {goal}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="examples" className="label-text text-foreground mb-3 block">Examples of past hooks you liked (optional)</Label>
                    <Textarea
                      id="examples"
                      placeholder="Paste 1-3 examples of hooks that worked well for you..."
                      value={formData.examples}
                      onChange={(e) => updateFormData("examples", e.target.value)}
                      className="h-24 resize-none rounded-xl border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-2">This helps us understand your style preferences</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-12">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="btn-enhanced h-12 px-6 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!isStepValid() || createUserMutation.isPending}
                  className="btn-enhanced h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {currentStep === TOTAL_STEPS 
                    ? "Create Account & Save Profile"
                    : "Continue"
                  }
                  {currentStep < TOTAL_STEPS && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}