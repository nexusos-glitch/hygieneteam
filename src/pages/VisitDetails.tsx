import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, User, Camera, Package, AlertTriangle, Calendar, DollarSign, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoUpload } from "@/components/visit/PhotoUpload";
import { MaterialForm } from "@/components/visit/MaterialForm";
import { DamageReport } from "@/components/visit/DamageReport";
import { PhotoLightbox } from "@/components/visit/PhotoLightbox";

const VisitDetails = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Fetch visit details
  const { data: visit, isLoading } = useQuery({
    queryKey: ["visit-details", visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          site:sites (
            id,
            name,
            address,
            hourly_rate_nzd,
            client:clients (
              id,
              company_name,
              contact_name
            )
          )
        `)
        .eq("id", visitId)
        .maybeSingle();

      if (error) throw error;

      // Fetch staff name
      if (data?.staff_id) {
        const { data: staff } = await supabase
          .from("staff")
          .select("full_name")
          .eq("id", data.staff_id)
          .maybeSingle();
        return { ...data, staff_name: staff?.full_name };
      }

      return data;
    },
    enabled: !!visitId,
  });

  // Fetch photos for this visit
  const { data: photos } = useQuery({
    queryKey: ["visit-photos", visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("visit_id", visitId)
        .order("taken_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!visitId,
  });

  // Fetch materials for this visit
  const { data: materials } = useQuery({
    queryKey: ["visit-materials", visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!visitId,
  });

  // Fetch damages for this visit
  const { data: damages } = useQuery({
    queryKey: ["visit-damages", visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("damages")
        .select("*")
        .eq("visit_id", visitId)
        .order("reported_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!visitId,
  });

  const getVisitStatus = () => {
    if (!visit) return "unknown";
    if (visit.finalized) return "completed";
    if (visit.departed_at) return "departed";
    if (visit.arrived_at) return "in-progress";
    return "scheduled";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in-progress":
        return <Badge variant="default">In Progress</Badge>;
      case "departed":
        return <Badge variant="secondary">Departed</Badge>;
      default:
        return <Badge variant="outline">Scheduled</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
      case "critical":
      case "severe":
        return "bg-red-100 text-red-800";
      case "medium":
      case "moderate":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const canEdit = visit && !visit.finalized;

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="p-4">
        <Card className="p-8 text-center">
          <h3 className="font-semibold text-lg mb-2">Visit not found</h3>
          <p className="text-muted-foreground mb-4">
            The visit you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate("/schedule")}>Back to Schedule</Button>
        </Card>
      </div>
    );
  }

  const status = getVisitStatus();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Visit Details</h2>
          <p className="text-muted-foreground">
            {visit.site?.client?.company_name || "Unknown Client"}
          </p>
        </div>
        {getStatusBadge(status)}
      </div>

      {/* Visit Info Card */}
      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{visit.site?.name || "Unknown Site"}</h3>
            {visit.site?.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>{visit.site.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{(visit as any).staff_name || "Unassigned"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>
              {visit.scheduled_at
                ? format(new Date(visit.scheduled_at), "MMM d, yyyy")
                : visit.arrived_at
                ? format(new Date(visit.arrived_at), "MMM d, yyyy")
                : "Not scheduled"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Duration: {formatDuration(visit.on_site_ms)}</span>
          </div>
          {visit.visit_total_nzd && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>Total: ${visit.visit_total_nzd.toFixed(2)}</span>
            </div>
          )}
        </div>

        {visit.arrived_at && (
          <div className="text-sm text-muted-foreground">
            <p>Arrived: {format(new Date(visit.arrived_at), "h:mm a")}</p>
            {visit.departed_at && (
              <p>Departed: {format(new Date(visit.departed_at), "h:mm a")}</p>
            )}
          </div>
        )}
      </Card>

      {/* Tabs for Photos, Materials, Damage */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="photos" className="text-xs sm:text-sm">
            Photos ({photos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="materials" className="text-xs sm:text-sm">
            Materials ({materials?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="damage" className="text-xs sm:text-sm">
            Damage ({damages?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Photos Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Photos ({photos?.length || 0})</h3>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab("photos")}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {photos && photos.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {photos.slice(0, 4).map((photo, index) => (
                  <button
                    key={photo.id}
                    className="relative aspect-square cursor-pointer hover:opacity-90 transition-opacity rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || "Visit photo"}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {photos.length > 4 && (
                  <Button
                    variant="ghost"
                    className="aspect-square flex items-center justify-center bg-secondary rounded-lg"
                    onClick={() => setActiveTab("photos")}
                  >
                    +{photos.length - 4} more
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No photos uploaded
              </p>
            )}
          </Card>

          {/* Materials Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Materials ({materials?.length || 0})</h3>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab("materials")}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {materials && materials.length > 0 ? (
              <div className="space-y-2">
                {materials.slice(0, 3).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{material.name}</span>
                    <span className="font-medium">
                      ${(material.qty * material.unit_cost_nzd).toFixed(2)}
                    </span>
                  </div>
                ))}
                {materials.length > 3 && (
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto"
                    onClick={() => setActiveTab("materials")}
                  >
                    View all {materials.length} materials
                  </Button>
                )}
                <div className="flex justify-between pt-2 border-t font-medium">
                  <span>Total</span>
                  <span>
                    ${materials.reduce((sum, m) => sum + m.qty * m.unit_cost_nzd, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No materials recorded
              </p>
            )}
          </Card>

          {/* Damage Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Damage Reports ({damages?.length || 0})</h3>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab("damage")}>
                  <Plus className="w-4 h-4 mr-1" />
                  Report
                </Button>
              )}
            </div>

            {damages && damages.length > 0 ? (
              <div className="space-y-2">
                {damages.slice(0, 2).map((damage) => (
                  <div
                    key={damage.id}
                    className="p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(damage.severity)} variant="secondary">
                        {damage.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {damage.description}
                    </p>
                  </div>
                ))}
                {damages.length > 2 && (
                  <Button
                    variant="link"
                    className="text-sm p-0 h-auto"
                    onClick={() => setActiveTab("damage")}
                  >
                    View all {damages.length} reports
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No damage reports
              </p>
            )}
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          {canEdit ? (
            <PhotoUpload visitId={visitId!} />
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Photos ({photos?.length || 0})</h3>
              </div>

              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      className="relative aspect-square cursor-pointer hover:opacity-90 transition-opacity rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => openLightbox(index)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || "Visit photo"}
                        className="w-full h-full object-cover"
                      />
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                          {photo.caption}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No photos uploaded for this visit
                </p>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="mt-4">
          {canEdit ? (
            <MaterialForm visitId={visitId!} />
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Materials ({materials?.length || 0})</h3>
              </div>

              {materials && materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {material.sku} • {material.qty} {material.unit}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(material.qty * material.unit_cost_nzd).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Materials Total</span>
                    <span className="font-semibold">
                      ${materials.reduce((sum, m) => sum + m.qty * m.unit_cost_nzd, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No materials recorded for this visit
                </p>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Damage Tab */}
        <TabsContent value="damage" className="mt-4">
          {canEdit ? (
            <DamageReport visitId={visitId!} />
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Damage Reports ({damages?.length || 0})</h3>
              </div>

              {damages && damages.length > 0 ? (
                <div className="space-y-3">
                  {damages.map((damage) => (
                    <div
                      key={damage.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={getSeverityColor(damage.severity)}>
                          {damage.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {damage.reported_at
                            ? format(new Date(damage.reported_at), "MMM d, h:mm a")
                            : "Unknown time"}
                        </span>
                      </div>
                      <p className="text-sm">{damage.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No damage reports for this visit
                </p>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Photo Lightbox */}
      {photos && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default VisitDetails;
