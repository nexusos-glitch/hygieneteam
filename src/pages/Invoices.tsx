import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar as CalendarIcon, Plus, Lock, Loader2, Upload, FileSpreadsheet, Send, CheckCircle, History } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { whiteLabelConfig } from "@/config/whitelabel";
import { useRole } from "@/hooks/useRole";
import { useCurrency, formatCurrency as formatCurrencyUtil, SUPPORTED_CURRENCIES } from "@/hooks/useCurrency";
import { useExchangeRates, convertCurrency } from "@/hooks/useExchangeRates";
import { CurrencyConverter } from "@/components/invoices/CurrencyConverter";
import { ExchangeRateChart } from "@/components/invoices/ExchangeRateChart";
import { CurrencyRateAlerts } from "@/components/invoices/CurrencyRateAlerts";
import { PaymentTrackingDialog } from "@/components/invoices/PaymentTrackingDialog";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { InvoiceReminderSettings } from "@/components/invoices/InvoiceReminderSettings";

interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  status: string;
  subtotal_nzd: number;
  tax_nzd: number;
  total_nzd: number;
  payment_due_date: string | null;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  period_start_iso: string;
  period_end_iso: string;
  sites: {
    id: string;
    name: string;
    client_id: string | null;
    clients?: {
      contact_email: string | null;
      contact_name: string;
      company_name: string;
    } | null;
  };
}

