import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  getVisits,
  getSites,
  createVisit,
  updateVisit,
} from "@/lib/serviceAppFunctions";
import type { Visit, Site } from "@/lib/serviceAppFunctions";
import { clockInSchema, clockOutSchema } from "@/lib/visitValidation";
import {
  Clock,
  MapPin,
  LogIn,
  LogOut,
  Package,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MaterialForm } from "@/components/visit/MaterialForm";
import { PhotoUpload } from "@/components/visit/PhotoUpload";
import { DamageReport } from "@/components/visit/DamageReport";
import { supabase } from "@/integrations/supabase/client";

const VisitTracking = () => {
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getCurrentPosition, loading: gpsLoading } = useGeolocation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [visitsData, sitesData] = await Promise.all([
        getVisits(),
        getSites(),
      ]);

      setSites(sitesData);

      // Find active visit for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const active = visitsData.find(
          (v) => v.staff_id === user.id && !v.finalized && !v.departed_at
        );
        setActiveVisit(active || null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load visit data",
        variant: "destructive",
      });
    }
  };

  const handleClockIn = async () => {
    if (!selectedSiteId) {
      toast({
        title: "Error",
        description: "Please select a site",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let gpsCoords;
      try {
        gpsCoords = await getCurrentPosition();
      } catch (gpsError) {
        toast({
          title: "GPS Warning",
          description: "Clocking in without GPS location",
          variant: "default",
        });
      }

      const visitData = clockInSchema.parse({
        site_id: selectedSiteId,
        staff_id: user.id,
        start_gps: gpsCoords,
      });

      const newVisit = await createVisit({
        ...visitData,
        arrived_at: new Date().toISOString(),
        finalized: false,
      });

      setActiveVisit(newVisit);
      toast({
        title: "Clocked In",
        description: "Visit started successfully",
      });
    } catch (error: any) {
      console.error("Clock in error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clock in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeVisit) return;

    setLoading(true);
    try {
      let gpsCoords;
      try {
        gpsCoords = await getCurrentPosition();
      } catch (gpsError) {
        toast({
          title: "GPS Warning",
          description: "Clocking out without GPS location",
          variant: "default",
        });
      }

      clockOutSchema.parse({
        visit_id: activeVisit.id,
        end_gps: gpsCoords,
      });

      const departedAt = new Date().toISOString();
      const arrivedAt = activeVisit.arrived_at;
      const onSiteMs = arrivedAt
        ? new Date(departedAt).getTime() - new Date(arrivedAt).getTime()
        : undefined;

      await updateVisit(activeVisit.id, {
        departed_at: departedAt,
        end_gps: gpsCoords,
        on_site_ms: onSiteMs,
      });

      toast({
        title: "Clocked Out",
        description: "Visit ended successfully",
      });

      setActiveVisit(null);
      loadData();
    } catch (error: any) {
      console.error("Clock out error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clock out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "0h 0m";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-4 space-y-6" data-walkthrough="visits-page">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Visit Tracking</h2>
        <p className="text-muted-foreground">Track your job site visits</p>
      </div>

      {/* Active Visit Status */}
      {activeVisit ? (
        <Card className="p-6 border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-success text-success-foreground">
                Active Visit
              </Badge>
              {activeVisit.arrived_at && (
                <div className="text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatDistanceToNow(new Date(activeVisit.arrived_at), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Duration</p>
              <p className="text-2xl font-bold text-primary">
                {formatDuration(
                  activeVisit.arrived_at
                    ? Date.now() - new Date(activeVisit.arrived_at).getTime()
                    : 0
                )}
              </p>
            </div>

            {activeVisit.start_gps && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  {activeVisit.start_gps.lat.toFixed(4)},{" "}
                  {activeVisit.start_gps.lng.toFixed(4)}
                </span>
              </div>
            )}

            <Button
              onClick={handleClockOut}
              disabled={loading || gpsLoading}
              className="w-full"
              variant="destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {gpsLoading ? "Getting GPS..." : "Clock Out"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Site
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full p-3 border rounded-lg bg-background"
              >
                <option value="">Choose a site...</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleClockIn}
              disabled={!selectedSiteId || loading || gpsLoading}
              className="w-full"
              data-walkthrough="start-visit"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {gpsLoading ? "Getting GPS..." : "Clock In"}
            </Button>
          </div>
        </Card>
      )}

      {/* Visit Actions */}
      {activeVisit && (
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">
              <Package className="w-4 h-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Camera className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="damage">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Damage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-4">
            <MaterialForm visitId={activeVisit.id} />
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <PhotoUpload visitId={activeVisit.id} />
          </TabsContent>

          <TabsContent value="damage" className="mt-4">
            <DamageReport visitId={activeVisit.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VisitTracking;
