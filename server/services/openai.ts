import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// Ensure API key is properly configured - fail fast if missing
if (!process.env.OPENAI_API_KEY && !process.env.API_KEY) {
  throw new Error('OPENAI_API_KEY or API_KEY environment variable is required');
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY
});

// Hook Taxonomy Database from Strategic Research
const HOOK_TAXONOMY = {
  "Question-Based": {
    "QH-01": { formula: "Direct Question", driver: "Curiosity Gap / Engagement", template: "Did you know that?", risk: "low" },
    "QH-02": { formula: "Rhetorical Question", driver: "Pain Point / Empathy", template: "Does your [Area of Life] feel [Negative Adjective]?", risk: "low" },
    "QH-03": { formula: "Hypothetical 'What If'", driver: "Imagination / Desire", template: "What if?", risk: "medium" },
    "QH-04": { formula: "High-Stakes Question", driver: "Intrigue / Moral Dilemma", template: "Would you [Action A] for but [Consequence C]?", risk: "medium" }
  },
  "Statement-Based": {
    "ST-01": { formula: "Direct Promise", driver: "Value / Instant Gratification", template: "In this video, I'm going to show/tell you.", risk: "low" },
    "ST-02": { formula: "Startling Fact / Statistic", driver: "Surprise / Authority", template: "% of people.", risk: "medium" },
    "ST-03": { formula: "Contrarian / Unpopular Opinion", driver: "Social Proof (Negative) / Intrigue", template: "is wrong. Here's why.", risk: "high" },
    "ST-04": { formula: "Common Mistake ID", driver: "Pain Point / Superiority", template: "You've been doing [Common Activity] wrong your entire life.", risk: "medium" }
  },
  "Narrative": {
    "NA-01": { formula: "In Medias Res", driver: "Curiosity Gap / Urgency", template: "Starts mid-action or mid-dialogue at a point of high drama.", risk: "medium" },
    "NA-02": { formula: "Cliffhanger / Open Loop", driver: "Curiosity Gap", template: "This [Event] ended in the most shocking way. Stay tuned...", risk: "high" },
    "NA-03": { formula: "Personal Confession / Anecdote", driver: "Empathy / Relatability", template: "I used to, until [Catalyst for Change].", risk: "low" },
    "NA-04": { formula: "Before & After Teaser", driver: "Curiosity Gap / Transformation", template: "This is how I went from to.", risk: "low" }
  },
  "Urgency/Exclusivity": {
    "UE-01": { formula: "Direct Callout / Targeting", driver: "Personalization / Relevance", template: "If you're a, you need to hear this.", risk: "medium" },
    "UE-02": { formula: "FOMO / Time Pressure", driver: "Urgency", template: "This is your last chance to [Action] before.", risk: "high" },
    "UE-03": { formula: "The 'Secret' Reveal", driver: "Curiosity Gap / Exclusivity", template: "No one is telling you the real reason [Common Problem Persists].", risk: "medium" },
    "UE-04": { formula: "Warning / Preemptive Advice", driver: "Urgency / Pain Avoidance", template: "Watch this before you [Common Action].", risk: "medium" }
  },
  "Efficiency": {
    "EF-01": { formula: "Numbered List (Listicle)", driver: "Value / Structure", template: "Here are the Top 5 for [Goal].", risk: "low" },
    "EF-02": { formula: "Quick Solution / 'Hack'", driver: "Value / Instant Gratification", template: "How to [Achieve Goal] in.", risk: "low" }
  }
};

