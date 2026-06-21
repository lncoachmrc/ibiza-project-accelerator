import type { LeadFormData } from "@/components/LeadQualificationForm";

export type CrmLeadPayload = LeadFormData & {
  source: string;
  landing_page?: string;
  referrer?: string;
  timestamp?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ts?: string;
};

const STORAGE_KEY = "eivitech_leads";

export function saveLeadPreview(payload: CrmLeadPayload) {
  const lead = { ...payload, ts: new Date().toISOString() };

  try {
    const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    const leads = Array.isArray(existing) ? existing : [];
    leads.push(lead);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    // Preview storage is non-critical. Production CRM must use a secure backend.
  }

  return lead;
}

export async function submitLeadToCrm(payload: CrmLeadPayload) {
  // GitHub Pages is static hosting. Do not place CRM secrets, SMTP keys or private webhooks here.
  // Production path: call a serverless function or secured backend that validates Clerk auth/server credentials.
  return saveLeadPreview(payload);
}
