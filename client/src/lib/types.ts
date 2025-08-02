/**
 * Comprehensive onboarding data interface with strict typing
 * Captures user preferences for personalized hook generation
 * 
 * @interface OnboardingData
 * @example
 * ```typescript
 * const onboardingData: OnboardingData = {
 *   company: "TechStartup Inc",
 *   industry: "SaaS",
 *   role: "Marketing Manager",
 *   audience: "B2B decision makers",
 *   voice: "Professional but approachable",
 *   bannedTerms: ["boring", "outdated"],
 *   safety: "standard",
 *   platforms: ["tiktok", "instagram"],
 *   goals: ["increase_engagement", "drive_conversions"],
 *   examples: "We love hooks that start with surprising statistics"
 * };
 * ```
 */
export interface OnboardingData {
  /** Company or brand name for personalization */
  readonly company: string;
  
  /** Industry category for context-aware hook generation */
  readonly industry: string;
  
  /** User's role for tailored messaging */
  readonly role: string;
  
  /** Target audience description for hook optimization */
  readonly audience: string;
  
  /** Brand voice and tone preferences */
  readonly voice: string;
  
  /** Array of terms to avoid in generated hooks */
  readonly bannedTerms: readonly string[];
  
  /** Content safety level for hook generation */
  readonly safety: "family-friendly" | "standard" | "edgy";
  
  /** Selected social media platforms for hook optimization */
  readonly platforms: readonly string[];
  
  /** Marketing goals and objectives */
  readonly goals: readonly string[];
  
  /** Example hooks or style preferences */
  readonly examples: string;
}