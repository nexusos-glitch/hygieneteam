import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Filter, DollarSign } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const PaymentHistory = () => {
  const { format: formatAmount } = useCurrency();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payment-history", startDate, endDate, paymentMethod],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          total_nzd,
          payment_date,
          payment_method,
          payment_reference,
          site_id,
          sites (
            name,
            clients (
              company_name
            )
          )
        `)
        .eq("status", "paid")
        .not("payment_date", "is", null)
        .order("payment_date", { ascending: false });

      if (startDate) {
        query = query.gte("payment_date", startDate);
      }
      if (endDate) {
        query = query.lte("payment_date", endDate + "T23:59:59");
      }
      if (paymentMethod && paymentMethod !== "all") {
        query = query.eq("payment_method", paymentMethod);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const totalPayments = payments?.reduce((sum, p) => sum + (p.total_nzd || 0), 0) || 0;

  const exportToCSV = () => {
    if (!payments?.length) return;

    const headers = ["Date", "Invoice #", "Client", "Site", "Amount", "Method", "Reference"];
    const rows = payments.map((p) => [
      p.payment_date ? format(new Date(p.payment_date), "yyyy-MM-dd") : "",
      p.invoice_number || "",
      p.sites?.clients?.company_name || "",
      p.sites?.name || "",
      p.total_nzd?.toString() || "0",
      p.payment_method || "",
      p.payment_reference || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const getMethodBadgeVariant = (method: string | null) => {
    switch (method) {
      case "card":
        return "default";
      case "bank_transfer":
        return "secondary";
      case "cash":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-muted-foreground">View all received payments</p>
          </div>
          <Button onClick={exportToCSV} disabled={!payments?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payments
              </CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-xl font-bold text-primary">{formatAmount(totalPayments)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
            ) : !payments?.length ? (
              <div className="text-center py-8 text-muted-foreground">No payments found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {payment.payment_date
                              ? format(new Date(payment.payment_date), "MMM d, yyyy")
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.invoice_number || "-"}
                        </TableCell>
                        <TableCell>{payment.sites?.clients?.company_name || "-"}</TableCell>
                        <TableCell>{payment.sites?.name || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(payment.total_nzd || 0)}
                        </TableCell>
                        <TableCell>
                          {payment.payment_method ? (
                            <Badge variant={getMethodBadgeVariant(payment.payment_method)}>
                              {payment.payment_method.replace("_", " ")}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {payment.payment_reference || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
