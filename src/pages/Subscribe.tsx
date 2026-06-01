import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, CreditCard, Shield, Sparkles, ArrowLeft, Settings, Receipt, Server, Code, Building2, Copy, ExternalLink, Webhook, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PLANS = {
  lease: {
    id: 'lease',
    name: 'Lease Plan',
    price: '$299',
    period: '/month',
    description: 'Hosted white-label solution with updates and support',
    icon: Server,
    popular: true,
    trialDays: 14,
    features: [
      'Fully hosted on our infrastructure',
      'Automatic updates and maintenance',
      'Custom branding included',
      'Email and chat support',
      'Up to 50 staff users',
      'Unlimited clients and visits',
      'SSL certificate included',
      'Daily backups',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: '$39',
    period: '/month',
    description: 'Full access to all service management features',
    icon: Sparkles,
    popular: false,
    trialDays: 14,
    features: [
      'Unlimited visits & GPS tracking',
      'Complete job management',
      'Automatic invoice generation',
      'Staff scheduling & performance',
      'Client management & portal',
      'Revenue analytics & alerts',
      'Photo documentation',
      'Team chat & communications',
    ],
  },
};

export default function Subscribe() {
  const { user } = useAuth();
  const { isActive, trialDaysRemaining, isTrialing } = useSubscription();
  const { subscriptionEnabled, loading: settingsLoading } = useAppSettings();
  const { role } = useRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'lease' | 'pro'>('lease');
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isAdmin = role === 'admin';
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;

  const handleSyncSubscription = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data?.subscribed) {
        toast.success(`Subscription synced! Status: ${data.status}`);
      } else {
        toast.info('No active subscription found in Stripe.');
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      toast.error('Failed to sync subscription status.');
    } finally {
      setSyncing(false);
    }
  };

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const plan = searchParams.get('plan');

    if (success === 'true') {
      toast.success(`Welcome! Your ${plan === 'lease' ? 'Lease' : 'Pro'} plan trial has started.`);
      navigate('/home', { replace: true });
    } else if (canceled === 'true') {
      toast.info('Checkout was canceled. No charges were made.');
    }
  }, [searchParams, navigate]);

  // Redirect if subscription system is disabled
  useEffect(() => {
    if (!settingsLoading && !subscriptionEnabled) {
      navigate('/');
    }
  }, [subscriptionEnabled, settingsLoading, navigate]);

  // Get plan from URL if specified
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && (planParam === 'lease' || planParam === 'pro')) {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscriptionEnabled) {
    return null;
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSubscribe = async (planType: 'lease' | 'pro') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planType,
          referralCode: referralCode || undefined,
        },
      });

      if (error) throw error;

      if (data?.hasSubscription) {
        toast.info(data.error || 'You already have an active subscription.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (isActive) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>You're Already Subscribed!</CardTitle>
              <CardDescription>
                You have an active subscription. Enjoy all the features!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full gap-2" 
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    Manage Subscription
                  </>
                )}
              </Button>
              <Button 
                className="w-full gap-2" 
                variant="outline"
                onClick={() => navigate('/billing')}
              >
                <Receipt className="h-4 w-4" />
                View Billing History
              </Button>
              <Button 
                className="w-full" 
                variant="ghost"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="max-w-5xl mx-auto pt-10">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2">
            {isTrialing && trialDaysRemaining > 0 
              ? `You have ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} left in your trial.`
              : 'Start with a 14-day free trial. No credit card required upfront.'}
          </p>
        </div>

        {/* Referral Code */}
        <div className="max-w-sm mx-auto mb-8">
          <Label htmlFor="referral">Referral Code (optional)</Label>
          <Input
            id="referral"
            placeholder="Enter referral code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="mt-1.5"
          />
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {Object.values(PLANS).map((plan) => {
            const Icon = plan.icon;
            const isLoading = loading === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular ? 'border-primary shadow-lg' : ''
                } ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                    <p className="text-sm text-primary mt-2">
                      {plan.trialDays}-day free trial
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id as 'lease' | 'pro')}
                    disabled={isLoading || loading !== null}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Start Free Trial
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Need Enterprise Features?</h3>
                <p className="text-sm text-muted-foreground">
                  Custom deployments, API integrations, 24/7 support
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              Contact Sales
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8">
          <Shield className="h-4 w-4" />
          <span>Secure payment via Stripe. Cancel anytime.</span>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4 max-w-md mx-auto">
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          Your card will be charged after the 14-day trial ends.
        </p>

        {/* Admin Tools */}
        {isAdmin && (
          <Card className="max-w-3xl mx-auto mt-12">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Subscription Sync</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleSyncSubscription}
                  disabled={syncing}
                >
                  {syncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync Now
                </Button>
              </div>
              <CardDescription>
                Manually refresh your subscription status from Stripe. Use this if your subscription status seems out of sync.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Webhook Configuration - Admin Only */}
        {isAdmin && (
          <Card className="max-w-3xl mx-auto mt-4 border-dashed">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Stripe Webhook Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure your Stripe webhook to automatically sync subscription status changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Required</AlertTitle>
                <AlertDescription>
                  Add this webhook endpoint in your Stripe Dashboard to enable automatic subscription updates.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Webhook Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopied(true);
                      toast.success('Webhook URL copied!');
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'checkout.session.completed',
                    'customer.subscription.updated',
                    'customer.subscription.deleted',
                    'invoice.payment_succeeded',
                    'invoice.payment_failed',
                  ].map((event) => (
                    <Badge key={event} variant="secondary" className="font-mono text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">Setup Instructions:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Go to <span className="font-medium text-foreground">Stripe Dashboard → Developers → Webhooks</span></li>
                  <li>Click <span className="font-medium text-foreground">"Add endpoint"</span></li>
                  <li>Paste the webhook URL above</li>
                  <li>Select the events listed above</li>
                  <li>Click <span className="font-medium text-foreground">"Add endpoint"</span> to save</li>
                  <li>Copy the <span className="font-medium text-foreground">Signing secret</span> and add it as <code className="bg-muted px-1 rounded">STRIPE_WEBHOOK_SECRET</code> in your secrets</li>
                </ol>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Open Stripe Webhooks Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
