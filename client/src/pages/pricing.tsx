import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import SubscriptionModal from "@/components/subscription-modal";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export default function PricingPage() {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user, backendUser } = useFirebaseAuth();

  const { data: plans } = useQuery({
    queryKey: ["/api/stripe/plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    setShowSubscriptionModal(true);
  };

  const planData = [
    {
      key: "FREE",
      name: "Free",
      price: 0,
      icon: <Zap className="w-6 h-6 text-slate-600" />,
      description: "Perfect for trying out Hook Line Studio",
      features: [
        "20 Draft generations per week",
        "Smart AI optimization",
        "Basic scoring insights",
        "Community support"
      ],
      cta: "Get Started Free",
      popular: false,
      cardStyle: "border-slate-200 bg-white"
    },
    {
      key: "STARTER",
      name: "Starter",
      price: 9,
      icon: <Zap className="w-6 h-6 text-amber-600" />,
      description: "Ship your first winning hooks today",
      features: [
        "100 Pro generations/month",
        "Advanced AI generation",
        "Unlimited Drafts",
        "Cancel anytime"
      ],
      cta: "Start Starter Plan",
      popular: false,
      cardStyle: "border-amber-200 bg-amber-50"
    },
    {
      key: "CREATOR",
      name: "Creator",
      price: 15,
      icon: <Crown className="w-6 h-6 text-primary" />,
      description: "For weekly posting",
      features: [
        "200 Pro generations/month",
        "Advanced AI generation",
        "Unlimited Drafts",
        "Cold-open exports"
      ],
      cta: "Start Creator Plan",
      popular: true,
      cardStyle: "border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 ring-2 ring-primary/20"
    },
    {
      key: "PRO",
      name: "Pro",
      price: 24,
      icon: <Star className="w-6 h-6 text-slate-600" />,
      description: "For daily posting",
      features: [
        "400 Pro generations/month",
        "Premium AI generation",
        "Unlimited Drafts",
        "Sheets/CSV export",
        "Advanced analytics"
      ],
      cta: "Start Pro Plan",
      popular: false,
      cardStyle: "border-slate-200 bg-white"
    },
    {
      key: "TEAMS",
      name: "Teams",
      price: 59,
      icon: <Star className="w-6 h-6 text-slate-600" />,
      description: "For studios & agencies",
      features: [
        "1,500 pooled Pro generations",
        "Premium AI generation",
        "3 seats",
        "Shared style guide",
        "Priority support"
      ],
      cta: "Start 7-Day Free Trial",
      popular: false,
      cardStyle: "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Start with our free plan and upgrade as you grow. All paid plans include a 7-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {planData.map((plan) => (
            <Card key={plan.key} className={`relative ${plan.cardStyle}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {plan.icon}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-slate-900">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-slate-600">/month</span>
                    )}
                  </div>
                </div>
                <CardDescription className="text-center">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => plan.key === "FREE" ? null : handlePlanSelect(plan.key.toLowerCase())}
                  className={`w-full ${
                    plan.popular 
                      ? "bg-primary hover:bg-primary/90" 
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                  size="lg"
                  disabled={plan.key === "FREE" && backendUser?.subscriptionPlan === "free"}
                >
                  {plan.key === "FREE" && backendUser?.subscriptionPlan === "free" 
                    ? "Current Plan" 
                    : plan.cta
                  }
                </Button>

                {plan.key !== "FREE" && (
                  <p className="text-xs text-slate-500 text-center">
                    7-day free trial • Cancel anytime
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                What's the difference between AI generation levels?
              </h3>
              <p className="text-slate-600">
                Free plans use Smart AI optimization for quality drafts. Paid plans unlock Advanced and Premium AI generation for more sophisticated hooks with enhanced creativity and platform-specific optimization.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                What happens during the free trial?
              </h3>
              <p className="text-slate-600">
                You get full access to all features in your chosen plan for 7 days. No credit card required to start, and you can cancel anytime during the trial.
              </p>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-slate-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600">
                We accept all major credit cards, debit cards, and digital wallets through our secure Stripe payment processing.
              </p>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-slate-600">
                We offer a 7-day free trial so you can test all features. After that, we have a 30-day money-back guarantee if you're not satisfied.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        showDiscountOffer={false}
      />
    </div>
  );
}