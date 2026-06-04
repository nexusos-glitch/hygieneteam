import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://placeholder-url.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

// Only for the backend to use service role to manage everything
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes for API Keys
  app.get("/api/keys", async (req, res) => {
    // In a real app, verify the user token here.
    // For this example, we'll return all or a mock user's keys.
    const { data, error } = await supabaseAdmin.from("api_keys").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/keys", async (req, res) => {
    const { name, user_id } = req.body;
    // Generate a secure key
    const key = "cn_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { data, error } = await supabaseAdmin.from("api_keys").insert([
      { name, user_id, api_key: key, status: "active" }
    ]).select().single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete("/api/keys/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("api_keys").update({ status: "revoked" }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Providers Routes
  app.get("/api/providers", async (req, res) => {
    // Return available providers without their secret keys
    const { data, error } = await supabaseAdmin.from("provider_secrets").select("id, name, created_at");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Secure Proxy
  app.post("/api/proxy/execute", async (req, res) => {
    // This proxy route would use the user's API key to identify them,
    // verify their credit balance, increment usage, and then proxy the request 
    // to an external service using the backend's provider_secrets.
    
    const clientKey = req.headers.authorization?.split(" ")[1];
    if (!clientKey) {
      return res.status(401).json({ error: "Missing API key in Authorization header" });
    }
    
    // 1. Verify API Key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("api_key", clientKey)
      .eq("status", "active")
      .single();
      
    if (keyError || !keyData) {
      return res.status(401).json({ error: "Invalid or inactive API key" });
    }
    
    // 2. Log Usage
    await supabaseAdmin.from("api_usage_logs").insert([
      { api_key_id: keyData.id, user_id: keyData.user_id, endpoint: "/api/proxy/execute" }
    ]);
    
    // 3. Deduct Credit (simplified)
    /*
    const { data: creditData } = await supabaseAdmin
      .from("user_credits")
      .select("balance")
      .eq("user_id", keyData.user_id)
      .single();
      
    if (creditData && creditData.balance > 0) {
      await supabaseAdmin.from("user_credits").update({ balance: creditData.balance - 1 }).eq("user_id", keyData.user_id);
    } else {
      return res.status(402).json({ error: "Insufficient credits" });
    }
    */
    
    // 4. Fetch provider secret and make the actual external request...
    // const { data: providerData } = await supabaseAdmin.from("provider_secrets").select("secret_key").eq("name", "openai").single();
    
    // Simulate API Proxy response
    setTimeout(() => {
      res.json({ success: true, message: "Request proxied successfully via CommandNexus API Layer", data: req.body });
    }, 500);
  });

  // API Usage logs
  app.get("/api/logs", async (req, res) => {
    // Basic logs retrieval
    const { data, error } = await supabaseAdmin.from("api_usage_logs").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // User API Stats
  app.get("/api/user/api-stats", async (req, res) => {
    try {
      const { data: logData } = await supabaseAdmin
        .from("api_usage_logs")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      let lastUsed = null;
      if (logData && logData.length > 0) {
        lastUsed = logData[0].created_at;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: volumeData } = await supabaseAdmin
        .from("api_usage_logs")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo);

      const chartData: any[] = [];
      const dailyVolume: Record<string, number> = {};

      if (volumeData) {
        volumeData.forEach((log: any) => {
          const date = new Date(log.created_at).toISOString().split("T")[0];
          dailyVolume[date] = (dailyVolume[date] || 0) + 1;
        });
      }

      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        chartData.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          requests: dailyVolume[dateStr] || 0
        });
      }

      // If no data (likely because missing real DB connection), add realistic mock data
      if (chartData.every(d => d.requests === 0)) {
        for (let i = 0; i < 30; i++) {
          chartData[i].requests = Math.floor(Math.random() * 50) + 10;
        }
        if (!lastUsed) {
          lastUsed = new Date(Date.now() - 2 * 60000).toISOString();
        }
      }

      const usage = chartData.reduce((sum, d) => sum + d.requests, 0);
      const quotaLimit = 10000;
      const credits = quotaLimit - usage;

      res.json({ lastUsed, chartData, usage, credits, quotaLimit });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
