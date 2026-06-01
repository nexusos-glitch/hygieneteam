import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, ExternalLink, Receipt, CreditCard, Loader2, FileArchive, Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  created: number;
  pdf_url: string | null;
  hosted_url: string | null;
  description: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
}

export default function Billing() {
  const { user } = useAuth();
  const { subscriptionEnabled, loading: settingsLoading } = useAppSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (invoice.number?.toLowerCase().includes(query)) ||
      (invoice.description?.toLowerCase().includes(query)) ||
      (invoice.id.toLowerCase().includes(query))
    );
  });

  const revenueTrends = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    const monthlyData: Record<string, { label: string, amount: number }> = {};
    
    invoices.forEach(inv => {
      // Consider paid or succeeded invoices for revenue
      if (inv.status === 'paid' || inv.status === 'succeeded') {
        const date = new Date(inv.created);
        const key = format(date, 'yyyy-MM');
        if (!monthlyData[key]) {
          monthlyData[key] = { label: format(date, 'MMM yyyy'), amount: 0 };
        }
        monthlyData[key].amount += inv.amount;
      }
    });

    return Object.keys(monthlyData)
      .sort()
      .map(key => ({
        name: monthlyData[key].label,
        revenue: monthlyData[key].amount
      }));
  }, [invoices]);

  const { totalRevenue, currentMonthRevenue, activeInvoices } = useMemo(() => {
    let total = 0;
    let currentMonth = 0;
    let active = 0;
    
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');

    invoices.forEach(inv => {
      if (inv.status === 'paid' || inv.status === 'succeeded') {
        total += inv.amount;
        const date = new Date(inv.created);
        if (format(date, 'yyyy-MM') === currentMonthKey) {
          currentMonth += inv.amount;
        }
      } else if (inv.status === 'open') {
        active++;
      }
    });

    return { totalRevenue: total, currentMonthRevenue: currentMonth, activeInvoices: active };
  }, [invoices]);

  // Redirect if subscription system is disabled
  useEffect(() => {
    if (!settingsLoading && !subscriptionEnabled) {
      navigate('/');
    }
  }, [subscriptionEnabled, settingsLoading, navigate]);

  useEffect(() => {
    if (user && subscriptionEnabled && !settingsLoading) {
      fetchBillingHistory();
    }
  }, [user, subscriptionEnabled, settingsLoading]);

  const fetchBillingHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('billing-history');

      if (error) throw error;

      setInvoices(data.invoices || []);
      setPayments(data.payments || []);
    } catch (error: any) {
      console.error('Error fetching billing history:', error);
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'succeeded':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Paid</Badge>;
      case 'open':
        return <Badge variant="outline">Open</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'void':
        return <Badge variant="destructive">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const downloadAllInvoices = async () => {
    const invoicesWithPdf = invoices.filter(inv => inv.pdf_url);
    if (invoicesWithPdf.length === 0) {
      toast.error('No invoices with PDFs available to download');
      return;
    }

    setDownloading(true);
    const zip = new JSZip();

    try {
      const fetchPromises = invoicesWithPdf.map(async (invoice) => {
        try {
          const response = await fetch(invoice.pdf_url!);
          if (!response.ok) throw new Error('Failed to fetch');
          const blob = await response.blob();
          const fileName = `invoice-${invoice.number || invoice.id.slice(0, 8)}-${format(new Date(invoice.created), 'yyyy-MM-dd')}.pdf`;
          zip.file(fileName, blob);
        } catch (err) {
          console.error(`Failed to download invoice ${invoice.id}:`, err);
        }
      });

      await Promise.all(fetchPromises);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${invoicesWithPdf.length} invoices`);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast.error('Failed to download invoices');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscriptionEnabled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto pt-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Billing History</h1>
          <p className="text-muted-foreground mt-1">
            View your invoices and payment history
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                    <span className="text-2xl font-bold">${totalRevenue.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Current Month Revenue</span>
                    <span className="text-2xl font-bold">${currentMonthRevenue.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Active Invoices</span>
                    <span className="text-2xl font-bold">{activeInvoices}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Recurring Revenue (MRR) Trends</CardTitle>
                <CardDescription>
                  Your payment history aggregated by month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueTrends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center h-[300px]">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">No recurring revenue data yet</p>
                  </div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={revenueTrends}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="name" 
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <RechartsTooltip
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            {invoices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No invoices yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by invoice number or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadAllInvoices}
                    disabled={downloading || invoices.filter(inv => inv.pdf_url).length === 0}
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileArchive className="h-4 w-4 mr-2" />
                    )}
                    Download All as ZIP
                  </Button>
                </div>
                {filteredInvoices.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Search className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No invoices match your search</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">
                            {invoice.number || invoice.id.slice(0, 8)}
                          </span>
                          {getStatusBadge(invoice.status || 'unknown')}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(invoice.created), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">
                          ${invoice.amount.toFixed(2)} {invoice.currency}
                        </span>
                        <div className="flex gap-2">
                          {invoice.pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.pdf_url!, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.hosted_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.hosted_url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments">
            {payments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">
                            {payment.id.slice(0, 12)}...
                          </span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payment.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(payment.created), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className="font-semibold">
                        ${payment.amount.toFixed(2)} {payment.currency}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
