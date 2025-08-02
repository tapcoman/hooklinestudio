export interface OnboardingData {
  company: string;
  industry: string;
  role: string;
  audience: string;
  voice: string;
  bannedTerms: string[];
  safety: "family-friendly" | "standard" | "edgy";
  platforms: string[];
  goals: string[];
  examples: string;
}