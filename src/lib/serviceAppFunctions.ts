export interface Staff {
  id: string;
  user_id?: string;
  email: string;
  role: string;
  full_name?: string;
  phone?: string;
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  client_id?: string;
}

export interface Visit {
  id: string;
  site_id: string;
  staff_id?: string;
  start_time?: string;
  end_time?: string;
  status: string;
}

export async function getVisits() { return []; }
export async function getSites() { return []; }
export async function createVisit(data: any) { return {}; }
export async function updateVisit(id: string, data: any) { return {}; }
export async function generateInvoice(data: any) { return {}; }
export async function downloadInvoicePDF(id: string) { return ''; }
