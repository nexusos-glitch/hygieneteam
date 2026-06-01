import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Staff as StaffType } from "@/lib/serviceAppFunctions";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { StaffCard } from "@/components/staff/StaffCard";

interface StaffWithStats extends StaffType {
  visitCount: number;
  totalRevenue: number;
}

const Staff = () => {
  const [staff, setStaff] = useState<StaffWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadStaff = async () => {
    try {
      setLoading(true);

      // Fetch all staff
      const { data: staffData, error: staffError } = await (supabase as any)
        .from("staff")
        .select("*")
        .order("full_name");

      if (staffError) throw staffError;

      // Fetch visit stats
      const { data: visits, error: visitsError } = await supabase
        .from("visits")
        .select("staff_id, visit_total_nzd, finalized")
        .eq("finalized", true);

      if (visitsError) throw visitsError;

      // Calculate stats per staff member
      const statsMap = new Map<string, { count: number; revenue: number }>();
      visits?.forEach((visit: any) => {
        if (visit.staff_id) {
          const current = statsMap.get(visit.staff_id) || { count: 0, revenue: 0 };
          statsMap.set(visit.staff_id, {
            count: current.count + 1,
            revenue: current.revenue + Number(visit.visit_total_nzd || 0),
          });
        }
      });

      // Combine staff with stats
      const staffWithStats: StaffWithStats[] = (staffData || []).map((s: any) => {
        const stats = statsMap.get(s.id) || { count: 0, revenue: 0 };
        return {
          ...s,
          visitCount: stats.count,
          totalRevenue: stats.revenue,
        };
      });

      setStaff(staffWithStats);
    } catch (error) {
      console.error("Error loading staff:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = staff.filter((s) =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeStaff = filteredStaff.filter((s) => s.active);
  const inactiveStaff = filteredStaff.filter((s) => !s.active);

  if (loading) {
    return <div className="p-4">Loading staff...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Staff Management</h2>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <AddStaffDialog onSuccess={loadStaff} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search staff..."
          className="pl-10 h-12 bg-card border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({filteredStaff.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeStaff.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveStaff.length})</TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4">
          {filteredStaff.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">
                {searchTerm ? "No staff found matching your search" : "No staff found. Add your first team member above."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  visitCount={s.visitCount}
                  totalRevenue={s.totalRevenue}
                  onUpdate={loadStaff}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeStaff.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">
                No active staff found
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStaff.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  visitCount={s.visitCount}
                  totalRevenue={s.totalRevenue}
                  onUpdate={loadStaff}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inactive Tab */}
        <TabsContent value="inactive" className="space-y-4">
          {inactiveStaff.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">
                No inactive staff found
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveStaff.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  visitCount={s.visitCount}
                  totalRevenue={s.totalRevenue}
                  onUpdate={loadStaff}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Staff;
