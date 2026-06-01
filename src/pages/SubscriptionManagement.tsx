import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, Loader2, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useRole } from '@/hooks/useRole';
import { useAppSettings } from '@/hooks/useAppSettings';

interface SubscriptionWithProfile {
  id: string;
  user_id: string;
  status: string;
  trial_start: string;
  trial_end: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
  };
  email?: string;
}

const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { subscriptionEnabled, loading: settingsLoading } = useAppSettings();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        profile:profiles(display_name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const subs = data as unknown as SubscriptionWithProfile[];
      
      // Fetch emails via edge function
      const userIds = subs.map(s => s.user_id);
      try {
        const { data: emailData } = await supabase.functions.invoke('get-user-emails', {
          body: { userIds }
        });
        
        if (emailData?.emails) {
          subs.forEach(sub => {
            sub.email = emailData.emails[sub.user_id] || null;
          });
        }
      } catch (e) {
        console.error('Failed to fetch emails:', e);
      }
      
      setSubscriptions(subs);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin || (!settingsLoading && !subscriptionEnabled)) {
      navigate('/');
      return;
    }
    if (!settingsLoading) {
      fetchSubscriptions();
    }
  }, [isAdmin, navigate, subscriptionEnabled, settingsLoading]);

  const getStatusBadge = (status: string, trialEnd: string) => {
    const isExpired = status === 'trialing' && new Date(trialEnd) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'trialing':
        return <Badge variant="secondary">Trialing</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrialDaysRemaining = (trialEnd: string) => {
    const days = Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'expired') {
      return matchesSearch && sub.status === 'trialing' && new Date(sub.trial_end) < new Date();
    }
    return matchesSearch && sub.status === statusFilter;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trialing: subscriptions.filter(s => s.status === 'trialing' && new Date(s.trial_end) >= new Date()).length,
    expired: subscriptions.filter(s => s.status === 'trialing' && new Date(s.trial_end) < new Date()).length,
  };

  if (!isAdmin) return null;

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">View and manage user subscriptions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-500">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trialing</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{stats.trialing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expired</CardDescription>
            <CardTitle className="text-2xl text-destructive">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchSubscriptions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No subscriptions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trial End</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Stripe ID</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {sub.profile?.display_name || 'No name'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {sub.user_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[180px] block">
                          {sub.email || <span className="text-muted-foreground">—</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sub.status, sub.trial_end)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sub.trial_end), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'trialing' ? (
                          <span className={getTrialDaysRemaining(sub.trial_end) <= 2 ? 'text-destructive font-medium' : ''}>
                            {getTrialDaysRemaining(sub.trial_end)} days
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.stripe_customer_id ? (
                          <span className="text-xs font-mono truncate max-w-[100px] block">
                            {sub.stripe_customer_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sub.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
