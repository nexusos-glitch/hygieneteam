import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Plus, Trash2, Key, Activity, Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// In a real app, these fetch to /api/keys
// Since we don't have a live DB yet, we mock for the preview
const MOCK_KEYS = [
  { id: "1", name: "UtubeChat Prod", api_key: "cn_v8x9a2j...k1j0", user_id: "user-1", status: "active", created_at: new Date().toISOString() },
  { id: "2", name: "UtubeChat Dev", api_key: "cn_k1l2m3n...o4p5", user_id: "user-1", status: "active", created_at: new Date().toISOString() },
];

const MOCK_LOGS = [
  { id: "101", user_id: "user-1", endpoint: "/api/proxy/execute (openai)", status_code: 200, created_at: new Date().toISOString() },
  { id: "102", user_id: "user-2", endpoint: "/api/proxy/execute (stripe)", status_code: 200, created_at: new Date().toISOString() },
];

export default function CommandNexusAdmin() {
  const [keys, setKeys] = useState(MOCK_KEYS);
  const [logs] = useState(MOCK_LOGS);
  const [newKeyName, setNewKeyName] = useState("");

  const handleCreateKey = () => {
    if (!newKeyName) {
      toast.error("Please provide a key name");
      return;
    }
    const newKey = {
      id: Math.random().toString(),
      name: newKeyName,
      api_key: "cn_" + Math.random().toString(36).substring(2, 15),
      user_id: "user-admin",
      status: "active",
      created_at: new Date().toISOString()
    };
    setKeys([newKey, ...keys]);
    setNewKeyName("");
    toast.success("CommandNexus API Key created successfully");
  };

  const handleRevokeKey = (id: string) => {
    setKeys(keys.map(k => k.id === id ? { ...k, status: "revoked" } : k));
    toast.info("API Key revoked");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-zinc-950 p-6 rounded-xl border border-zinc-800 shadow-xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-400" />
            CommandNexus API Layer
          </h1>
          <p className="text-zinc-400 text-lg">
            Centralized API infrastructure managing keys, credits, and external providers for all frontends (e.g., UtubeChat).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900 rounded-t-xl border-b dark:border-zinc-800 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              API Key Management
            </CardTitle>
            <CardDescription>Create and revoke keys to grant entry to the CommandNexus proxy.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-end gap-4 max-w-md">
              <div className="space-y-2 flex-1">
                <Label htmlFor="keyName">Key Name / App Association</Label>
                <Input
                  id="keyName"
                  placeholder="e.g. UtubeChat App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateKey} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Generate
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-100 dark:bg-zinc-900">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map(key => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                            {key.status === "active" ? key.api_key : "••••••••••••••••"}
                          </code>
                          {key.status === "active" && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(key.api_key)}>
                              <Copy className="w-3 h-3 text-zinc-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          key.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {key.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {key.status === 'active' && (
                          <Button variant="destructive" size="sm" onClick={() => handleRevokeKey(key.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {keys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-zinc-500">No API keys found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900 rounded-t-xl border-b dark:border-zinc-800 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Recent Usage Logs
            </CardTitle>
            <CardDescription>Live traffic through safely proxied CommandNexus requests.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="flex justify-between items-start border-b dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{log.endpoint}</p>
                    <p className="text-xs text-zinc-500 mt-1">User ID: {log.user_id}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