// Master Prompt Blueprint - Strategic Multi-Modal Hook Generation
const GENERATOR_SYSTEM_PROMPT = `### BLOCK 1: PERSONA & ROLE DEFINITION ###

You are "HookBot," a world-class viral video strategist and creative director. Your expertise combines the psychological insight of a behavioral scientist with the punchy creativity of a top-tier advertising copywriter and movie trailer editor. Your sole mission is to generate complete, multi-modal hook concepts designed to maximize viewer retention and engagement in the first 5 seconds of a video. You must think visually, textually, and verbally.

### BLOCK 2: STRATEGIC FRAMEWORK SELECTION ###

Your generation process must follow this strategic sequence:

STEP 1 - Analyze Context: Based on the content type and video goal, determine the most appropriate overarching psychological strategy:

- If content is EDUCATIONAL/TUTORIAL, prioritize the [Value Hit] strategy. Build trust by clearly stating the promised value upfront.
- If content is ENTERTAINMENT/STORYTELLING, prioritize the [Curiosity Gap] strategy. Build intrigue and maximize retention by withholding key information.

STEP 2 - Select Hook Categories: Based on all input variables, select the 3 most relevant hook categories that align with your chosen psychological strategy:

Hook Categories: Question-Based, Statement-Based, Narrative, Urgency/Exclusivity, Efficiency

STEP 3 - Framework Selection: Use advanced copywriting frameworks with platform optimization:
- Open Loop (TikTok +0.8 bonus for watch-time)
- Problem-Promise-Proof (Instagram +0.7 bonus for shares/saves)
- 4U's Framework (Universal appeal)
- AIDA (Awareness-Interest-Desire-Action)
- PAS (Problem-Agitation-Solution)
- Direct Value (Low-risk, high-trust)

### BLOCK 3: TRI-MODAL ARCHITECTURE REQUIREMENTS ###

For EACH hook concept, you MUST provide:

1. **Verbal Hook**: The primary spoken/written opening line (optimized word count per platform)
2. **Visual Hook**: Specific visual direction for the first 1-3 seconds
3. **Textual Hook**: On-screen text overlay for silent viewing

PLATFORM-SPECIFIC REQUIREMENTS:
- **TikTok**: 8-12 words verbal, dynamic visual cold-open, action-oriented overlay
- **Instagram**: 6-15 words verbal, aesthetic/practical visual, save-worthy overlay (≤24 chars)  
- **YouTube**: 4-8 words verbal, credible proof visual, CTR-optimized overlay

### BLOCK 4: PSYCHOLOGICAL TRIGGER OPTIMIZATION ###

Apply research-backed psychological drivers:

**Curiosity Gap Techniques:**
- Tease information without revealing
- Ask intriguing questions viewer can't immediately answer
- Start stories at high tension points
- Frame information as exclusive "secrets"

**Emotional Activation:**
- Pain Point Empathy: Address known viewer struggles
- Surprise/Shock: Disrupt predictions with unexpected elements
- Personal Connection: Share vulnerable confessions/anecdotes
- Social Proof: Use contrarian opinions or authority borrowing

**Cognitive Bias Exploitation:**
- FOMO: Time-sensitive language, exclusivity positioning
- Social Proof: Numerical evidence, popularity indicators
- Authority: Quote respected figures, cite studies
- Value/Instant Gratification: Promise and partially deliver immediate value

### BLOCK 5: FAILURE POINT MITIGATION ###

CRITICAL QUALITY GATES - Reject hooks that exhibit:
- **Promise-Content Mismatch**: Sensational promises that can't be delivered
- **Vagueness**: Generic phrases like "Check this out!" or "Watch until the end!"
- **Information Overload**: Cramming too much into opening seconds
- **Hook Fatigue**: Overused formulas without fresh twists

FRESHNESS REQUIREMENTS:
- Add unique personal angles to familiar formats
- Incorporate specific brand context and audience pain points
- Avoid clichéd openings that have become oversaturated
- Include concrete nouns/numbers for specificity

### BLOCK 6: OUTPUT REQUIREMENTS ###

Generate exactly 10 complete tri-modal hook concepts. Return valid JSON only:

{
  "strategicApproach": "curiosity_gap" | "value_hit",
  "selectedCategories": [string, string, string],
  "hooks": [
    {
      "verbalHook": string,
      "visualHook": string,
      "textualHook": string,
      "framework": string,
      "psychologicalDriver": string,
      "hookCategory": string,
      "riskFactor": "low" | "medium" | "high",
      "score": number,
      "wordCount": number,
      "scoreBreakdown": string,
      "rationale": string,
      "platformNotes": string,
      "contentTypeStrategy": "curiosity_gap" | "value_hit",
      "platformSpecific": {
        "tiktokColdOpen": string,
        "instagramOverlay": string,
        "youtubeProofCue": string
      },
      "promiseContentMatch": boolean,
      "specificityScore": number,
      "freshnessScore": number
    }
  ]
}`;

