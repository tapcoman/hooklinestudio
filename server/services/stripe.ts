import Stripe from "stripe";
import { storage } from "../storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

// Subscription plans - these should match your Stripe product/price IDs
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    amount: 0,
    currency: "usd",
    interval: "month",
    features: [
      "20 Draft generations per week (GPT-4o-mini)",
      "Basic scoring insights",
      "Community support"
    ],
    limits: {
      draftGenerationsPerWeek: 20,
      draftGenerationsPerMonth: -1, // unlimited
      proGenerationsPerMonth: 0,
      exports: false,
      priority: false,
      modelType: "gpt-4o-mini"
    }
  },
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter_placeholder",
    amount: 9,
    currency: "usd",
    interval: "month",
    features: [
      "100 Pro generations per month (GPT-4o)",
      "Unlimited Draft generations (GPT-4o-mini)",
      "Cancel anytime"
    ],
    limits: {
      proGenerationsPerMonth: 100,
      draftGenerationsPerMonth: -1, // unlimited
      exports: false,
      priority: false,
      overageRate: 3, // $3 per +100 Pro gens
      modelType: "both"
    }
  },
  CREATOR: {
    name: "Creator",
    priceId: process.env.STRIPE_CREATOR_PRICE_ID || "price_creator_placeholder",
    amount: 15,
    currency: "usd",
    interval: "month",
    features: [
      "200 Pro generations per month (GPT-4o)",
      "Unlimited Draft generations (GPT-4o-mini)",
      "Cold-open exports"
    ],
    limits: {
      proGenerationsPerMonth: 200,
      draftGenerationsPerMonth: -1, // unlimited
      exports: true,
      coldOpenExports: true,
      priority: false,
      overageRate: 3, // $3 per +100
      modelType: "both"
    }
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
    amount: 24,
    currency: "usd",
    interval: "month",
    features: [
      "400 Pro generations per month (GPT-4o)",
      "Unlimited Draft generations (GPT-4o-mini)",
      "Sheets/CSV export",
      "Advanced analytics"
    ],
    limits: {
      proGenerationsPerMonth: 400,
      draftGenerationsPerMonth: -1, // unlimited
      exports: true,
      sheetsExport: true,
      analytics: true,
      priority: false,
      overageRate: 2.5, // $2.50 per +100 (volume price)
      modelType: "both"
    }
  },
  TEAMS: {
    name: "Teams",
    priceId: process.env.STRIPE_TEAMS_PRICE_ID || "price_teams_placeholder",
    amount: 59,
    currency: "usd",
    interval: "month",
    features: [
      "1,500 Pro generations pooled per month",
      "3 seats included",
      "Shared style guide",
      "Priority support"
    ],
    limits: {
      proGenerationsPerMonth: 1500, // pooled across team
      draftGenerationsPerMonth: -1, // unlimited
      exports: true,
      teamSeats: 3,
      sharedStyleGuide: true,
      priority: true,
      overageRate: 2.5, // $2.50 per +100
      modelType: "both"
    }
  }
};

export async function getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
  try {
    // Check if user already has a Stripe customer ID
    const user = await storage.getUser(userId);
    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: {
        userId
      }
    });

    // Save customer ID to database
    await storage.updateStripeCustomerId(userId, customer.id);
    
    return customer.id;
  } catch (error) {
    console.error("Error creating/retrieving customer:", error);
    throw error;
  }
}

export async function createSubscription(userId: string, email: string, priceId: string, promotionCode?: string) {
  try {
    const customerId = await getOrCreateCustomer(userId, email);
    
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: 7, // 7-day free trial
    };

    // Add coupon if provided (for 20% discount)
    if (promotionCode) {
      subscriptionData.discounts = [{
        coupon: promotionCode
      }];
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    // Save subscription ID to database
    await storage.updateUserStripeInfo(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id
    });

    return {
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice && typeof subscription.latest_invoice === 'object' 
        ? (subscription.latest_invoice as any).payment_intent?.client_secret 
        : null,
      customerId
    };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    
    return session.url;
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    throw error;
  }
}

export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      trialEnd: (subscription as any).trial_end,
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    return subscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

// Handle Stripe webhooks
export async function handleStripeWebhook(event: any): Promise<void> {
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(subscription.customer as string) as any;
          
          if (customer.metadata?.userId) {
            await storage.updateUser(customer.metadata.userId, {
              subscriptionStatus: 'active',
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
            });
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
          const customer = await stripe.customers.retrieve(subscription.customer as string) as any;
          
          if (customer.metadata?.userId) {
            await storage.updateUser(customer.metadata.userId, {
              subscriptionStatus: 'past_due'
            });
          }
        }
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        const customer = await stripe.customers.retrieve(canceledSubscription.customer) as any;
        
        if (customer.metadata?.userId) {
          await storage.updateUser(customer.metadata.userId, {
            subscriptionStatus: 'canceled',
            subscriptionPlan: 'free',
            stripeSubscriptionId: null,
            cancelAtPeriodEnd: false
          });
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        const subCustomer = await stripe.customers.retrieve(updatedSubscription.customer) as any;
        
        if (subCustomer.metadata?.userId) {
          await storage.updateUser(subCustomer.metadata.userId, {
            subscriptionStatus: updatedSubscription.status,
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
          });
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}