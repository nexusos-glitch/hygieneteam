import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Copy, ShieldCheck, Zap, Check, Clock, Activity } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function UserApiSettings() {
  const [apiKey, setApiKey] = useState("cn_u_a7b8c9d...e1f2");
  const [credits, setCredits] = useState(850);
  const [usage, setUsage] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(10000);
  const [isCopied, setIsCopied] = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/user/api-stats");
        if (!res.ok) throw new Error("Failed to fetch API stats");
        const data = await res.json();
        
        setLastUsed(data.lastUsed || null);
        setChartData(data.chartData || []);
        if (data.usage !== undefined) setUsage(data.usage);
        if (data.credits !== undefined) setCredits(data.credits);
        if (data.quotaLimit !== undefined) setQuotaLimit(data.quotaLimit);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    toast.success("API Key copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const regenerateKey = () => {
    setApiKey("cn_u_" + Math.random().toString(36).substring(2, 15));
    setLastUsed(new Date().toISOString());
    toast.success("Your API key has been regenerated. Update your apps.");
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">API Settings</h1>
        <p className="text-muted-foreground">Manage your credentials to access UtubeChat capabilities via CommandNexus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              Your Private API Key
            </CardTitle>
            <CardDescription>Use this key to authenticate with our systems.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg flex items-center justify-between border dark:border-zinc-800 transition-colors">
                <code className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{apiKey}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyToClipboard} 
                  className={`hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-300 ${isCopied ? 'text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300' : 'text-zinc-600 dark:text-zinc-400'}`}
                >
                  {isCopied ? <Check className="w-4 h-4 scale-in-center animate-in zoom-in" /> : <Copy className="w-4 h-4 animate-in zoom-in" />}
                </Button>
              </div>
              {lastUsed && !isLoading && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 px-1 animate-in fade-in">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last used {formatDistanceToNow(new Date(lastUsed), { addSuffix: true })}</span>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Keep it secret</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400/80">Never expose this key in client-side code or public repositories. It controls your account usage.</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full text-zinc-600 dark:text-zinc-400" onClick={regenerateKey}>
              Regenerate API Key
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              Credit Balance
            </CardTitle>
            <CardDescription>Your available CommandNexus usage credits.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="w-full space-y-2">
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white">
                  {isLoading ? "..." : credits.toLocaleString()}
                </div>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Credits Remaining</p>
              </div>

              <div className="space-y-2 w-full pt-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium tracking-tight">Monthly Usage</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    {usage.toLocaleString()} / {quotaLimit.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-emerald-100/50 dark:bg-emerald-950/30 rounded-full overflow-hidden" aria-hidden="true">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                      usage / quotaLimit > 0.9 ? 'bg-red-500' :
                      usage / quotaLimit > 0.75 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${isLoading ? 0 : Math.min(100, Math.max(0, (usage / quotaLimit) * 100))}%` }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                  {isLoading ? "0" : Math.round((usage / quotaLimit) * 100)}% of quota used
                </p>
              </div>
            </div>
            
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
              Buy More Credits
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b dark:border-zinc-800">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            API Request Volume
          </CardTitle>
          <CardDescription>Your daily API usage over the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72 w-full">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-500 animate-pulse">Loading visualization...</p>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    minTickGap={20}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#6366f1', fontWeight: 500 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRequests)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-500">No usage data found for the past 30 days.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
