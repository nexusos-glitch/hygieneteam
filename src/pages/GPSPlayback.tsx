import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GPSPlaybackMap } from '@/components/gps/GPSPlaybackMap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

interface StaffMember {
  id: string;
  full_name: string;
}

const GPSPlayback = () => {
  const { visitId } = useParams();
  const [searchParams] = useSearchParams();
  const staffIdParam = searchParams.get('staffId');
  
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffIdParam || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      const { data } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('active', true)
        .order('full_name');
      
      setStaffMembers(data || []);
      setLoading(false);
    };
    
    fetchStaff();
  }, []);

  return (
    <>
      <SEO 
        title="GPS Playback - Track History"
        description="View GPS tracking history with playback controls"
      />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">GPS Tracking Playback</h1>
          <p className="text-muted-foreground">
            View historical GPS tracking data with animated playback
          </p>
        </div>

        {!visitId && (
          <div className="mb-6">
            <Label htmlFor="staff-select" className="mb-2 block">Select Staff Member</Label>
            <Select 
              value={selectedStaffId || "all"} 
              onValueChange={(value) => setSelectedStaffId(value === "all" ? "" : value)}
            >
              <SelectTrigger id="staff-select" className="w-full max-w-xs">
                <SelectValue placeholder="All staff members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All staff members</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <GPSPlaybackMap 
          staffId={selectedStaffId || undefined}
          visitId={visitId}
        />

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Start Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>End Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Current Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              <span>On Site</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-primary rounded"></div>
              <span>Traveled Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-muted-foreground/30 rounded"></div>
              <span>Full Route</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GPSPlayback;
