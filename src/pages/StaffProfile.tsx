import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, DollarSign, MapPin, Star, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

interface StaffMember {
  id: string;
  full_name: string;
  active: boolean;
}

interface VisitWithDetails {
  id: string;
  site_name: string;
  client_name: string;
  arrived_at: string;
  departed_at?: string;
  on_site_ms?: number;
  visit_total_nzd?: number;
  finalized: boolean;
}

interface Feedback {
  id: string;
  rating: number;
  feedback_text?: string;
  client_name?: string;
  created_at: string;
  visit_site?: string;
}

const StaffProfile = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [visits, setVisits] = useState<VisitWithDetails[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisits: 0,
    completedVisits: 0,
    totalRevenue: 0,
    avgRating: 0,
  });

  useEffect(() => {
    if (staffId) {
      loadStaffData();
    }
  }, [staffId]);

  const loadStaffData = async () => {
    try {
      setLoading(true);

      // Fetch staff details
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("id", staffId)
        .single();

      if (staffError) throw staffError;
      setStaff(staffData);

      // Fetch visits for this staff member
      const { data: visitsData, error: visitsError } = await supabase
        .from("visits")
        .select(`
          id,
          site_id,
          arrived_at,
          departed_at,
          on_site_ms,
          visit_total_nzd,
          finalized
        `)
        .eq("staff_id", staffId)
        .order("created_at", { ascending: false });

      if (visitsError) throw visitsError;

      // Get site and client info for visits
      const siteIds = [...new Set(visitsData?.map((v: any) => v.site_id).filter(Boolean))];
      
      const { data: sitesData, error: sitesError } = await supabase
        .from("sites")
        .select("id, name, client_id")
        .in("id", siteIds);

      if (sitesError) throw sitesError;

      const clientIds = [...new Set(sitesData?.map((s: any) => s.client_id).filter(Boolean))];
      
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients" as any)
        .select("id, company_name")
        .in("id", clientIds);

      if (clientsError) throw clientsError;

      const siteMap = new Map(sitesData?.map((s: any) => [s.id, s]));
      const clientMap = new Map((clientsData as any[])?.map((c: any) => [c.id, c.company_name]));

      const visitsWithDetails: VisitWithDetails[] = (visitsData as any[])?.map((visit: any) => {
        const site = siteMap.get(visit.site_id);
        return {
          id: visit.id,
          site_name: site?.name || "Unknown Site",
          client_name: clientMap.get(site?.client_id) || "Unknown Client",
          arrived_at: visit.arrived_at,
          departed_at: visit.departed_at,
          on_site_ms: visit.on_site_ms,
          visit_total_nzd: visit.visit_total_nzd,
          finalized: visit.finalized,
        };
      });

      setVisits(visitsWithDetails);

      // Fetch feedback
      const visitIds = visitsData?.map((v: any) => v.id) || [];
      if (visitIds.length > 0) {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("visit_feedback" as any)
          .select("*")
          .in("visit_id", visitIds)
          .order("created_at", { ascending: false });

        if (feedbackError) throw feedbackError;

        // Add site names to feedback
        const feedbackWithSites = await Promise.all(
          (feedbackData as any[])?.map(async (fb: any) => {
            const visit = visitsData?.find((v: any) => v.id === fb.visit_id);
            const site = siteMap.get((visit as any)?.site_id);
            return {
              ...fb,
              visit_site: site?.name,
            };
          }) || []
        );

        setFeedback(feedbackWithSites as Feedback[]);

        // Calculate stats
        const totalVisits = visitsData?.length || 0;
        const completedVisits = visitsData?.filter((v: any) => v.finalized).length || 0;
        const totalRevenue = visitsData?.reduce(
          (sum: number, v: any) => sum + Number(v.visit_total_nzd || 0),
          0
        );
        const avgRating =
          feedbackWithSites.length > 0
            ? feedbackWithSites.reduce((sum, f) => sum + f.rating, 0) / feedbackWithSites.length
            : 0;

        setStats({
          totalVisits,
          completedVisits,
          totalRevenue,
          avgRating,
        });
      }
    } catch (error) {
      console.error("Error loading staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="p-6">Loading staff profile...</div>;
  }

  if (!staff) {
    return (
      <div className="p-6">
        <p>Staff member not found</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Staff Profile</h1>
          <p className="text-muted-foreground">Performance metrics and visit history</p>
        </div>
      </div>

      {/* Staff Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {staff.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{staff.full_name}</h2>
                <Badge variant={staff.active ? "default" : "secondary"} className="mt-2">
                  {staff.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalVisits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-primary">{stats.completedVisits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                    </p>
                    {stats.avgRating > 0 && <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="visits" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="feedback">Client Feedback</TabsTrigger>
        </TabsList>

        {/* Visits Tab */}
        <TabsContent value="visits" className="space-y-4">
          {visits.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No visits found for this staff member</p>
              </CardContent>
            </Card>
          ) : (
            visits.map((visit) => (
              <Card key={visit.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div>
                        <p className="font-semibold text-foreground text-lg">{visit.client_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>{visit.site_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(visit.arrived_at), "PPp")}</span>
                      </div>
                      {visit.on_site_ms && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Duration: {formatDuration(visit.on_site_ms)}</span>
                        </div>
                      )}
                      <Badge variant={visit.finalized ? "default" : "secondary"}>
                        {visit.finalized ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      {visit.visit_total_nzd && (
                        <div className="text-2xl font-bold text-primary">
                          ${Number(visit.visit_total_nzd).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          {feedback.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No client feedback yet</p>
              </CardContent>
            </Card>
          ) : (
            feedback.map((fb) => (
              <Card key={fb.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {fb.client_name || "Anonymous"}
                        </p>
                        {fb.visit_site && (
                          <p className="text-sm text-muted-foreground">{fb.visit_site}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fb.created_at), "PPp")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < fb.rating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {fb.feedback_text && (
                      <>
                        <Separator />
                        <p className="text-sm text-foreground">{fb.feedback_text}</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffProfile;
