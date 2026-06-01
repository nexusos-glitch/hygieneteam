import { useEffect, useState } from "react";
import { Search, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { JobCard } from "@/components/jobs/JobCard";
import { useRole } from "@/hooks/useRole";
import { ImportExportButtons } from "@/components/shared/ImportExportButtons";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  price_nzd: number;
  status: string;
  clients: { company_name: string } | null;
  sites: { name: string } | null;
  completions_count?: number;
}

const Jobs = () => {
  const { isAdmin } = useRole();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      // Get current month boundaries
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { data, error } = await (supabase as any)
        .from("jobs")
        .select(`
          *,
          clients:client_id (company_name),
          sites:site_id (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get completion counts for this month
      const jobsWithCounts = await Promise.all(
        (data || []).map(async (job: any) => {
          const { count } = await (supabase as any)
            .from("job_completions")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id)
            .gte("completed_at", monthStart)
            .lt("completed_at", monthEnd);

          return { ...job, completions_count: count || 0 };
        })
      );

      setJobs(jobsWithCounts);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const activeJobs = jobs.filter(j => j.status === "active");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const recurringJobs = jobs.filter(j => j.frequency !== "one-time");

  const filteredJobs = (jobList: Job[]) => {
    if (!searchTerm) return jobList;
    const term = searchTerm.toLowerCase();
    return jobList.filter(
      job =>
        job.title.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term) ||
        job.clients?.company_name.toLowerCase().includes(term)
    );
  };

  if (loading) {
    return <div className="p-4">Loading jobs...</div>;
  }

  return (
    <div className="p-4 space-y-6" data-walkthrough="jobs-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            Jobs
          </h2>
          <p className="text-muted-foreground">Manage recurring and one-time jobs</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <ImportExportButtons
              entityName="Jobs"
              data={jobs.map(j => ({
                title: j.title,
                description: j.description || "",
                frequency: j.frequency,
                price_nzd: isAdmin ? j.price_nzd : undefined,
                status: j.status,
                client_name: j.clients?.company_name || "",
                site_name: j.sites?.name || "",
              }))}
              columns={[
                { key: "title", label: "Title", required: true },
                { key: "description", label: "Description" },
                { key: "frequency", label: "Frequency", required: true },
                { key: "price_nzd", label: "Price (NZD)" },
                { key: "status", label: "Status" },
                { key: "client_name", label: "Client Name" },
                { key: "site_name", label: "Site Name" },
              ]}
              onImport={async (data) => {
                // Get clients and sites for matching
                const { data: clientsData } = await supabase.from("clients").select("id, company_name");
                const { data: sitesData } = await supabase.from("sites").select("id, name");
                
                const clientMap = new Map((clientsData || []).map(c => [c.company_name.toLowerCase(), c.id]));
                const siteMap = new Map((sitesData || []).map(s => [s.name.toLowerCase(), s.id]));
                
                for (const row of data) {
                  const clientId = row.client_name ? clientMap.get(row.client_name.toLowerCase()) : null;
                  const siteId = row.site_name ? siteMap.get(row.site_name.toLowerCase()) : null;
                  
                  if (!clientId) {
                    toast.error(`Client "${row.client_name}" not found - skipping job "${row.title}"`);
                    continue;
                  }
                  
                  await supabase.from("jobs").insert({
                    title: row.title,
                    description: row.description || null,
                    frequency: row.frequency || "one-time",
                    price_nzd: parseFloat(row.price_nzd) || 0,
                    status: row.status || "active",
                    client_id: clientId,
                    site_id: siteId || null,
                  });
                }
                loadJobs();
              }}
            />
          )}
          {isAdmin && (
            <div data-onboarding="add-job">
              <AddJobDialog onJobAdded={loadJobs} />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search jobs..."
          className="pl-10 h-12 bg-card border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center border-border">
          <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
          <p className="text-xs text-muted-foreground">Total Jobs</p>
        </Card>
        <Card className="p-3 text-center border-border">
          <p className="text-2xl font-bold text-primary">{activeJobs.length}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
        <Card className="p-3 text-center border-border">
          <p className="text-2xl font-bold text-accent">{recurringJobs.length}</p>
          <p className="text-xs text-muted-foreground">Recurring</p>
        </Card>
      </div>

      {/* Jobs Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="one-time">One-time</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {filteredJobs(jobs).length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">No jobs found. Create your first job!</p>
            </Card>
          ) : (
            filteredJobs(jobs).map((job) => (
              <JobCard key={job.id} job={job} onJobCompleted={loadJobs} />
            ))
          )}
        </TabsContent>

        <TabsContent value="recurring" className="space-y-3 mt-4">
          {filteredJobs(recurringJobs).length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">No recurring jobs found.</p>
            </Card>
          ) : (
            filteredJobs(recurringJobs).map((job) => (
              <JobCard key={job.id} job={job} onJobCompleted={loadJobs} />
            ))
          )}
        </TabsContent>

        <TabsContent value="one-time" className="space-y-3 mt-4">
          {filteredJobs(jobs.filter(j => j.frequency === "one-time")).length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">No one-time jobs found.</p>
            </Card>
          ) : (
            filteredJobs(jobs.filter(j => j.frequency === "one-time")).map((job) => (
              <JobCard key={job.id} job={job} onJobCompleted={loadJobs} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Jobs;
