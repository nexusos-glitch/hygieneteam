import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDataSharing } from '@/hooks/useDataSharing';
import { useRole } from '@/hooks/useRole';
import AppLayout from '@/components/Layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Share2, Copy, RefreshCw, Link as LinkIcon, Unlink, Clock, CheckCircle2, XCircle, Loader2, MapPin, Camera, Package, AlertTriangle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import SEO from '@/components/SEO';

const DATA_TYPE_OPTIONS = [
  { id: 'visits', label: 'Visits', icon: Clock, description: 'Visit records with times and durations' },
  { id: 'gps_history', label: 'GPS Tracking', icon: MapPin, description: 'GPS location history during visits' },
  { id: 'photos', label: 'Photos', icon: Camera, description: 'Photos taken during visits' },
  { id: 'materials', label: 'Materials', icon: Package, description: 'Materials used on site' },
  { id: 'damage_reports', label: 'Damage Reports', icon: AlertTriangle, description: 'Damage reports filed' }
];

export default function DataSharing() {
  const { isAdmin, isManager, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const {
    configs,
    configsLoading,
    syncLogs,
    logsLoading,
    createConfig,
    updateConfig,
    deleteConfig,
    triggerSync,
    isSyncing,
    regenerateToken
  } = useDataSharing();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['visits', 'gps_history']);
  const [configureRemoteDialogId, setConfigureRemoteDialogId] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [remoteToken, setRemoteToken] = useState('');

  // Fetch clients for creating new configs
  const { data: clients } = useQuery({
    queryKey: ['clients-for-sharing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, contact_name')
        .order('company_name');
      if (error) throw error;
      return data;
    }
  });

  // Get clients that don't have a config yet
  const availableClients = clients?.filter(
    client => !configs?.some(config => config.client_id === client.id)
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`
    });
  };

  const handleCreateConfig = async () => {
    if (!selectedClientId) return;
    
    await createConfig.mutateAsync({
      client_id: selectedClientId,
      allowed_data_types: selectedDataTypes
    });
    
    setIsCreateDialogOpen(false);
    setSelectedClientId('');
    setSelectedDataTypes(['visits', 'gps_history']);
  };

  const handleSaveRemoteConfig = async () => {
    if (!configureRemoteDialogId) return;
    
    await updateConfig.mutateAsync({
      id: configureRemoteDialogId,
      updates: {
        remote_instance_url: remoteUrl || null,
        remote_sync_token: remoteToken || null
      }
    });
    
    setConfigureRemoteDialogId(null);
    setRemoteUrl('');
    setRemoteToken('');
  };

  const handleDataTypeToggle = async (configId: string, currentTypes: string[], dataType: string) => {
    const newTypes = currentTypes.includes(dataType)
      ? currentTypes.filter(t => t !== dataType)
      : [...currentTypes, dataType];
    
    await updateConfig.mutateAsync({
      id: configId,
      updates: { allowed_data_types: newTypes }
    });
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin && !isManager) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEO 
        title="Data Sharing | Service Pro"
        description="Share visit and GPS data with head contractors and partner instances"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Data Sharing</h1>
            <p className="text-muted-foreground">
              Share visit and GPS data with head contractors who use ServicePro
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/imported-data">
                <Database className="h-4 w-4 mr-2" />
                View Imported Data
              </Link>
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!availableClients?.length}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Enable Sharing
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enable Data Sharing</DialogTitle>
                <DialogDescription>
                  Generate a sync token for a client to import your data into their ServicePro instance.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Client</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Data to Share</Label>
                  <div className="space-y-2">
                    {DATA_TYPE_OPTIONS.map(option => (
                      <div key={option.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                        <Checkbox
                          id={option.id}
                          checked={selectedDataTypes.includes(option.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDataTypes([...selectedDataTypes, option.id]);
                            } else {
                              setSelectedDataTypes(selectedDataTypes.filter(t => t !== option.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <label htmlFor={option.id} className="font-medium cursor-pointer flex items-center gap-2">
                            <option.icon className="h-4 w-4 text-muted-foreground" />
                            {option.label}
                          </label>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateConfig} 
                  disabled={!selectedClientId || selectedDataTypes.length === 0 || createConfig.isPending}
                >
                  {createConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Token
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Tabs defaultValue="export" className="space-y-4">
          <TabsList>
            <TabsTrigger value="export">Export (Share Out)</TabsTrigger>
            <TabsTrigger value="import">Import (Pull In)</TabsTrigger>
            <TabsTrigger value="logs">Sync History</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            {configsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : configs?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No data sharing configured</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enable sharing for a client to generate a sync token they can use to import your data.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!availableClients?.length}>
                    Enable Sharing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {configs?.map(config => (
                  <Card key={config.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {config.clients?.company_name}
                            <Badge variant={config.is_active ? 'default' : 'secondary'}>
                              {config.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {config.clients?.contact_name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={(checked) => {
                              updateConfig.mutate({
                                id: config.id,
                                updates: { is_active: checked }
                              });
                            }}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Unlink className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Disable Data Sharing?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will revoke the sync token. The client will no longer be able to import your data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteConfig.mutate(config.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Disable
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Sync Token */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sync Token (share with partner)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={config.sync_token} 
                            readOnly 
                            className="font-mono text-xs"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(config.sync_token, 'Sync token')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => regenerateToken.mutate(config.id)}
                            disabled={regenerateToken.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 ${regenerateToken.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      {/* Data Types */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Shared Data Types</Label>
                        <div className="flex flex-wrap gap-2">
                          {DATA_TYPE_OPTIONS.map(option => (
                            <Badge
                              key={option.id}
                              variant={config.allowed_data_types.includes(option.id) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => handleDataTypeToggle(config.id, config.allowed_data_types, option.id)}
                            >
                              <option.icon className="h-3 w-3 mr-1" />
                              {option.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Last Sync */}
                      {config.last_synced_at && (
                        <p className="text-xs text-muted-foreground">
                          Last synced: {format(new Date(config.last_synced_at), 'PPp')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import from Partner Instance</CardTitle>
                <CardDescription>
                  Configure a remote ServicePro instance to pull data from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {configs?.filter(c => c.remote_instance_url).length === 0 ? (
                  <div className="text-center py-8">
                    <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No import connections configured</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure a client's sharing config to connect to a remote instance.
                    </p>
                  </div>
                ) : null}

                {configs?.map(config => (
                  <div key={config.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{config.clients?.company_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {config.remote_instance_url || 'No remote configured'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.remote_instance_url && (
                          <Button
                            size="sm"
                            onClick={() => triggerSync(config.id)}
                            disabled={isSyncing === config.id}
                          >
                            {isSyncing === config.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Sync Now
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setConfigureRemoteDialogId(config.id);
                            setRemoteUrl(config.remote_instance_url || '');
                            setRemoteToken(config.remote_sync_token || '');
                          }}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
                <CardDescription>Recent data synchronization activity</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : syncLogs?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sync activity yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Data Types</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs?.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {log.sync_type === 'export' ? 'Export' : 'Import'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : log.status === 'failed' ? (
                              <XCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </TableCell>
                          <TableCell>{log.records_synced}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {log.data_types_synced?.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(log.started_at), 'PPp')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Configure Remote Dialog */}
      <Dialog open={!!configureRemoteDialogId} onOpenChange={() => setConfigureRemoteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Remote Instance</DialogTitle>
            <DialogDescription>
              Enter the URL and sync token of the ServicePro instance you want to import data from.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Remote Instance URL</Label>
              <Input
                placeholder="https://partner.servicepro.com"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The base URL of your partner's ServicePro instance
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Sync Token</Label>
              <Input
                placeholder="Paste the sync token here..."
                value={remoteToken}
                onChange={(e) => setRemoteToken(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Get this from your partner's Data Sharing settings
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureRemoteDialogId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRemoteConfig} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
