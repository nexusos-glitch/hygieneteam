import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  Copy, 
  Check, 
  Share2, 
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface AffiliateData {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings_nzd: number;
  pending_earnings_nzd: number;
}

interface Referral {
  id: string;
  status: string;
  commission_nzd: number;
  created_at: string;
  converted_at: string | null;
}

export default function Affiliate() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    if (!user) return;

    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (affiliateData) {
      setAffiliate(affiliateData);

      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false });

      setReferrals(referralData || []);
    }

    setLoading(false);
  };

  const createAffiliateAccount = async () => {
    if (!user) return;
    setCreating(true);

    try {
      // Generate unique affiliate code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_affiliate_code');

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: codeData,
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliate(data);
      toast.success('Affiliate account created!');
    } catch (error: any) {
      console.error('Error creating affiliate:', error);
      toast.error('Failed to create affiliate account');
    } finally {
      setCreating(false);
    }
  };

  const copyReferralLink = () => {
    if (!affiliate) return;
    const link = `https://utubechat.com/signup?ref=${affiliate.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    if (!affiliate) return;
    const link = `https://utubechat.com/signup?ref=${affiliate.affiliate_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on UtubeChat',
          text: 'Sign up using my referral link and we both benefit!',
          url: link,
        });
      } catch (err) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join Our Affiliate Program</CardTitle>
            <CardDescription>
              Earn 20% commission on every customer you refer. When they pay, you get paid!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Share2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Share Your Link</h4>
                  <p className="text-sm text-muted-foreground">
                    Get a unique referral link to share with your network
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">They Sign Up</h4>
                  <p className="text-sm text-muted-foreground">
                    When someone uses your link, they get a 7-day free trial
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">You Earn 20%</h4>
                  <p className="text-sm text-muted-foreground">
                    Earn $7.80 for every customer who subscribes at $39/month
                  </p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={createAffiliateAccount}
              disabled={creating}
            >
              {creating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                'Become an Affiliate'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">Track your referrals and earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total Referrals
            </div>
            <p className="text-2xl font-bold mt-1">{affiliate.total_referrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </div>
            <p className="text-2xl font-bold mt-1">
              {affiliate.total_referrals > 0 
                ? `${Math.round((referrals.filter(r => r.status === 'converted').length / affiliate.total_referrals) * 100)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Total Earned
            </div>
            <p className="text-2xl font-bold mt-1">${affiliate.total_earnings_nzd.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Pending
            </div>
            <p className="text-2xl font-bold mt-1">${affiliate.pending_earnings_nzd.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with your network. You earn 20% commission on every subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={`https://utubechat.com/signup?ref=${affiliate.affiliate_code}`}
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyReferralLink}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={shareReferralLink}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Code: {affiliate.affiliate_code}</Badge>
            <Badge variant="outline">{(affiliate.commission_rate * 100).toFixed(0)}% Commission</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No referrals yet. Share your link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div 
                  key={referral.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">Referral #{referral.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        referral.status === 'converted' ? 'default' :
                        referral.status === 'paid' ? 'secondary' : 'outline'
                      }
                    >
                      {referral.status}
                    </Badge>
                    {referral.commission_nzd > 0 && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        +${referral.commission_nzd.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
