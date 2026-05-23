import { Resend } from "resend";
import {
  callInviteTemplate,
  demoInviteTemplate,
  followUpTemplate,
  type DemoSlot,
  type TemplatePayload,
} from "@/lib/email/templates";

/**
 * Email orchestrator for the lead-action workflow.
 *
 * Resend is the configured provider. Set `RESEND_API_KEY` and `EMAIL_FROM` in
 * the environment to send real mail; without them the helper logs a preview
 * of the payload to the server console and returns `{ sent: false, preview: true }`
 * so the action flow stays usable in local development.
 */

export type LeadEmailKind = "EMAIL" | "CALL" | "DEMO";

interface LeadForSend {
  firstName: string;
  lastName?: string | null;
  email: string;
  company?: string | null;
  aiAnalysis?: string | null;
  aiClassification?: string | null;
}

interface RepInfo {
  name?: string | null;
  email?: string | null;
}

export interface EmailResult {
  sent: boolean;
  preview: boolean;
  id?: string;
  to?: string;
  subject?: string;
  reason?: string;
}

const FROM_FALLBACK = "AETHER OS <onboarding@resend.dev>";

let cachedClient: Resend | null = null;
function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

function fmt(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

/**
 * Generate three proposed slots across the next 3 business days at varied hours.
 * Skips Saturdays and Sundays (IST).
 */
export function generateProposedSlots(now: Date = new Date()): DemoSlot[] {
  const hours = [10, 14, 16];
  const slots: DemoSlot[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  let i = 0;
  while (slots.length < 3 && i < 14) {
    cursor.setDate(cursor.getDate() + 1);
    i++;
    const day = cursor.getDay();
    if (day === 0 || day === 6) continue;
    const slot = new Date(cursor);
    slot.setHours(hours[slots.length] ?? 10, 0, 0, 0);
    slots.push({ iso: slot.toISOString(), label: `${fmt(slot)} IST` });
  }
  return slots;
}

function pickTemplate(
  kind: LeadEmailKind,
  lead: LeadForSend,
  slots: DemoSlot[],
  rep?: RepInfo
): TemplatePayload {
  switch (kind) {
    case "DEMO":
      return demoInviteTemplate(lead, slots, rep);
    case "CALL":
      return callInviteTemplate(lead, slots.slice(0, 3), rep);
    case "EMAIL":
    default:
      return followUpTemplate(
        lead,
        { aiAnalysis: lead.aiAnalysis, aiClassification: lead.aiClassification },
        rep
      );
  }
}

export async function sendLeadActionEmail(params: {
  kind: LeadEmailKind;
  lead: LeadForSend;
  rep?: RepInfo;
}): Promise<EmailResult> {
  const { kind, lead, rep } = params;
  if (!lead.email) {
    return { sent: false, preview: false, reason: "Lead has no email address" };
  }

  const slots = generateProposedSlots();
  const { subject, html, text } = pickTemplate(kind, lead, slots, rep);
  const to = lead.email;
  const from = process.env.EMAIL_FROM || FROM_FALLBACK;
  const replyTo = rep?.email || process.env.EMAIL_REPLY_TO || undefined;

  const client = getClient();
  if (!client) {
    console.log(
      `[email:preview] ${kind} \u2192 ${to} (no RESEND_API_KEY set)\n  subject: ${subject}\n  from: ${from}\n  text-preview: ${text.slice(
        0,
        160
      )}...`
    );
    return { sent: false, preview: true, to, subject, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.warn(`[email:error] ${kind} \u2192 ${to}:`, error.message || error);
      return { sent: false, preview: false, to, subject, reason: error.message || "Resend error" };
    }
    return { sent: true, preview: false, id: data?.id, to, subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email send error";
    console.warn(`[email:exception] ${kind} \u2192 ${to}:`, message);
    return { sent: false, preview: false, to, subject, reason: message };
  }
}
