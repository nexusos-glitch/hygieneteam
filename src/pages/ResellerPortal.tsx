import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  DollarSign, 
  TrendingUp,
  Clock,
  Package,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface AffiliateData {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings_nzd: number;
  pending_earnings_nzd: number;
}

interface Deployment {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  status: string;
  monthly_price_nzd: number;
  commission_rate: number;
  created_at: string;
  activated_at: string | null;
}

interface Commission {
  id: string;
  amount_nzd: number;
  commission_rate: number;
  period_start: string;
  period_end: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  deployment_id: string;
}

export default function ResellerPortal() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch affiliate data
    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (affiliateData) {
      setAffiliate(affiliateData);

      // Fetch deployments for this reseller
      const { data: deploymentData } = await supabase
        .from('whitelabel_deployments')
        .select('*')
        .eq('reseller_id', affiliateData.id)
        .order('created_at', { ascending: false });

      setDeployments(deploymentData || []);

      // Fetch commissions for this reseller
      const { data: commissionData } = await supabase
        .from('reseller_commissions')
        .select('*')
        .eq('reseller_id', affiliateData.id)
        .order('created_at', { ascending: false });

      setCommissions(commissionData || []);
    }

    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate stats
  const activeDeployments = deployments.filter(d => d.status === 'active').length;
  const totalMonthlyRevenue = deployments
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + (d.monthly_price_nzd * d.commission_rate), 0);
  const pendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount_nzd, 0);
  const paidCommissions = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount_nzd, 0);

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
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Become a Reseller</CardTitle>
            <CardDescription>
              Join our affiliate program first to become a white-label reseller and earn commissions on deployments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/affiliate">
              <Button className="w-full" size="lg">
                Join Affiliate Program
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reseller Portal</h1>
          <p className="text-muted-foreground">Track your white-label deployments and commissions</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {(affiliate.commission_rate * 100).toFixed(0)}% Commission Rate
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Package className="h-4 w-4" />
              Active Deployments
            </div>
            <p className="text-2xl font-bold mt-1">{activeDeployments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Monthly Revenue
            </div>
            <p className="text-2xl font-bold mt-1">${totalMonthlyRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Pending
            </div>
            <p className="text-2xl font-bold mt-1">${pendingCommissions.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Total Paid
            </div>
            <p className="text-2xl font-bold mt-1">${paidCommissions.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="commissions">Commission History</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="space-y-4">
          {deployments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Deployments Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  When you sell white-label deployments to clients, they'll appear here with their status and commission details.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deployments.map((deployment) => (
                <Card key={deployment.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{deployment.name}</h3>
                            {getStatusBadge(deployment.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {deployment.custom_domain || `${deployment.subdomain}.utubechat.com`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created {format(new Date(deployment.created_at), 'MMM d, yyyy')}
                            </span>
                            {deployment.activated_at && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Active since {format(new Date(deployment.activated_at), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${deployment.monthly_price_nzd}/mo</p>
                        <p className="text-sm text-green-600">
                          +${(deployment.monthly_price_nzd * deployment.commission_rate).toFixed(2)} commission
                        </p>
                        {deployment.status === 'active' && deployment.custom_domain && (
                          <a
                            href={`https://${deployment.custom_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                          >
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          {commissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Commissions Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Commissions from your active deployments will be tracked here with payment status.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {commissions.map((commission) => {
                    const deployment = deployments.find(d => d.id === commission.deployment_id);
                    return (
                      <div key={commission.id} className="flex items-center justify-between p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {deployment?.name || 'Unknown Deployment'}
                            </span>
                            {getStatusBadge(commission.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(commission.period_start), 'MMM d')} - {format(new Date(commission.period_end), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            +${commission.amount_nzd.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(commission.commission_rate * 100).toFixed(0)}% rate
                          </p>
                          {commission.paid_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Paid {format(new Date(commission.paid_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
