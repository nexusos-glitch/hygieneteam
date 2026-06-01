import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Lock, Loader2 } from "lucide-react";
import { useRole } from "@/hooks/useRole";

interface AlertHistory {
  id: string;
  alert_type: string;
  period: string;
  current_revenue: number;
  previous_revenue: number;
  percentage_change: number;
  threshold: number;
  recipient_email: string;
  created_at: string;
}

const AlertHistory = () => {
  const [alerts, setAlerts] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useRole();

  useEffect(() => {
    const fetchAlertHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('revenue_alert_history' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAlerts((data as unknown as AlertHistory[]) || []);
      } catch (error) {
        console.error('Error fetching alert history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertHistory();
  }, []);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
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
                Revenue alert history is only available to administrators.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Alert History</h1>
        <p className="text-muted-foreground mt-2">
          View all past revenue alerts sent by the automated monitoring system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Log</CardTitle>
          <CardDescription>
            Complete history of revenue alerts triggered by threshold breaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading alert history...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alerts have been sent yet. Alerts will appear here when revenue thresholds are crossed.
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Current Revenue</TableHead>
                    <TableHead className="text-right">Previous Revenue</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead>Recipient</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {format(new Date(alert.created_at), 'PPp')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={alert.alert_type === 'drop' ? 'destructive' : 'default'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {alert.alert_type === 'drop' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUp className="h-3 w-3" />
                          )}
                          {alert.alert_type === 'drop' ? 'Drop' : 'Increase'}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{alert.period}</TableCell>
                      <TableCell className="text-right font-medium">
                        NZD ${alert.current_revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        NZD ${alert.previous_revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={alert.percentage_change < 0 ? 'text-destructive' : 'text-green-600'}>
                          {alert.percentage_change > 0 ? '+' : ''}
                          {alert.percentage_change.toFixed(1)}%
                        </span>
                        <div className="text-xs text-muted-foreground">
                          Threshold: {alert.threshold}%
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {alert.recipient_email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertHistory;
