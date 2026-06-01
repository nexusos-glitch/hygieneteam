-- Supabase Schema for White-Label Field Service App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients Table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active'
);

-- 2. Services Table (Service Catalog)
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2),
    estimated_duration INTEGER, -- in minutes
    is_active BOOLEAN DEFAULT true
);

-- 3. Team Members Table (Technicians)
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Typically linked to auth.users if using Supabase Auth
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'technician', -- technician, admin, manager
    status TEXT DEFAULT 'active'
);

-- 4. Jobs Table (Service Jobs)
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    total_amount DECIMAL(10, 2),
    notes TEXT,
    sync_status TEXT DEFAULT 'synced'
);

-- 5. Appointments Table (Scheduled Appointments)
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled', -- scheduled, en_route, on_site, completed
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'synced'
);

-- Note: Row Level Security (RLS) policies to ensure secure data access

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- Team Members table policies
-- --------------------------------------------------------
-- Team members can view their own profile
CREATE POLICY "Team members can view their own profile" ON public.team_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can update their own profile" ON public.team_members
    FOR UPDATE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- Clients table policies
-- --------------------------------------------------------
-- Clients can view their own data
CREATE POLICY "Clients can view their own profile" ON public.clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own profile" ON public.clients
    FOR UPDATE USING (auth.uid() = user_id);

-- Team members can view clients they are servicing or all clients (depending on strictness)
CREATE POLICY "Team members can view clients" ON public.clients
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid()));

-- --------------------------------------------------------
-- Jobs table policies
-- --------------------------------------------------------
-- Clients can view their own jobs
CREATE POLICY "Clients can view their own jobs" ON public.jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE id = client_id AND user_id = auth.uid()
        )
    );

-- Team members (contractors) can view jobs assigned to them
CREATE POLICY "Team members can view assigned jobs" ON public.jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.appointments a 
            JOIN public.team_members tm ON a.team_member_id = tm.id 
            WHERE a.job_id = public.jobs.id AND tm.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------
-- Appointments table policies
-- --------------------------------------------------------
-- Clients can view appointments for their jobs
CREATE POLICY "Clients can view appointments for their jobs" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs j 
            JOIN public.clients c ON j.client_id = c.id 
            WHERE public.appointments.job_id = j.id AND c.user_id = auth.uid()
        )
    );

-- Team members (contractors) can view their assigned appointments
CREATE POLICY "Team members can view their assigned appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.id = team_member_id AND tm.user_id = auth.uid()
        )
    );
    
-- Allow admins (identified by role in team_members) to perform all actions
CREATE POLICY "Admins can do everything on clients" ON public.clients FOR ALL
    USING (EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on jobs" ON public.jobs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on appointments" ON public.appointments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on team_members" ON public.team_members FOR ALL
    USING (EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND role = 'admin'));
