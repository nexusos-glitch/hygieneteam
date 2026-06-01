import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Loader2, Route } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, endOfDay, isSameDay, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ImportExportButtons } from "@/components/shared/ImportExportButtons";
import { useRole } from "@/hooks/useRole";

const Schedule = () => {
  const { isAdmin, isManager } = useRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return startOfDay(monday);
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch all visits for export
  const { data: allVisits } = useQuery({
    queryKey: ["all-visits-export"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          id, scheduled_at, arrived_at, departed_at, finalized, on_site_ms,
          staff:staff_id (id, full_name),
          site:sites (id, name, clients (company_name))
        `)
        .order("scheduled_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin || isManager,
  });

  // Generate 7 days starting from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Start job mutation - sets arrived_at timestamp
  const startJobMutation = useMutation({
    mutationFn: async (visitId: string) => {
      const { error } = await supabase
        .from("visits")
        .update({ arrived_at: new Date().toISOString() })
        .eq("id", visitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-visits"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-week-counts"] });
      toast.success("Job started successfully");
    },
    onError: (error) => {
      toast.error("Failed to start job: " + error.message);
    },
  });

  // Complete visit mutation - sets departed_at and finalized
  const completeVisitMutation = useMutation({
    mutationFn: async (visit: { id: string; arrived_at: string }) => {
      const departedAt = new Date();
      const arrivedAt = new Date(visit.arrived_at);
      const onSiteMs = departedAt.getTime() - arrivedAt.getTime();

      const { error } = await supabase
        .from("visits")
        .update({
          departed_at: departedAt.toISOString(),
          on_site_ms: onSiteMs,
          finalized: true,
        })
        .eq("id", visit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-visits"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-week-counts"] });
      toast.success("Visit completed successfully");
    },
    onError: (error) => {
      toast.error("Failed to complete visit: " + error.message);
    },
  });

  // Fetch visits for the selected date
  const { data: visits, isLoading } = useQuery({
    queryKey: ["schedule-visits", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();

      // First get visits for the day
      const { data: visitsData, error } = await supabase
        .from("visits")
        .select(`
          id,
          scheduled_at,
          arrived_at,
          departed_at,
          finalized,
          on_site_ms,
          visit_total_nzd,
          staff_id,
          site:sites (
            id,
            name,
            address,
            client:clients (
              id,
              company_name,
              contact_name
            )
          )
        `)
        .or(`scheduled_at.gte.${dayStart},arrived_at.gte.${dayStart}`)
        .or(`scheduled_at.lte.${dayEnd},arrived_at.lte.${dayEnd}`)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      // Get staff names for the visits
      const staffIds = [...new Set(visitsData?.map(v => v.staff_id).filter(Boolean))];
      let staffMap: Record<string, string> = {};
      
      if (staffIds.length > 0) {
        const { data: staffData } = await supabase
          .from("staff")
          .select("id, full_name")
          .in("id", staffIds);
        
        staffData?.forEach(s => {
          staffMap[s.id] = s.full_name;
        });
      }

      return visitsData?.map(v => ({
        ...v,
        staff_name: v.staff_id ? staffMap[v.staff_id] : null
      })) || [];
    },
  });

  // Fetch visit counts for the week (for badges)
  const { data: weekCounts } = useQuery({
    queryKey: ["schedule-week-counts", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const weekEnd = endOfDay(addDays(weekStart, 6)).toISOString();
      const weekStartIso = startOfDay(weekStart).toISOString();

      const { data, error } = await supabase
        .from("visits")
        .select("id, scheduled_at, arrived_at")
        .or(`scheduled_at.gte.${weekStartIso},arrived_at.gte.${weekStartIso}`)
        .or(`scheduled_at.lte.${weekEnd},arrived_at.lte.${weekEnd}`);

      if (error) throw error;

      // Count visits per day
      const counts: Record<string, number> = {};
      data?.forEach((visit) => {
        const visitDate = visit.scheduled_at || visit.arrived_at;
        if (visitDate) {
          const dateKey = format(new Date(visitDate), "yyyy-MM-dd");
          counts[dateKey] = (counts[dateKey] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const getVisitStatus = (visit: any) => {
    if (visit.finalized) return "completed";
    if (visit.departed_at) return "departed";
    if (visit.arrived_at) return "in-progress";
    return "scheduled";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "in-progress":
        return <Badge variant="default">In Progress</Badge>;
      case "departed":
        return <Badge variant="secondary">Departed</Badge>;
      default:
        return <Badge variant="outline">Scheduled</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return null;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setWeekStart((prev) => addDays(prev, direction === "next" ? 7 : -7));
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Schedule</h2>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isManager) && (
            <ImportExportButtons
              entityName="Visits"
              data={(allVisits || []).map(v => ({
                scheduled_at: v.scheduled_at ? format(new Date(v.scheduled_at), "yyyy-MM-dd HH:mm") : "",
                staff_name: (v.staff as any)?.full_name || "",
                site_name: (v.site as any)?.name || "",
                client_name: (v.site as any)?.clients?.company_name || "",
                status: v.finalized ? "completed" : v.arrived_at ? "in-progress" : "scheduled",
                arrived_at: v.arrived_at ? format(new Date(v.arrived_at), "yyyy-MM-dd HH:mm") : "",
                departed_at: v.departed_at ? format(new Date(v.departed_at), "yyyy-MM-dd HH:mm") : "",
              }))}
              columns={[
                { key: "scheduled_at", label: "Scheduled At", required: true },
                { key: "staff_name", label: "Staff Name", required: true },
                { key: "site_name", label: "Site Name", required: true },
                { key: "client_name", label: "Client Name" },
                { key: "status", label: "Status" },
                { key: "arrived_at", label: "Arrived At" },
                { key: "departed_at", label: "Departed At" },
              ]}
              onImport={async (data) => {
                const { data: staffData } = await supabase.from("staff").select("id, full_name");
                const { data: sitesData } = await supabase.from("sites").select("id, name");
                
                const staffMap = new Map((staffData || []).map(s => [s.full_name.toLowerCase(), s.id]));
                const siteMap = new Map((sitesData || []).map(s => [s.name.toLowerCase(), s.id]));
                
                for (const row of data) {
                  const staffId = row.staff_name ? staffMap.get(row.staff_name.toLowerCase()) : null;
                  const siteId = row.site_name ? siteMap.get(row.site_name.toLowerCase()) : null;
                  
                  if (!staffId || !siteId) {
                    toast.error(`Staff or site not found for visit on ${row.scheduled_at}`);
                    continue;
                  }
                  
                  await supabase.from("visits").insert({
                    scheduled_at: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null,
                    staff_id: staffId,
                    site_id: siteId,
                    arrived_at: row.arrived_at ? new Date(row.arrived_at).toISOString() : null,
                    departed_at: row.departed_at ? new Date(row.departed_at).toISOString() : null,
                    finalized: row.status === "completed",
                  });
                }
                queryClient.invalidateQueries({ queryKey: ["schedule-visits"] });
                queryClient.invalidateQueries({ queryKey: ["all-visits-export"] });
              }}
            />
          )}
          <Button variant="outline" size="icon">
            <Calendar className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigateWeek("prev")}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const count = weekCounts?.[dateKey] || 0;
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl font-medium transition-colors relative min-w-[70px] ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-accent text-accent-foreground border-2 border-primary"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <div className="text-xs opacity-80">{format(day, "EEE")}</div>
                <div className="text-sm font-semibold">{format(day, "d")}</div>
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                    isSelected ? "bg-background text-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateWeek("next")}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))
        ) : visits && visits.length > 0 ? (
          visits.map((visit) => {
            const status = getVisitStatus(visit);
            const visitTime = visit.scheduled_at || visit.arrived_at;

            return (
              <Card
                key={visit.id}
                className="p-4 space-y-3 hover:shadow-lg transition-shadow border-l-4"
                style={{
                  borderLeftColor:
                    status === "in-progress"
                      ? "hsl(var(--primary))"
                      : status === "completed"
                      ? "hsl(var(--success, 142 76% 36%))"
                      : "hsl(var(--muted-foreground))",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground text-lg">
                      {visit.site?.client?.company_name || "Unknown Client"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {visit.site?.name || "Unknown Site"}
                    </p>
                  </div>
                  {getStatusBadge(status)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {visitTime ? format(new Date(visitTime), "h:mm a") : "Not scheduled"}
                      {visit.on_site_ms && ` (${formatDuration(visit.on_site_ms)})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {visit.staff_name || "Unassigned"}
                    </span>
                  </div>
                </div>

                {visit.site?.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-foreground">{visit.site.address}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {status === "scheduled" && (
                    <Button
                      className="flex-1"
                      onClick={() => startJobMutation.mutate(visit.id)}
                      disabled={startJobMutation.isPending}
                    >
                      {startJobMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Start Job
                    </Button>
                  )}
                  {status === "in-progress" && (
                    <Button
                      className="flex-1"
                      onClick={() => completeVisitMutation.mutate({ id: visit.id, arrived_at: visit.arrived_at })}
                      disabled={completeVisitMutation.isPending}
                    >
                      {completeVisitMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Complete Visit
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => navigate(`/visit/${visit.id}`)}>
                    Details
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigate(`/gps-playback/${visit.id}`)} title="GPS Playback">
                    <Route className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No visits scheduled</h3>
            <p className="text-muted-foreground">
              No visits are scheduled for {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Schedule;
