import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import SEO from '@/components/SEO';
import GPSStatusIndicator, { getGPSStatus } from '@/components/gps/GPSStatusIndicator';
import { GPSConnectionBanner } from '@/components/gps/GPSConnectionBanner';
import { useGPSConnection } from '@/hooks/useGPSConnection';
import {
  MapPin,
  Wifi,
  Signal,
  Battery,
  RefreshCw,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Navigation,
  Crosshair,
  Clock,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

interface GPSTestResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

const GPSSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isManager, loading: roleLoading } = useRole();
  
  // Use the GPS connection hook for live monitoring
  const gpsConnection = useGPSConnection({
    enableHighAccuracy: true,
    maxRetries: 5,
    onConnectionChange: (status) => {
      if (status === 'connected') {
        toast({ title: 'GPS Connected', description: 'GPS signal acquired successfully.' });
      } else if (status === 'failed') {
        toast({ title: 'GPS Connection Failed', variant: 'destructive' });
      }
    },
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<GPSTestResult | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  
  // Configuration options
  const [config, setConfig] = useState({
    highAccuracy: true,
    wifiAssisted: true,
    backgroundTracking: true,
    trackingInterval: 10, // seconds
    minDistance: 5, // meters
    stealthMode: false,
    batteryOptimized: false,
  });

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        };
      });
    }
  }, []);

  const runGPSTest = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'GPS Not Available',
        description: 'This device does not support GPS.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result: GPSTestResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        };
        setTestResult(result);
        setTesting(false);
        setPermissionStatus('granted');

        toast({
          title: 'GPS Test Complete',
          description: `Accuracy: ${result.accuracy.toFixed(1)}m`,
        });
      },
      (error) => {
        setTesting(false);
        let message = 'Unknown error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable in device settings.';
            setPermissionStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable. Check GPS settings.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Try again.';
            break;
        }
        toast({
          title: 'GPS Test Failed',
          description: message,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: config.highAccuracy,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [config.highAccuracy, toast]);

  const saveConfiguration = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'gps_tracking_config',
          value: config,
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      toast({
        title: 'Configuration Saved',
        description: 'GPS tracking settings have been updated.',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save configuration.',
        variant: 'destructive',
      });
    }
  };

  // Use connection status from the hook
  const displayStatus = gpsConnection.signalQuality;
  const displayAccuracy = gpsConnection.accuracy;

  if (roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">Only admins and managers can access GPS setup.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="GPS Setup | Service Pro"
        description="Configure GPS tracking settings for staff devices"
      />
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">GPS Setup</h1>
            <p className="text-muted-foreground">Configure GPS tracking for staff devices</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Live GPS Connection Banner */}
        <GPSConnectionBanner
          status={gpsConnection.status}
          signalQuality={gpsConnection.signalQuality}
          accuracy={gpsConnection.accuracy}
          errorMessage={gpsConnection.errorMessage}
          onReconnect={gpsConnection.reconnect}
        />

        {/* GPS Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="w-5 h-5" />
              GPS Connection Status
            </CardTitle>
            <CardDescription>Real-time GPS signal quality and device status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    displayStatus === 'excellent' ? 'bg-green-500/20' :
                    displayStatus === 'good' ? 'bg-yellow-500/20' :
                    displayStatus === 'weak' ? 'bg-orange-500/20' :
                    'bg-red-500/20'
                  }`}>
                    <GPSStatusIndicator status={displayStatus} size="lg" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {displayStatus === 'excellent' && 'Excellent Signal'}
                    {displayStatus === 'good' && 'Good Signal'}
                    {displayStatus === 'weak' && 'Weak Signal'}
                    {displayStatus === 'none' && 'No Signal'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {displayAccuracy ? `Accuracy: ±${displayAccuracy.toFixed(1)}m` : 'Acquiring signal...'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={gpsConnection.reconnect}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
                <Button onClick={runGPSTest} disabled={testing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testing...' : 'Test GPS'}
                </Button>
              </div>
            </div>

            {/* Permission Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {permissionStatus === 'granted' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : permissionStatus === 'denied' ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Permission</p>
                  <p className="text-xs text-muted-foreground capitalize">{permissionStatus}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Device GPS</p>
                  <p className="text-xs text-muted-foreground">
                    {navigator.geolocation ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Wifi className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">WiFi Assist</p>
                  <p className="text-xs text-muted-foreground">
                    {config.wifiAssisted ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Results */}
            {testResult && (
              <>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Latitude</span>
                    </div>
                    <p className="font-mono text-sm">{testResult.latitude.toFixed(6)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Longitude</span>
                    </div>
                    <p className="font-mono text-sm">{testResult.longitude.toFixed(6)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Crosshair className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Accuracy</span>
                    </div>
                    <p className="font-mono text-sm">±{testResult.accuracy.toFixed(1)}m</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Navigation className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Speed</span>
                    </div>
                    <p className="font-mono text-sm">
                      {testResult.speed !== null ? `${(testResult.speed * 3.6).toFixed(1)} km/h` : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Tracking Configuration
            </CardTitle>
            <CardDescription>Configure GPS tracking behavior for staff devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              {/* High Accuracy */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">High Accuracy Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use GPS, WiFi, and mobile networks for best accuracy
                  </p>
                </div>
                <Switch
                  checked={config.highAccuracy}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, highAccuracy: checked }))}
                />
              </div>

              <Separator />

              {/* WiFi Assisted */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    WiFi-Assisted Location
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use nearby WiFi networks to improve accuracy indoors
                  </p>
                </div>
                <Switch
                  checked={config.wifiAssisted}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, wifiAssisted: checked }))}
                />
              </div>

              <Separator />

              {/* Background Tracking */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Background Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Continue tracking when app is minimized
                  </p>
                </div>
                <Switch
                  checked={config.backgroundTracking}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, backgroundTracking: checked }))}
                />
              </div>

              <Separator />

              {/* Stealth Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    Stealth Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hide GPS indicator from staff view (admin only)
                  </p>
                </div>
                <Switch
                  checked={config.stealthMode}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, stealthMode: checked }))}
                />
              </div>

              <Separator />

              {/* Battery Optimization */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    Battery Optimized
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce tracking frequency to save battery
                  </p>
                </div>
                <Switch
                  checked={config.batteryOptimized}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, batteryOptimized: checked }))}
                />
              </div>

              <Separator />

              {/* Tracking Interval */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Tracking Interval
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      How often to record location: {config.trackingInterval} seconds
                    </p>
                  </div>
                  <Badge variant="secondary">{config.trackingInterval}s</Badge>
                </div>
                <Slider
                  value={[config.trackingInterval]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, trackingInterval: value }))}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5s (More accurate)</span>
                  <span>60s (Battery saver)</span>
                </div>
              </div>

              <Separator />

              {/* Minimum Distance */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Minimum Distance
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Only record if moved more than: {config.minDistance} meters
                    </p>
                  </div>
                  <Badge variant="secondary">{config.minDistance}m</Badge>
                </div>
                <Slider
                  value={[config.minDistance]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, minDistance: value }))}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1m (High detail)</span>
                  <span>50m (Low detail)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => navigate('/gps-playback')}>
                View Playback
              </Button>
              <Button onClick={saveConfiguration}>
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/gps-playback')}>
            <CardContent className="pt-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">GPS Playback</h3>
              <p className="text-sm text-muted-foreground">View historical tracking data</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/visit-tracking')}>
            <CardContent className="pt-6 text-center">
              <Navigation className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Visit Tracking</h3>
              <p className="text-sm text-muted-foreground">Track active visits</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/install')}>
            <CardContent className="pt-6 text-center">
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Install App</h3>
              <p className="text-sm text-muted-foreground">Setup on staff device</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default GPSSetup;