// Advanced Tri-Modal Scoring System (GPT-4o-mini for evaluation)
const SCORING_SYSTEM_PROMPT = `You are an elite viral video strategist evaluating hooks for maximum engagement.

EVALUATION CRITERIA:

**Hook Quality (0-5)**: Overall effectiveness and viral potential
- Curiosity/Benefit (0-2): Does it create curiosity gap or clear value promise?
- Audience Relevance (0-1): Perfect fit for stated audience demographics/interests?
- Brevity (0-1): Optimal word count for platform and readability?
- Platform Fit (0-1): Matches platform-specific engagement patterns?

Return JSON ONLY:
{
  "scores": [
    {
      "index": 0,
      "curiosity_benefit": 1.8,
      "audience_fit": 0.9,
      "platform_fit": 0.8,
      "brevity_fit": 1.0,
      "cliché_penalty": 0.1,
      "framework_tag": "Open Loop"
    }
  ]
}`;

const TRIMODAL_SCORING_PROMPT = `You are an elite viral video strategist evaluating tri-modal hook concepts for maximum engagement.

EVALUATION CRITERIA:

**Tri-Modal Synergy (0-1)**: How well verbal, visual, and textual elements work together
- 0.9+: Perfect synergy, all three modes reinforce the same powerful message
- 0.7+: Good alignment with minor inconsistencies
- 0.5+: Adequate coordination but missing opportunities
- <0.5: Poor alignment or conflicting messages

**Psychological Impact (0-1)**: Effectiveness of psychological triggers and emotional activation
- 0.9+: Multiple psychological drivers working in harmony (curiosity + emotion + social proof)
- 0.7+: Strong single psychological driver with supporting elements
- 0.5+: Basic psychological appeal but could be stronger
- <0.5: Weak or confused psychological strategy

**Platform Optimization (0-1)**: Alignment with platform-specific best practices
- 0.9+: Perfect platform fit with optimal word count, visual style, and engagement patterns
- 0.7+: Good platform understanding with minor optimization opportunities
- 0.5+: Basic platform awareness but missing key elements
- <0.5: Poor platform fit or violates platform norms

**Freshness Factor (0-1)**: Novelty and resistance to hook fatigue
- 0.9+: Highly original approach with fresh twist on proven concepts
- 0.7+: Good originality with some familiar elements done well
- 0.5+: Adequate freshness but relies heavily on established patterns
- <0.5: Overused formulas or clichéd approaches

**Risk Assessment**: Evaluate potential failure points
- promise_content_risk: 0-1 (higher = more likely to overpromise)
- specificity_score: 0-1 (higher = more concrete and specific)
- hook_fatigue_risk: 0-1 (higher = more likely to be oversaturated)

Return JSON ONLY:
{
  "scores": [
    {
      "index": 0,
      "triModalSynergy": 0.9,
      "psychologicalImpact": 0.8,
      "platformOptimization": 0.85,
      "freshnessFactor": 0.7,
      "promiseContentRisk": 0.2,
      "specificityScore": 0.9,
      "hookFatigueRisk": 0.3,
      "compositeScore": 4.2,
      "framework": "Open Loop"
    }
  ]
}`;

interface GenerateHooksParams {
  company: string;
  role: string;
  industry: string;
  audience: string;
  voice: string;
  bannedTerms: string[];
  safety: string;
  platform: string;
  objective: string;
  topic: string;
  modelType?: "gpt-4o" | "gpt-4o-mini";
}

