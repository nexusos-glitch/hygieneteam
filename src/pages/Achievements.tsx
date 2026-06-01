import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Award, Calendar, Star, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { AchievementBadges } from '@/components/achievements/AchievementBadges';
import { YearOverYearComparison } from '@/components/achievements/YearOverYearComparison';
import { WeeklyPerformanceTrends } from '@/components/achievements/WeeklyPerformanceTrends';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subYears } from 'date-fns';
import SEO from '@/components/SEO';

interface StaffMember {
  id: string;
  full_name: string;
}

const Achievements = () => {
  const { isAdmin, isManager, isSalesManager, isStaff } = useRole();
  const { staff: currentStaff } = useCurrentStaff();
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const canViewAllStaff = isAdmin || isManager || isSalesManager;

  // Fetch all staff for dropdown
  const { data: staffList } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('active', true)
        .order('full_name');
      if (error) throw error;
      return data as StaffMember[];
    },
    enabled: canViewAllStaff,
  });

  // Fetch achievements for selected staff/period
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements-history', selectedStaffId, periodType, selectedYear],
    queryFn: async () => {
      const staffId = canViewAllStaff 
        ? (selectedStaffId === 'all' ? null : selectedStaffId)
        : currentStaff?.id;

      let query = supabase
        .from('staff_achievements')
        .select(`
          *,
          staff:staff_id(full_name)
        `)
        .eq('period_type', periodType)
        .gte('period_start', `${selectedYear}-01-01`)
        .lte('period_end', `${selectedYear}-12-31`)
        .order('period_start', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalPoints = achievements?.reduce((sum, a) => sum + a.total_points, 0) || 0;
  const totalVisits = achievements?.reduce((sum, a) => sum + a.visits_completed, 0) || 0;
  const goldCount = achievements?.filter(a => a.award_level === 'gold').length || 0;
  const silverCount = achievements?.filter(a => a.award_level === 'silver').length || 0;
  const bronzeCount = achievements?.filter(a => a.award_level === 'bronze').length || 0;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <SEO 
        title="Staff Achievements"
        description="Track staff performance achievements, badges, and year-over-year comparisons"
      />
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Achievements
            </h1>
            <p className="text-muted-foreground">
              Track performance, earn badges, and view rankings
            </p>
          </div>

          <div className="flex gap-2">
            {canViewAllStaff && (
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffList?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{totalVisits}</div>
              <div className="text-xs text-muted-foreground">Visits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl mx-auto mb-2">🥇</div>
              <div className="text-2xl font-bold">{goldCount}</div>
              <div className="text-xs text-muted-foreground">Gold</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl mx-auto mb-2">🥈</div>
              <div className="text-2xl font-bold">{silverCount}</div>
              <div className="text-xs text-muted-foreground">Silver</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl mx-auto mb-2">🥉</div>
              <div className="text-2xl font-bold">{bronzeCount}</div>
              <div className="text-xs text-muted-foreground">Bronze</div>
            </CardContent>
          </Card>
        </div>

        {/* Badges Section */}
        <AchievementBadges 
          achievements={achievements || []} 
          staffName={selectedStaffId !== 'all' 
            ? staffList?.find(s => s.id === selectedStaffId)?.full_name 
            : undefined
          }
        />

        {/* Weekly Performance Trends */}
        <WeeklyPerformanceTrends 
          staffId={canViewAllStaff ? (selectedStaffId === 'all' ? undefined : selectedStaffId) : currentStaff?.id}
        />

        {/* Year over Year Comparison */}
        <YearOverYearComparison 
          staffId={canViewAllStaff ? (selectedStaffId === 'all' ? null : selectedStaffId) : currentStaff?.id}
          currentYear={selectedYear}
        />

        {/* Achievement History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Achievement History
              </CardTitle>
              <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as 'monthly' | 'quarterly')}>
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <div key={achievement.id} className="relative">
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 left-4 z-10 text-xs"
                    >
                      {format(new Date(achievement.period_start), periodType === 'monthly' ? 'MMM yyyy' : "'Q'Q yyyy")}
                    </Badge>
                    <AchievementCard
                      staffName={achievement.staff?.full_name || 'Unknown'}
                      totalPoints={achievement.total_points}
                      visitsCompleted={achievement.visits_completed}
                      rank={achievement.rank}
                      awardLevel={achievement.award_level}
                      perfectAttendanceBonus={achievement.perfect_attendance_bonus}
                      clientRatingBonus={achievement.client_rating_bonus}
                      earlyCompletionBonus={achievement.early_completion_bonus}
                      periodType={periodType}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No achievements yet</p>
                <p className="text-sm">Complete visits to start earning points and badges!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Achievements;
