import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  plan: 'pro' | 'teams';
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ plan, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?success=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to your new plan!",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 bg-brass hover:bg-brass/90"
        >
          {isLoading ? "Processing..." : `Start ${plan === 'pro' ? 'Pro' : 'Teams'} Trial`}
        </Button>
      </div>
    </form>
  );
}

interface StripeCheckoutProps {
  plan: 'pro' | 'teams';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripeCheckout({ plan, onSuccess, onCancel }: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    createSubscription();
  }, [plan]);

  const createSubscription = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("POST", "/api/stripe/create-subscription", {
        plan,
        trialDays: 7,
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error("No client secret received");
      }
    } catch (error) {
      console.error("Subscription creation error:", error);
      setError("Failed to set up payment. Please try again.");
      toast({
        title: "Setup Error",
        description: "Failed to set up payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate">Setting up your subscription...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Setup Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate mb-4">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Back
            </Button>
            <Button onClick={createSubscription} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-slate">Unable to initialize payment. Please try again.</p>
          <Button onClick={onCancel} className="w-full mt-4">
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#C48F3C', // Brass color
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Complete Your {plan === 'pro' ? 'Pro' : 'Teams'} Subscription
        </CardTitle>
        <p className="text-center text-slate">
          7-day free trial • Cancel anytime
        </p>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm plan={plan} onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
      </CardContent>
    </Card>
  );
}