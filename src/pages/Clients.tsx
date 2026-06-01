import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientCard } from "./ClientPortal";
import { ClientRegistrationDialog } from "@/components/Clients/ClientRegistrationDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Printer } from "lucide-react";

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClients = async () => {
    setLoading(true);
    let query: any = supabase.from("clients" as any).select("*");
    
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    
    query = query.order("created_at", { ascending: false });
    const { data, error } = await query;
    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [statusFilter]);

  const filteredClients = clients.filter(client => 
    client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Company Name', 'Contact Name', 'Email', 'Phone', 'Address', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(client => [
        `"${(client.company_name || '').replace(/"/g, '""')}"`,
        `"${(client.contact_name || '').replace(/"/g, '""')}"`,
        `"${(client.contact_email || client.email || '').replace(/"/g, '""')}"`,
        `"${(client.contact_phone || client.phone || '').replace(/"/g, '""')}"`,
        `"${(client.address || '').replace(/"/g, '""')}"`,
        `"${(client.status || 'active').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'clients_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Manage your client directory</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handlePrint} size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={exportToCSV} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <ClientRegistrationDialog onSuccess={fetchClients} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg mt-2" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                id={client.id}
                company_name={client.company_name}
                contact_name={client.contact_name || ''}
                contact_email={client.contact_email || client.email}
                contact_phone={client.contact_phone || client.phone}
                address={client.address}
                profile_photo_url={client.profile_photo_url}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">No clients found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Print View */}
      <div className="hidden print:block">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Client Directory</h2>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString()} - {filteredClients.length} clients
          </p>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left flex-1 py-3 px-2 font-semibold">Company Name</th>
              <th className="text-left flex-1 py-3 px-2 font-semibold">Contact Name</th>
              <th className="text-left flex-1 py-3 px-2 font-semibold">Email</th>
              <th className="text-left flex-1 py-3 px-2 font-semibold">Phone</th>
              <th className="text-left flex-1 py-3 px-2 font-semibold w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id} className="border-b border-gray-200">
                <td className="py-3 px-2">{client.company_name}</td>
                <td className="py-3 px-2">{client.contact_name || '-'}</td>
                <td className="py-3 px-2">{client.contact_email || client.email || '-'}</td>
                <td className="py-3 px-2">{client.contact_phone || client.phone || '-'}</td>
                <td className="py-3 px-2 capitalize">{client.status || 'active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}