interface Site {
  id: string;
  name: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useRole();
  const { currencyCode, format: formatCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<string>("");
  const { data: exchangeData } = useExchangeRates(currencyCode);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  const getConvertedAmount = (amount: number): number => {
    if (!exchangeData?.rates || !displayCurrency || displayCurrency === currencyCode) {
      return amount;
    }
    return convertCurrency(amount, currencyCode, displayCurrency, exchangeData.rates, currencyCode);
  };

  const formatConverted = (amount: number): string => {
    if (!displayCurrency || displayCurrency === currencyCode) return "";
    return formatCurrencyUtil(getConvertedAmount(amount), displayCurrency);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch invoices with site and client info
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          sites (
            id,
            name,
            client_id,
            clients (
              contact_email,
              contact_name,
              company_name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (invoicesError) throw invoicesError;
      
      const { getSites } = await import("@/lib/serviceAppFunctions");
      const sitesData = await getSites();
      
      setInvoices(invoicesData || []);
      setSites(sitesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: string, paymentDetails?: {
    payment_date: string;
    payment_method: string;
    payment_reference: string;
  }) => {
    setUpdatingStatus(invoice.id);
    
    try {
      // Update status in database with optional payment details
      const updateData: Record<string, unknown> = { status: newStatus };
      if (paymentDetails && newStatus === 'paid') {
        updateData.payment_date = paymentDetails.payment_date;
        updateData.payment_method = paymentDetails.payment_method;
        updateData.payment_reference = paymentDetails.payment_reference;
      }
      
      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoice.id);
      
      if (updateError) throw updateError;

      // Get client info for email notification
      const clientEmail = invoice.sites?.clients?.contact_email;
      const clientName = invoice.sites?.clients?.contact_name || invoice.sites?.clients?.company_name || 'Valued Customer';
      
      // Send email notification
      if (clientEmail && (newStatus === 'sent' || newStatus === 'paid')) {
        try {
          await supabase.functions.invoke('notify-invoice-status', {
            body: {
              invoiceId: invoice.id,
              newStatus,
              invoiceNumber: invoice.invoice_number,
              totalNzd: invoice.total_nzd,
              clientEmail,
              clientName,
              siteName: invoice.sites.name,
              periodStart: format(new Date(invoice.period_start_iso), 'PP'),
              periodEnd: format(new Date(invoice.period_end_iso), 'PP'),
              dueDate: invoice.payment_due_date ? format(new Date(invoice.payment_due_date), 'PP') : undefined
            }
          });
          
          toast({
            title: `Invoice ${newStatus === 'sent' ? 'Sent' : 'Marked as Paid'}`,
            description: `Email notification sent to ${clientEmail}`,
          });
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
          toast({
            title: `Invoice ${newStatus === 'sent' ? 'Sent' : 'Marked as Paid'}`,
            description: `Status updated but email notification failed`,
          });
        }
      } else {
        toast({
          title: "Status Updated",
          description: `Invoice marked as ${newStatus}`,
        });
      }

      // Refresh data
      await loadData();
      
    } catch (error: unknown) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update invoice status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = async (paymentDetails: {
    payment_date: string;
    payment_method: string;
    payment_reference: string;
  }) => {
    if (!selectedInvoiceForPayment) return;
    await handleStatusChange(selectedInvoiceForPayment, 'paid', paymentDetails);
    setPaymentDialogOpen(false);
    setSelectedInvoiceForPayment(null);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedSite || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select a site and date range",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { generateInvoice } = await import("@/lib/serviceAppFunctions");
      const result = await generateInvoice(
        selectedSite,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      toast({
        title: "Invoice Generated",
        description: `Invoice ${result.invoice.invoice_number} created successfully`,
      });
      
      await loadData();
      setSelectedSite("");
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const { downloadInvoicePDF } = await import("@/lib/serviceAppFunctions");
      const pdfBase64 = await downloadInvoicePDF(invoiceId, {
        companyName: whiteLabelConfig.companyName,
        companyTagline: whiteLabelConfig.companyTagline,
        contactEmail: whiteLabelConfig.contactEmail,
        contactPhone: whiteLabelConfig.contactPhone
      });
      
      // Convert base64 to blob and trigger download
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `Downloading ${invoiceNumber}.pdf`,
      });
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice PDF",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500";
      case "sent":
        return "bg-blue-500";
      case "paid":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (invoices.length === 0) {
      toast({ title: 'No invoices to export', variant: 'destructive' });
      return;
    }
    
    const exportData = invoices.map(inv => ({
      invoice_number: inv.invoice_number,
      site_name: inv.sites.name,
      period_start: inv.period_start_iso,
      period_end: inv.period_end_iso,
      [`subtotal_${currencyCode.toLowerCase()}`]: inv.subtotal_nzd,
      [`tax_${currencyCode.toLowerCase()}`]: inv.tax_nzd,
      [`total_${currencyCode.toLowerCase()}`]: inv.total_nzd,
      status: inv.status,
      payment_due_date: inv.payment_due_date || '',
      created_at: inv.created_at
    }));
    
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast({ title: 'Export complete', description: `${invoices.length} invoices exported to CSV` });
  };

  // Export to Excel
  const exportToXLS = () => {
    if (invoices.length === 0) {
      toast({ title: 'No invoices to export', variant: 'destructive' });
      return;
    }
    
    const exportData = invoices.map(inv => ({
      'Invoice Number': inv.invoice_number,
      'Site': inv.sites.name,
      'Period Start': format(new Date(inv.period_start_iso), 'PP'),
      'Period End': format(new Date(inv.period_end_iso), 'PP'),
      [`Subtotal (${currencyCode})`]: inv.subtotal_nzd,
      [`Tax (${currencyCode})`]: inv.tax_nzd,
      [`Total (${currencyCode})`]: inv.total_nzd,
      'Status': inv.status,
      'Due Date': inv.payment_due_date ? format(new Date(inv.payment_due_date), 'PP') : '',
      'Created': format(new Date(inv.created_at), 'PP')
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, `invoices_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({ title: 'Export complete', description: `${invoices.length} invoices exported to Excel` });
  };

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = e.target?.result;
        let jsonData: any[] = [];

        if (file.name.endsWith('.csv')) {
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
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }

        if (jsonData.length === 0) {
          toast({ title: 'No data found in file', variant: 'destructive' });
          return;
        }

        toast({ 
          title: 'Import preview', 
          description: `Found ${jsonData.length} records. Invoice import requires manual review - please use Generate Invoice for new invoices.` 
        });
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

    event.target.value = '';
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Admin Access Required</h2>
              <p className="text-muted-foreground mt-2">
                Invoice management is only available to administrators.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-walkthrough="invoices-page">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Generate and manage invoices</p>
        </div>
        
        {/* Currency display selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show in:</span>
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Base ({currencyCode})</SelectItem>
              {SUPPORTED_CURRENCIES.filter(c => c.code !== currencyCode).map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Payment History Link */}
          <Button variant="outline" asChild>
            <Link to="/payment-history">
              <History className="h-4 w-4 mr-2" />
              Payment History
            </Link>
          </Button>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls" 
            className="hidden" 
            onChange={handleFileImport}
          />
          
          {/* Import Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = '.csv';
                  fileInputRef.current.click();
                }
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = '.xlsx,.xls';
                  fileInputRef.current.click();
                }
              }}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import Excel
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
              <DropdownMenuItem onClick={exportToCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToXLS}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Generate Invoice Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Invoice
          </CardTitle>
          <CardDescription>
            Select a site and date range to generate an invoice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Site</label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            onClick={handleGenerateInvoice} 
            disabled={generating || !selectedSite || !startDate || !endDate}
            className="w-full md:w-auto"
          >
            {generating ? "Generating..." : "Generate Invoice"}
          </Button>
        </CardContent>
      </Card>

      {/* Currency Tools */}
      {invoices.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CurrencyConverter
              baseCurrency={currencyCode}
              amounts={{
                subtotal: invoices.reduce((sum, inv) => sum + Number(inv.subtotal_nzd), 0),
                tax: invoices.reduce((sum, inv) => sum + Number(inv.tax_nzd), 0),
                total: invoices.reduce((sum, inv) => sum + Number(inv.total_nzd), 0),
              }}
            />
            <CurrencyRateAlerts baseCurrency={currencyCode} />
          </div>
          <ExchangeRateChart baseCurrency={currencyCode} />
        </div>
      )}

      {/* Invoice Reminder Settings */}
      <InvoiceReminderSettings />

      {/* Invoices List */}
      <div className="grid gap-4" data-walkthrough="invoice-list">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices yet</p>
              <p className="text-sm text-muted-foreground">
                Generate your first invoice using the form above
              </p>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">
                      {invoice.invoice_number}
                    </h3>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Site: {invoice.sites.name}</p>
                    <p>
                      Period: {format(new Date(invoice.period_start_iso), "PP")} -{" "}
                      {format(new Date(invoice.period_end_iso), "PP")}
                    </p>
                    <p>Created: {format(new Date(invoice.created_at), "PP")}</p>
                    {invoice.payment_due_date && (
                      <p>
                        Due: {format(new Date(invoice.payment_due_date), "PP")}
                      </p>
                    )}
                    {invoice.status === 'paid' && invoice.payment_date && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-green-600 font-medium">
                          Paid: {format(new Date(invoice.payment_date), "PP")}
                        </p>
                        {invoice.payment_method && (
                          <p>Method: {invoice.payment_method.replace('_', ' ')}</p>
                        )}
                        {invoice.payment_reference && (
                          <p>Ref: {invoice.payment_reference}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatCurrency(invoice.total_nzd)}
                    </p>
                    {displayCurrency && displayCurrency !== currencyCode && (
                      <p className="text-sm text-primary font-medium">
                        ≈ {formatConverted(invoice.total_nzd)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      (incl. Tax: {formatCurrency(invoice.tax_nzd)}
                      {displayCurrency && displayCurrency !== currencyCode && (
                        <span className="text-primary"> ≈ {formatConverted(invoice.tax_nzd)}</span>
                      )}
                      )
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Status change buttons */}
                    {invoice.status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusChange(invoice, 'sent')}
                        disabled={updatingStatus === invoice.id}
                      >
                        {updatingStatus === invoice.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Invoice
                      </Button>
                    )}
                    
                    {invoice.status === 'sent' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleMarkAsPaid(invoice)}
                        disabled={updatingStatus === invoice.id}
                      >
                        {updatingStatus === invoice.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark as Paid
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownloadPDF(invoice.id, invoice.invoice_number)
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payment Tracking Dialog */}
      <PaymentTrackingDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceNumber={selectedInvoiceForPayment?.invoice_number || ""}
        onConfirm={handlePaymentConfirm}
        isLoading={!!updatingStatus}
      />
    </div>
  );
}