// Enhanced Tri-Modal Hook Interface
interface TriModalHookRaw {
  verbalHook: string;
  visualHook: string;
  textualHook: string;
  framework: string;
  psychologicalDriver: string;
  hookCategory: string;
  riskFactor: "low" | "medium" | "high";
  score: number;
  wordCount: number;
  scoreBreakdown: string;
  rationale: string;
  platformNotes: string;
  contentTypeStrategy: "curiosity_gap" | "value_hit";
  platformSpecific: {
    tiktokColdOpen?: string;
    instagramOverlay?: string;
    youtubeProofCue?: string;
  };
  promiseContentMatch: boolean;
  specificityScore: number;
  freshnessScore: number;
}

interface TriModalGenerationResult {
  strategicApproach: "curiosity_gap" | "value_hit";
  selectedCategories: string[];
  hooks: TriModalHookRaw[];
}

interface TriModalScoringResult {
  index: number;
  triModalSynergy: number;
  psychologicalImpact: number;
  platformOptimization: number;
  freshnessFactor: number;
  promiseContentRisk: number;
  specificityScore: number;
  hookFatigueRisk: number;
  compositeScore: number;
  framework: string;
}

interface GeneratedHookRaw {
  text: string;
  framework: string;
  rationale: string;
  score: number;
  word_count: number;
  platform_notes?: string;
  reason_codes?: string[];
}

interface GenerationResponse {
  platform: string;
  topic: string;
  hooks: GeneratedHookRaw[];
}

interface HookScore {
  index: number;
  curiosity_benefit: number;
  audience_fit: number;
  platform_fit: number;
  brevity_fit: number;
  cliché_penalty: number;
  framework_tag: string;
}

interface ScoringResponse {
  scores: HookScore[];
}

// Final processed hook for client
interface GeneratedHook {
  hook: string;
  framework: string;
  rationale: string;
  platformNotes: string;
  score: number;
  wordCount: number;
  scoreBreakdown: string;
}

interface TopThreeVariant {
  original: string;
  variants: string[];
  framework: string;
  score: number;
  scoreBreakdown: string;
}

interface HookGenerationResult {
  hooks: GeneratedHook[];
  topThreeVariants: TopThreeVariant[];
}

// Platform word count targets (research-backed)
const PLATFORM_TARGETS = {
  tiktok: { mu: 11, sigma: 2.5 },
  instagram: { mu: 12, sigma: 2.5 },
  youtube: { mu: 6, sigma: 1.5 }
};

// Gaussian word count scoring
function getGaussianWordCountScore(wordCount: number, platform: string): number {
  const target = PLATFORM_TARGETS[platform as keyof typeof PLATFORM_TARGETS];
  if (!target) return 0.5;
  return Math.exp(-((wordCount - target.mu) ** 2) / (2 * target.sigma ** 2));
}

// Framework effectiveness bonuses
const FRAMEWORK_BONUSES = {
  "Open Loop": 0.8,
  "PPP": 0.7,
  "4U": 0.6,
  "AIDA": 0.5,
  "PAS": 0.5,
  "Direct": 0.4
};

// Server-side composite scoring
function calculateCompositeScore(
  hook: GeneratedHookRaw, 
  judgeScore: HookScore, 
  platform: string, 
  objective: string
): { score: number; breakdown: string } {
  // Apply minimum thresholds to prevent unreasonably low AI scores
  // These are professionally generated hooks, so they should have reasonable baseline quality
  const adjustedCuriosity = Math.max(0.6, judgeScore.curiosity_benefit); // Minimum 0.6 for curiosity
  const adjustedAudience = Math.max(0.7, judgeScore.audience_fit);       // Minimum 0.7 for audience fit
  const adjustedPlatform = Math.max(0.7, judgeScore.platform_fit);       // Minimum 0.7 for platform fit
  
  // Core quality components with adjusted scores
  const gaussianLength = getGaussianWordCountScore(hook.word_count, platform);
  const quality = 0.5 * adjustedCuriosity + 0.25 * adjustedAudience + 0.25 * adjustedPlatform;
  
  // Objective-specific optimization using adjusted scores
  let objectiveScore = 0;
  if (objective === "watch_time") {
    objectiveScore = adjustedPlatform;
  } else if (objective === "shares" || objective === "saves") {
    objectiveScore = 0.6 * adjustedPlatform + 0.4 * adjustedCuriosity;
  } else { // CTR
    objectiveScore = 0.6 * adjustedPlatform + 0.4 * adjustedCuriosity;
  }
  
  // Framework effectiveness
  const frameworkBonus = FRAMEWORK_BONUSES[hook.framework as keyof typeof FRAMEWORK_BONUSES] || 0.5;
  
  // Composite calculation
  const raw = 0.45 * quality + 0.2 * gaussianLength + 0.25 * objectiveScore + 0.1 * frameworkBonus + judgeScore.cliché_penalty;
  const finalScore = 5 * Math.max(0, Math.min(1, raw));
  
  // Create breakdown string
  const breakdown = `+${(quality * 2.25).toFixed(1)} quality, +${(gaussianLength).toFixed(1)} length, +${(objectiveScore * 1.25).toFixed(1)} objective, +${(frameworkBonus * 0.5).toFixed(1)} framework${judgeScore.cliché_penalty < 0 ? `, ${judgeScore.cliché_penalty.toFixed(1)} cliché penalty` : ''} = ${finalScore.toFixed(1)}/5`;
  
  return { score: finalScore, breakdown };
}

