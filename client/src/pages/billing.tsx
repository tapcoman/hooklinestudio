import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Crown, CreditCard, ExternalLink, Calendar, AlertTriangle } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function BillingPage() {
  const { backendUser } = useFirebaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get backend user data with subscription info
  const { data: user } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const response = await fetch("/api/users/me", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!backendUser,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/stripe/subscription"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/subscription", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user?.stripeSubscriptionId,
  });

  const { data: plans } = useQuery({
    queryKey: ["/api/stripe/plans"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/plans", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        },
        body: JSON.stringify({ returnUrl: window.location.origin + "/billing" })
      });
      if (!response.ok) throw new Error('Failed to create portal session');
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (error) => {
      toast({
        title: "Failed to open billing portal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebase_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription canceled",
        description: "Your subscription will end at the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/subscription"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleManageBilling = () => {
    setIsLoading(true);
    portalMutation.mutate();
  };

  const handleCancelSubscription = () => {
    cancelMutation.mutate();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = user?.subscriptionPlan || 'free';
  const planData = plans?.plans?.[currentPlan.toUpperCase()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-slate-600">
            Manage your subscription, billing information, and payment methods.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Current Plan</CardTitle>
                    <CardDescription>Your active subscription</CardDescription>
                  </div>
                </div>
                <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'} className="text-sm">
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {planData?.name || currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                  </h3>
                  <p className="text-slate-600">
                    {currentPlan === 'free' ? 'Free forever' : `$${planData?.amount || 0}/month`}
                  </p>
                </div>
                {currentPlan !== 'free' && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge variant={
                      user?.subscriptionStatus === 'active' ? 'default' : 
                      user?.subscriptionStatus === 'trialing' ? 'secondary' : 'destructive'
                    }>
                      {user?.subscriptionStatus || 'Unknown'}
                    </Badge>
                  </div>
                )}
              </div>

              {subscription && (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Next billing date</p>
                          <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                        </div>
                      </div>
                    )}
                    
                    {subscription.cancelAtPeriodEnd && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-sm text-orange-600">Cancels on</p>
                          <p className="font-medium text-orange-700">
                            {formatDate(subscription.currentPeriodEnd)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {currentPlan === 'free' ? (
                  <Link href="/pricing">
                    <Button className="w-full sm:w-auto">
                      Upgrade Plan
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button 
                      onClick={handleManageBilling}
                      disabled={isLoading || portalMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {portalMutation.isPending ? "Opening..." : "Manage Billing"}
                    </Button>
                    
                    <Link href="/pricing">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Change Plan
                      </Button>
                    </Link>
                    
                    {!subscription?.cancelAtPeriodEnd && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700">
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleCancelSubscription}
                              disabled={cancelMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {cancelMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Usage This Month</CardTitle>
              <CardDescription>Track your hook generation usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Hook Generations</span>
                  <span className="font-medium">
                    {user?.usedCredits || 0} / {currentPlan === 'free' ? user?.freeCredits || 5 : '∞'}
                  </span>
                </div>
                
                {currentPlan === 'free' && (
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, ((parseInt(user?.usedCredits || '0') / parseInt(user?.freeCredits || '5')) * 100))}%` 
                      }}
                    />
                  </div>
                )}
                
                <p className="text-sm text-slate-600">
                  {currentPlan === 'free' 
                    ? `${(parseInt(user?.freeCredits || '5') - parseInt(user?.usedCredits || '0'))} hooks remaining this month`
                    : 'Unlimited hook generation included in your plan'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Billing History</CardTitle>
                  <CardDescription>View and download your invoices</CardDescription>
                </div>
                {currentPlan !== 'free' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleManageBilling}
                    disabled={portalMutation.isPending}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All Invoices
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentPlan === 'free' ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">No billing history available</p>
                  <p className="text-sm text-slate-500">Upgrade to a paid plan to view billing history and invoices.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">Access your complete billing history</p>
                  <Button 
                    onClick={handleManageBilling}
                    disabled={portalMutation.isPending}
                    variant="outline"
                  >
                    Open Billing Portal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}