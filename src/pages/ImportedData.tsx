import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import AppLayout from '@/components/Layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Upload, FileSpreadsheet, FileText, Loader2, CalendarIcon, Filter, MapPin, Clock, Camera, Search, X, Map } from 'lucide-react';
import GPSClusterMap from '@/components/gps/GPSClusterMap';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import SEO from '@/components/SEO';

interface ImportedVisit {
  id: string;
  site_id: string;
  staff_id: string;
  scheduled_at: string | null;
  arrived_at: string | null;
  departed_at: string | null;
  on_site_ms: number | null;
  finalized: boolean;
  source_instance_url: string;
  source_config_id: string;
  imported_at: string;
}

interface ImportedGPSHistory {
  id: string;
  staff_id: string;
  visit_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  recorded_at: string;
  is_on_site: boolean;
  source_instance_url: string;
  source_config_id: string;
  imported_at: string;
}

interface ImportedPhoto {
  id: string;
  visit_id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  source_instance_url: string;
  source_config_id: string;
  imported_at: string;
}

export default function ImportedData() {
  const { isAdmin, isManager, loading: roleLoading } = useRole();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('visits');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showMap, setShowMap] = useState(false);

  // Fetch imported visits
  const { data: importedVisits, isLoading: visitsLoading } = useQuery({
    queryKey: ['imported-visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_visits')
        .select('*')
        .order('imported_at', { ascending: false });
      if (error) throw error;
      return data as ImportedVisit[];
    }
  });

  // Fetch imported GPS history
  const { data: importedGPS, isLoading: gpsLoading } = useQuery({
    queryKey: ['imported-gps-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_gps_history')
        .select('*')
        .order('imported_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as ImportedGPSHistory[];
    }
  });

  // Fetch imported photos
  const { data: importedPhotos, isLoading: photosLoading } = useQuery({
    queryKey: ['imported-photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_photos')
        .select('*')
        .order('imported_at', { ascending: false });
      if (error) throw error;
      return data as ImportedPhoto[];
    }
  });

  // Get unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    importedVisits?.forEach(v => sources.add(v.source_instance_url));
    importedGPS?.forEach(g => sources.add(g.source_instance_url));
    importedPhotos?.forEach(p => sources.add(p.source_instance_url));
    return Array.from(sources);
  }, [importedVisits, importedGPS, importedPhotos]);

  // Filter visits
  const filteredVisits = useMemo(() => {
    if (!importedVisits) return [];
    return importedVisits.filter(visit => {
      if (sourceFilter !== 'all' && visit.source_instance_url !== sourceFilter) return false;
      if (dateFrom && new Date(visit.imported_at) < dateFrom) return false;
      if (dateTo && new Date(visit.imported_at) > dateTo) return false;
      if (searchQuery && !visit.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [importedVisits, sourceFilter, dateFrom, dateTo, searchQuery]);

  // Filter GPS
  const filteredGPS = useMemo(() => {
    if (!importedGPS) return [];
    return importedGPS.filter(gps => {
      if (sourceFilter !== 'all' && gps.source_instance_url !== sourceFilter) return false;
      if (dateFrom && new Date(gps.imported_at) < dateFrom) return false;
      if (dateTo && new Date(gps.imported_at) > dateTo) return false;
      return true;
    });
  }, [importedGPS, sourceFilter, dateFrom, dateTo]);

  // Filter photos
  const filteredPhotos = useMemo(() => {
    if (!importedPhotos) return [];
    return importedPhotos.filter(photo => {
      if (sourceFilter !== 'all' && photo.source_instance_url !== sourceFilter) return false;
      if (dateFrom && new Date(photo.imported_at) < dateFrom) return false;
      if (dateTo && new Date(photo.imported_at) > dateTo) return false;
      if (searchQuery && photo.caption && !photo.caption.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [importedPhotos, sourceFilter, dateFrom, dateTo, searchQuery]);

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    
    toast({ title: 'Export complete', description: `${data.length} records exported to CSV` });
  };

  // Export to XLS
  const exportToXLS = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    toast({ title: 'Export complete', description: `${data.length} records exported to Excel` });
  };

  // Import from file
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>, dataType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = e.target?.result;
        let jsonData: any[] = [];

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || null;
            });
            jsonData.push(row);
          }
        } else {
          // Parse XLS/XLSX
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }

        if (jsonData.length === 0) {
          toast({ title: 'No data found in file', variant: 'destructive' });
          return;
        }

        // Add source metadata
        const importData = jsonData.map(row => ({
          ...row,
          source_instance_url: 'manual_import',
          imported_at: new Date().toISOString()
        }));

        // Insert into appropriate table
        const tableName = dataType === 'visits' ? 'imported_visits' 
          : dataType === 'gps' ? 'imported_gps_history' 
          : 'imported_photos';

        const { error } = await supabase
          .from(tableName)
          .upsert(importData, { onConflict: 'id' });

        if (error) throw error;

        toast({ 
          title: 'Import complete', 
          description: `${jsonData.length} records imported successfully` 
        });

        // Refresh data
        window.location.reload();
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (error: any) {
      toast({ 
        title: 'Import failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }

    // Reset input
    event.target.value = '';
  };

  const getExportData = () => {
    switch (activeTab) {
      case 'visits': return { data: filteredVisits, name: 'imported_visits' };
      case 'gps': return { data: filteredGPS, name: 'imported_gps_history' };
      case 'photos': return { data: filteredPhotos, name: 'imported_photos' };
      default: return { data: [], name: 'data' };
    }
  };

  const clearFilters = () => {
    setSourceFilter('all');
    setSearchQuery('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = sourceFilter !== 'all' || searchQuery || dateFrom || dateTo;

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
        title="Imported Data | Service Pro"
        description="Browse and manage data imported from partner ServicePro instances"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Imported Data</h1>
            <p className="text-muted-foreground">
              Browse data synced from partner ServicePro instances
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Import Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Import CSV
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={(e) => handleFileImport(e, activeTab)}
                    />
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Import Excel
                    <input 
                      type="file" 
                      accept=".xlsx,.xls" 
                      className="hidden" 
                      onChange={(e) => handleFileImport(e, activeTab)}
                    />
                  </label>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const { data, name } = getExportData();
                  exportToCSV(data, name);
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const { data, name } = getExportData();
                  exportToXLS(data, name);
                }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2">
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Source Filter */}
              <div className="space-y-1 min-w-[200px]">
                <Label className="text-xs">Source Instance</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {uniqueSources.map(source => (
                      <SelectItem key={source} value={source}>
                        {source === 'manual_import' ? 'Manual Import' : new URL(source).hostname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Date From */}
              <div className="space-y-1">
                <Label className="text-xs">Imported From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <Label className="text-xs">Imported To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Visits
              <Badge variant="secondary" className="ml-1">{filteredVisits.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="gps" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              GPS History
              <Badge variant="secondary" className="ml-1">{filteredGPS.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos
              <Badge variant="secondary" className="ml-1">{filteredPhotos.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Visits Tab */}
          <TabsContent value="visits">
            <Card>
              <CardContent className="pt-6">
                {visitsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredVisits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No imported visits found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Arrived</TableHead>
                          <TableHead>Departed</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Imported</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVisits.slice(0, 100).map(visit => (
                          <TableRow key={visit.id}>
                            <TableCell className="font-mono text-xs">{visit.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              {visit.arrived_at ? format(parseISO(visit.arrived_at), 'PPp') : '-'}
                            </TableCell>
                            <TableCell>
                              {visit.departed_at ? format(parseISO(visit.departed_at), 'PPp') : '-'}
                            </TableCell>
                            <TableCell>
                              {visit.on_site_ms 
                                ? `${Math.round(visit.on_site_ms / 60000)} min` 
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={visit.finalized ? 'default' : 'secondary'}>
                                {visit.finalized ? 'Complete' : 'In Progress'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {visit.source_instance_url === 'manual_import' 
                                ? 'Manual' 
                                : new URL(visit.source_instance_url).hostname}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(parseISO(visit.imported_at), 'PP')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredVisits.length > 100 && (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        Showing 100 of {filteredVisits.length} records. Export to view all.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GPS Tab */}
          <TabsContent value="gps">
            <div className="space-y-4">
              {/* Map Toggle */}
              <div className="flex justify-end">
                <Button 
                  variant={showMap ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                >
                  <Map className="h-4 w-4 mr-2" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>

              {/* GPS Cluster Map */}
              {showMap && filteredGPS.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      GPS Points Map ({filteredGPS.length} points)
                    </CardTitle>
                    <CardDescription>
                      Click clusters to zoom in, click markers for details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GPSClusterMap gpsPoints={filteredGPS} height="400px" />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6">
                  {gpsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredGPS.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No imported GPS data found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recorded</TableHead>
                            <TableHead>Latitude</TableHead>
                            <TableHead>Longitude</TableHead>
                            <TableHead>Speed</TableHead>
                            <TableHead>Accuracy</TableHead>
                            <TableHead>On Site</TableHead>
                            <TableHead>Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredGPS.slice(0, 100).map(gps => (
                            <TableRow key={gps.id}>
                              <TableCell>
                                {format(parseISO(gps.recorded_at), 'PPp')}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{gps.latitude?.toFixed(6)}</TableCell>
                              <TableCell className="font-mono text-xs">{gps.longitude?.toFixed(6)}</TableCell>
                              <TableCell>{gps.speed ? `${gps.speed.toFixed(1)} m/s` : '-'}</TableCell>
                              <TableCell>{gps.accuracy ? `±${gps.accuracy.toFixed(0)}m` : '-'}</TableCell>
                              <TableCell>
                                <Badge variant={gps.is_on_site ? 'default' : 'outline'}>
                                  {gps.is_on_site ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {gps.source_instance_url === 'manual_import' 
                                  ? 'Manual' 
                                  : new URL(gps.source_instance_url).hostname}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {filteredGPS.length > 100 && (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          Showing 100 of {filteredGPS.length} records. Export to view all.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardContent className="pt-6">
                {photosLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPhotos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No imported photos found</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredPhotos.slice(0, 50).map(photo => (
                      <div key={photo.id} className="border rounded-lg overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={photo.caption || 'Imported photo'} 
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-2 space-y-1">
                          <p className="text-xs text-muted-foreground truncate">
                            {photo.caption || 'No caption'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {photo.taken_at ? format(parseISO(photo.taken_at), 'PP') : 'Unknown date'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {photo.source_instance_url === 'manual_import' 
                              ? 'Manual' 
                              : new URL(photo.source_instance_url).hostname}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {filteredPhotos.length > 50 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    Showing 50 of {filteredPhotos.length} photos. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