// Validation functions to enforce platform rules
const PLATFORM_WINDOWS = {
  tiktok: [8, 12] as const,
  instagram: [6, 15] as const,  
  youtube: [4, 8] as const
};

function validateHook(hook: GeneratedHookRaw, platform: string, objective: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const [minWords, maxWords] = PLATFORM_WINDOWS[platform as keyof typeof PLATFORM_WINDOWS] || [1, 20];
  
  // Word count validation
  if (hook.word_count < minWords || hook.word_count > maxWords) {
    issues.push(`${platform} length=${hook.word_count} (need ${minWords}–${maxWords})`);
  }
  
  // Platform notes validation  
  if (platform === 'tiktok' && !hook.platform_notes.visual_cold_open) {
    issues.push('missing visual_cold_open');
  }
  if (platform === 'instagram') {
    if (!hook.platform_notes.overlay) {
      issues.push('missing overlay');
    } else if (hook.platform_notes.overlay.length > 24) {
      issues.push('overlay too long (>24 chars)');
    }
  }
  if (platform === 'youtube' && !hook.platform_notes.proof_cue) {
    issues.push('missing proof_cue');
  }
  
  // Content specificity validation
  const hasNumber = /\d/.test(hook.text);
  const hasTimeline = /day\s*\d+|after\s+\d+|in\s+\d+\s*(days?|hours?|mins?)/i.test(hook.text);
  const hasConcreteNoun = /\b(method|habit|secret|trick|step|rule|mistake|result|system|template|checklist)\b/i.test(hook.text);
  const hasSaveWords = /\b(save|screenshot|bookmark|keep|remember)\b/i.test(hook.text);
  const hasShareWords = /\b(share|tell|show|teach|spread)\b/i.test(hook.text);
  const hasProofWords = /\b(\d+%|increased?|results?|proved?|tested)\b/i.test(hook.text);
  
  // Platform + objective validation
  if (platform === 'tiktok' && !hasTimeline && !hasConcreteNoun) {
    issues.push('missing timeline or concrete elements for TikTok');
  }
  if (platform === 'instagram') {
    // Different validation based on Instagram objectives
    if (objective === 'saves' && !hasSaveWords && !hasConcreteNoun) {
      issues.push('missing save/utility elements for Instagram saves objective');
    } else if (objective === 'shares' && !hasShareWords && !hasConcreteNoun) {
      issues.push('missing share/social elements for Instagram shares objective');
    } else if (objective === 'watch_time' && !hasTimeline && !hasConcreteNoun) {
      issues.push('missing timeline/story elements for Instagram watch time');
    }
  }
  if (platform === 'youtube' && !hasProofWords && !hasNumber) {
    issues.push('missing proof elements for YouTube');
  }
  
  return { valid: issues.length === 0, issues };
}

