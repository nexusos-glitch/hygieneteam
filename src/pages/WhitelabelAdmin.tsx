import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Globe, 
  Users, 
  DollarSign, 
  Activity,
  Settings,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import AppLayout from "@/components/Layout/AppLayout";
import SEO from "@/components/SEO";

interface Deployment {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  status: string;
  owner_id: string;
  reseller_id: string | null;
  branding: Record<string, unknown>;
  monthly_price_nzd: number;
  commission_rate: number;
  created_at: string;
  activated_at: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[];
  base_price_nzd: number;
  setup_fee_nzd: number;
  is_active: boolean;
  is_featured: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  provisioning: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  suspended: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const WhitelabelAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newDeploymentOpen, setNewDeploymentOpen] = useState(false);
  const [newDeployment, setNewDeployment] = useState({
    name: "",
    subdomain: "",
    monthly_price_nzd: 299,
  });

  // Fetch deployments
  const { data: deployments = [], isLoading: deploymentsLoading } = useQuery({
    queryKey: ["whitelabel-deployments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whitelabel_deployments")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Deployment[];
    },
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["whitelabel-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whitelabel_products")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  // Create deployment mutation
  const createDeployment = useMutation({
    mutationFn: async (deployment: typeof newDeployment) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("whitelabel_deployments")
        .insert({
          name: deployment.name,
          subdomain: deployment.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          monthly_price_nzd: deployment.monthly_price_nzd,
          owner_id: user.id,
          branding: {
            company_name: deployment.name,
            primary_color: "11 100% 49%",
            accent_color: "38 92% 50%",
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelabel-deployments"] });
      setNewDeploymentOpen(false);
      setNewDeployment({ name: "", subdomain: "", monthly_price_nzd: 299 });
      toast({ title: "Deployment created", description: "New white-label instance is being provisioned." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update deployment status mutation
  const updateDeploymentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "active") updates.activated_at = new Date().toISOString();
      if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

      const { error } = await supabase
        .from("whitelabel_deployments")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelabel-deployments"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Filter deployments
  const filteredDeployments = deployments.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: deployments.length,
    active: deployments.filter((d) => d.status === "active").length,
    revenue: deployments
      .filter((d) => d.status === "active")
      .reduce((sum, d) => sum + d.monthly_price_nzd, 0),
    pending: deployments.filter((d) => d.status === "pending").length,
  };

  return (
    <AppLayout>
      <SEO 
        title="White-Label Deployment Manager | Service Pro"
        description="Manage your white-label deployments and reseller commissions"
        noIndex
      />
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">White-Label Manager</h1>
            <p className="text-muted-foreground">Manage deployments, products, and reseller commissions</p>
          </div>
          
          <Dialog open={newDeploymentOpen} onOpenChange={setNewDeploymentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Deployment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create White-Label Deployment</DialogTitle>
                <DialogDescription>
                  Set up a new white-label instance for a client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={newDeployment.name}
                    onChange={(e) => setNewDeployment({ ...newDeployment, name: e.target.value })}
                    placeholder="Acme Cleaning Co"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      value={newDeployment.subdomain}
                      onChange={(e) => setNewDeployment({ ...newDeployment, subdomain: e.target.value })}
                      placeholder="acme-cleaning"
                    />
                    <span className="text-muted-foreground text-sm">.utubechat.com</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Price (NZD)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newDeployment.monthly_price_nzd}
                    onChange={(e) => setNewDeployment({ ...newDeployment, monthly_price_nzd: Number(e.target.value) })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createDeployment.mutate(newDeployment)}
                  disabled={createDeployment.isPending || !newDeployment.name || !newDeployment.subdomain}
                >
                  {createDeployment.isPending ? "Creating..." : "Create Deployment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Deployments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Users className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Setup</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="deployments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="deployments" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search deployments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="provisioning">Provisioning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deployments List */}
            {deploymentsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading deployments...</div>
            ) : filteredDeployments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No deployments found</p>
                  <Button variant="outline" className="mt-4" onClick={() => setNewDeploymentOpen(true)}>
                    Create your first deployment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDeployments.map((deployment) => (
                  <Card key={deployment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{deployment.name}</h3>
                            <Badge className={statusColors[deployment.status]}>
                              {deployment.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              {deployment.subdomain}.utubechat.com
                            </span>
                            {deployment.custom_domain && (
                              <span className="flex items-center gap-1">
                                <ExternalLink className="w-4 h-4" />
                                {deployment.custom_domain}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${deployment.monthly_price_nzd}/mo
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {deployment.status === "pending" && (
                            <Button 
                              size="sm"
                              onClick={() => updateDeploymentStatus.mutate({ id: deployment.id, status: "active" })}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          {deployment.status === "active" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateDeploymentStatus.mutate({ id: deployment.id, status: "suspended" })}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {deployment.status === "suspended" && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => updateDeploymentStatus.mutate({ id: deployment.id, status: "active" })}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Reactivate
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateDeploymentStatus.mutate({ id: deployment.id, status: "cancelled" })}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {productsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No products configured</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{product.name}</CardTitle>
                          <CardDescription>{product.description}</CardDescription>
                        </div>
                        {product.is_featured && (
                          <Badge>Featured</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-2xl font-bold">
                        ${product.base_price_nzd}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </div>
                      {product.setup_fee_nzd > 0 && (
                        <p className="text-sm text-muted-foreground">
                          + ${product.setup_fee_nzd} setup fee
                        </p>
                      )}
                      <div className="space-y-2">
                        {(product.features as string[]).slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {feature}
                          </div>
                        ))}
                        {(product.features as string[]).length > 4 && (
                          <p className="text-sm text-muted-foreground">
                            +{(product.features as string[]).length - 4} more features
                          </p>
                        )}
                      </div>
                      <Button variant="outline" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Product
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reseller Commissions</CardTitle>
                <CardDescription>
                  Track and manage commissions for your reseller network (20% fixed rate)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p>No commissions to display yet</p>
                  <p className="text-sm mt-2">Commissions will appear here when resellers make sales</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default WhitelabelAdmin;
