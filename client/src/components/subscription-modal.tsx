import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  showDiscountOffer?: boolean;
  currentCredits?: number;
}

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/app",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to Pro!",
        description: "Your subscription is now active. Enjoy unlimited hook generation!",
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? "Processing..." : "Start Pro Subscription"}
      </Button>
    </form>
  );
};

export default function SubscriptionModal({ 
  isOpen, 
  onClose, 
  showDiscountOffer = false, 
  currentCredits = 0 
}: SubscriptionModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { plan: string; promotionCode?: string }) => {
      const response = await apiRequest("POST", "/api/stripe/create-subscription", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        toast({
          title: "Subscription Created",
          description: "Your subscription is now active!",
        });
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartSubscription = (plan: string, withDiscount: boolean = false) => {
    setIsLoading(true);
    createSubscriptionMutation.mutate({
      plan,
      promotionCode: withDiscount ? "FIRST_MONTH_20" : undefined
    });
  };

  const features = [
    "Advanced AI generation",
    "Unlimited hook generations",
    "Enhanced scoring insights",
    "Export hooks to CSV", 
    "Priority customer support",
    "Early access to new features"
  ];

  // Payment form view
  if (clientSecret) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Complete Your Subscription
            </DialogTitle>
            <DialogDescription>
              Complete your payment to start unlimited hook generation
            </DialogDescription>
          </DialogHeader>
          
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm onSuccess={onClose} />
          </Elements>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {showDiscountOffer ? "Special Offer - Credit Limit Reached!" : "Upgrade to Pro"}
          </DialogTitle>
          <DialogDescription>
            {showDiscountOffer 
              ? `You've used all ${currentCredits} free credits. Upgrade now with 20% off your first month!`
              : "Get unlimited hook generation and advanced features"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Credit Status */}
          {showDiscountOffer && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <Star className="w-4 h-4" />
                <span className="font-medium">Credits Exhausted</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                You've reached your monthly limit of {currentCredits} free hooks. Upgrade to continue generating unlimited content.
              </p>
            </div>
          )}

          {/* Pricing Plans */}
          <div className="grid gap-4">
            {/* Creator Plan */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-primary" />
                  <CardTitle className="text-2xl">Creator Plan</CardTitle>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    {showDiscountOffer && (
                      <span className="text-lg text-slate-500 line-through">$15.00</span>
                    )}
                    <span className="text-3xl font-bold text-primary">
                      ${showDiscountOffer ? "12.00" : "15.00"}
                    </span>
                    <span className="text-slate-600">/month</span>
                  </div>
                  {showDiscountOffer && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      20% OFF First Month
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-center">
                  For weekly posting • Cancel anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {["200 Pro generations/month", "Unlimited Draft generations", "Cold-open exports", "Email support"].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

              <div className="space-y-3 pt-4">
                {showDiscountOffer ? (
                  <>
                    <Button 
                      onClick={() => handleStartSubscription("creator", true)}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {isLoading ? "Setting up..." : "Claim Pro - 20% Discount"}
                    </Button>
                    <Button 
                      onClick={() => handleStartSubscription("creator", false)}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      Continue at Regular Price
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => handleStartSubscription("creator", false)}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? "Setting up..." : "Start Creator - $15/month"}
                  </Button>
                )}
              </div>

              <p className="text-xs text-slate-500 text-center">
                Trial includes full Pro features. You can cancel anytime during the trial period.
              </p>
            </CardContent>
          </Card>

          {/* Teams Plan */}
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-slate-600" />
                <CardTitle className="text-2xl text-slate-900">Teams Plan</CardTitle>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-slate-900">$59.00</span>
                  <span className="text-slate-600">/month</span>
                </div>
              </div>
              <CardDescription className="text-center">
                For studios & agencies • Cancel anytime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {["1,500 pooled Pro generations", "3 seats", "Shared style guide", "Priority support"].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => handleStartSubscription("teams", false)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-slate-300 hover:bg-slate-50"
                  size="lg"
                >
                  {isLoading ? "Setting up..." : "Start Teams - 7-Day Free Trial"}
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 text-center">
                Perfect for teams and agencies. Includes collaboration tools and priority support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
}