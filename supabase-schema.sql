-- command_nexus_api_schema.sql

-- 1. Create API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_api_key ON public.api_keys(api_key);

-- 2. Create API Usage Logs Table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX idx_usage_logs_key_id ON public.api_usage_logs(api_key_id);

-- 3. Create Provider Secrets Table (Environment Variables Backup / System configs)
CREATE TABLE IF NOT EXISTS public.provider_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., 'openai', 'anthropic', 'stripe'
    secret_key TEXT NOT NULL, -- Consider encrypting this at rest in a real production system
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create User Credits Table
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID PRIMARY KEY, -- references auth.users
    balance INTEGER NOT NULL DEFAULT 1000,
    plan_type TEXT NOT NULL DEFAULT 'free',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Setup

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- API Keys: Users can only see and manage their own keys
CREATE POLICY "Users can view own api keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- Usage Logs: Users can only view their own logs
CREATE POLICY "Users can view own usage logs" ON public.api_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Provider Secrets: ONLY accessible by service role or admins
-- No public policies, so normal users cannot see these ever.
-- A service_role key ignores RLS, so the Node.js backend can access it.

-- User Credits: Users can view their own balance
CREATE POLICY "Users can view own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);