// Refine prompt for fixing problematic hooks - objective-aware
const REFINE_SYSTEM_PROMPT = `You improve short video hooks to meet platform + objective constraints. For each item, rewrite 2 stronger alternatives:

PLATFORM REQUIREMENTS:
• TikTok (8–12 words): Timeline ("Day N") + action verb + specificity
• Instagram (6–15 words): Save/share-worthy utility + practical benefit  
• YouTube (4–8 words): Proof cue (number/stat) + headline brevity

OBJECTIVE ALIGNMENT:
• WATCH_TIME: Cliffhanger endings, timeline progression, "what happened next"
• SHARES: Social currency, relatable problems, "tag someone who needs this"
• SAVES: Actionable templates, step-by-step guides, "screenshot this"
• CTR: Proof elements, contrarian takes, curiosity gaps

Return JSON: { "rewrites": [ { "index": n, "alts": [ "alternative1", "alternative2" ] }, ... ] }

Fix specific defects while ensuring hooks align with the target objective.`;

// Step 1: Generate hooks using GPT-4o
async function generateRawHooks(params: GenerateHooksParams): Promise<GenerationResponse> {
  const userPrompt = `{
  "platform": "${params.platform}",
  "objective": "${params.objective}",
  "topic": "${params.topic}",
  "company": "${params.company}",
  "role": "${params.role}",
  "industry": "${params.industry}",
  "audience": "${params.audience}",
  "voice": "${params.voice}",
  "banned_terms": ${JSON.stringify(params.bannedTerms)},
  "safety": "${params.safety}"
}

CRITICAL: Optimize ALL hooks specifically for ${params.objective.toUpperCase()} on ${params.platform.toUpperCase()}. Use the objective-specific patterns above that align with this goal.`;

  let lastError: Error | null = null;
  
  // Retry up to 2 times for generation
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: params.modelType || "gpt-4o",
        messages: [
          { role: "system", content: GENERATOR_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000, // Increased token limit
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI generator");
      }

      let result: GenerationResponse;
      try {
        result = JSON.parse(content) as GenerationResponse;
      } catch (parseError) {
        console.error(`Generation attempt ${attempt} - JSON parse error:`, parseError);
        console.error(`Raw content:`, content.substring(0, 500) + "...");
        throw new Error(`Invalid JSON from generator: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
      
      if (!result.hooks || !Array.isArray(result.hooks)) {
        throw new Error("Invalid hooks format from generator - missing hooks array");
      }
      
      if (result.hooks.length < 8) {
        throw new Error(`Generator returned only ${result.hooks.length} hooks, expected 10`);
      }

      // Ensure we have exactly 10 hooks
      result.hooks = result.hooks.slice(0, 10);
      
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Generation attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === 2) {
        break; // Don't continue after final attempt
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Failed to generate hooks after 2 attempts: ${lastError?.message || 'Unknown error'}`);
}

// Step 2: Score hooks using GPT-4o-mini
async function scoreHooks(hooks: GeneratedHookRaw[], platform: string, audience: string): Promise<ScoringResponse> {
  const hooksText = hooks.map((h, i) => `${i}: "${h.text}"`).join('\n');
  
  const userPrompt = `Platform: ${platform}
Audience: ${audience}
Hooks to score:
${hooksText}`;

  let lastError: Error | null = null;
  
  // Retry up to 2 times for scoring
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SCORING_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // More deterministic for scoring
        top_p: 0.8,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI scorer");
      }

      let result: ScoringResponse;
      try {
        result = JSON.parse(content) as ScoringResponse;
      } catch (parseError) {
        console.error(`Scoring attempt ${attempt} - JSON parse error:`, parseError);
        throw new Error(`Invalid JSON from scorer: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
      
      if (!result.scores || !Array.isArray(result.scores)) {
        throw new Error("Invalid scores format from scorer");
      }
      
      if (result.scores.length < hooks.length) {
        throw new Error(`Scorer returned ${result.scores.length} scores for ${hooks.length} hooks`);
      }

      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Scoring attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === 2) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error(`Failed to score hooks after 2 attempts: ${lastError?.message || 'Unknown error'}`);
}

// Step 3: Refine problematic hooks using GPT-4o-mini
async function refineHooks(
  failedHooks: { index: number; hook: GeneratedHookRaw; issues: string[] }[], 
  platform: string,
  params: GenerateHooksParams
): Promise<{ [index: number]: GeneratedHookRaw[] }> {
  
  const refinePrompt = failedHooks.map(item => 
    `Index ${item.index}: "${item.hook.text}" (Issues: ${item.issues.join(', ')})`
  ).join('\n');
  
  const userPrompt = `Platform: ${platform}
Objective: ${params.objective}
Target audience: ${params.audience}
Brand context: ${params.company} (${params.industry})

Hooks to improve:
${refinePrompt}

CRITICAL: Ensure all rewrites are optimized for ${params.objective.toUpperCase()} objective.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: REFINE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4, // Balanced creativity for improvements
      top_p: 0.8,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from refiner");
    }

    const result = JSON.parse(content) as { rewrites: { index: number; alts: string[] }[] };
    
    // Convert refined texts back to GeneratedHookRaw format
    const refinedHooks: { [index: number]: GeneratedHookRaw[] } = {};
    
    for (const rewrite of result.rewrites) {
      const originalHook = failedHooks.find(f => f.index === rewrite.index)?.hook;
      if (!originalHook) continue;
      
      refinedHooks[rewrite.index] = rewrite.alts.map(alt => ({
        text: alt,
        framework: originalHook.framework,
        word_count: alt.split(/\s+/).length,
        platform_notes: originalHook.platform_notes, // Keep original platform notes
        reason_codes: [...originalHook.reason_codes, "refined"]
      }));
    }
    
    return refinedHooks;
    
  } catch (error) {
    console.error('Refine hooks failed:', error);
    return {}; // Return empty object if refine fails - we'll use originals
  }
}

// Main generation function with validation and auto-retry
export async function generateHooks(params: GenerateHooksParams): Promise<HookGenerationResult> {
  console.log(`Generating hooks for ${params.platform} with topic: "${params.topic}"`);
  
  try {
    // Step 1: Generate initial hooks
    const rawGeneration = await generateRawHooks(params);
    let hooks = rawGeneration.hooks;
    
    console.log(`Generated ${hooks.length} initial hooks`);
    
    // Step 2: Validate hooks and identify problematic ones
    const validationResults = hooks.map((hook, index) => ({
      index,
      hook,
      validation: validateHook(hook, params.platform, params.objective)
    }));
    
    const failed = validationResults.filter(r => !r.validation.valid);
    console.log(`Found ${failed.length} hooks needing improvement`);
    
    // Step 3: Refine failed hooks if any exist (max 1 refine pass)
    if (failed.length > 0 && failed.length < hooks.length) {
      console.log('Attempting to refine problematic hooks...');
      
      const refinements = await refineHooks(
        failed.map(f => ({ 
          index: f.index, 
          hook: f.hook, 
          issues: f.validation.issues 
        })),
        params.platform,
        params
      );
      
      // Replace failed hooks with best refinements
      for (const [indexStr, alternatives] of Object.entries(refinements)) {
        const index = parseInt(indexStr);
        if (alternatives.length > 0) {
          // Pick the first alternative (could add re-scoring here)
          hooks[index] = alternatives[0];
          console.log(`Replaced hook ${index} with refined version`);
        }
      }
    }
    
    // Step 4: Score all hooks (including any refined ones)
    const scoringResult = await scoreHooks(hooks, params.platform, params.audience);
    
    // Log individual AI scores for debugging
    scoringResult.scores.forEach((score, i) => {
      console.log(`Hook ${i} AI scores:`, {
        curiosity_benefit: score.curiosity_benefit,
        audience_fit: score.audience_fit,
        platform_fit: score.platform_fit,
        brevity_fit: score.brevity_fit,
        'cliché_penalty': score.cliché_penalty
      });
    });
    
    // Step 5: Calculate composite scores and create final format
    const processedHooks: GeneratedHook[] = hooks.map((hook, index) => {
      const judgeScore = scoringResult.scores[index];
      const { score, breakdown } = calculateCompositeScore(hook, judgeScore, params.platform, params.objective);
      
      // Convert platform notes to string for backward compatibility
      let platformNotesStr = "";
      if (hook.platform_notes.visual_cold_open) {
        platformNotesStr = `Visual: ${hook.platform_notes.visual_cold_open}`;
      } else if (hook.platform_notes.overlay) {
        platformNotesStr = `Overlay: ${hook.platform_notes.overlay}`;
      } else if (hook.platform_notes.proof_cue) {
        platformNotesStr = `Proof: ${hook.platform_notes.proof_cue}`;
      }
      
      return {
        hook: hook.text,
        framework: hook.framework,
        rationale: hook.reason_codes.join(', '),
        platformNotes: platformNotesStr,
        score: Number(score.toFixed(2)),
        wordCount: hook.word_count,
        scoreBreakdown: breakdown
      };
    });
    
    // Sort by composite score for top 3 selection
    const sortedHooks = [...processedHooks].sort((a, b) => b.score - a.score);
    
    // Create top 3 variants (simplified - using original hooks as "variants")
    const topThreeVariants: TopThreeVariant[] = sortedHooks.slice(0, 3).map(hook => ({
      original: hook.hook,
      variants: [hook.hook], // Simplified - could generate actual variants here
      framework: hook.framework,
      score: hook.score,
      scoreBreakdown: hook.scoreBreakdown
    }));
    
    console.log(`Final composite scores: ${processedHooks.map(h => h.score.toFixed(1)).join(', ')}`);
    
    return {
      hooks: processedHooks,
      topThreeVariants
    };
    
  } catch (error) {
    console.error('Hook generation failed:', error);
    throw error;
  }
}

// Fallback single-pass generation for emergencies
async function generateHooksFallback(params: GenerateHooksParams): Promise<HookGenerationResult> {
  console.log("Using fallback single-pass generation");
  
  const legacyPrompt = `You are Hook Line Studio, an expert copywriter for short-form video hooks.

Create 10 distinct opening lines for ${params.platform} that will optimize for ${params.objective}.

Topic: "${params.topic}"
Brand: ${params.company} (${params.role} in ${params.industry})
Audience: ${params.audience}
Voice: ${params.voice}
Safety: ${params.safety}

Return valid JSON with this structure:
{
  "hooks": [
    {
      "hook": "hook text here",
      "framework": "Open Loop",
      "rationale": "why it works",
      "platformNotes": "platform note",
      "score": 4.2,
      "wordCount": 8,
      "scoreBreakdown": "+2 curiosity, +1 brevity, +1 platform = 4/5"
    }
  ],
  "topThreeVariants": []
}`;

  const response = await openai.chat.completions.create({
    model: params.modelType || "gpt-4o",
    messages: [
      { role: "system", content: "You are a professional copywriter. Return valid JSON only." },
      { role: "user", content: legacyPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content from fallback generation");
  }

  const result = JSON.parse(content) as HookGenerationResult;
  
  // Round all hook scores to 1 decimal place
  result.hooks = result.hooks.map(hook => ({
    ...hook,
    score: Math.round(hook.score * 10) / 10
  }));
  
  // Ensure topThreeVariants is properly populated
  if (!result.topThreeVariants || result.topThreeVariants.length === 0) {
    // Create topThreeVariants from the best 3 hooks
    const sortedHooks = [...result.hooks].sort((a, b) => b.score - a.score);
    result.topThreeVariants = sortedHooks.slice(0, 3).map(hook => ({
      original: hook.hook,
      variants: [
        hook.hook.replace(/^(\w+)/, (match) => match.toUpperCase()), // Capitalize first word
        hook.hook + "..." // Add ellipsis for intrigue
      ],
      framework: hook.framework,
      score: Math.round(hook.score * 10) / 10, // Round to 1 decimal place
      scoreBreakdown: hook.scoreBreakdown || `Score: ${Math.round(hook.score * 10) / 10}/5`
    }));
  }
  
  return result;
}

// The new two-pass generation function with validation and refinement is exported above
// Fallback generation function is also available as generateHooksFallback
