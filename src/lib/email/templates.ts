/**
 * Branded HTML email templates for the AETHER OS lead-action workflow.
 *
 * Each template returns `{ subject, html, text }` so we can hand it straight
 * to Resend (or any other transactional provider) without extra processing.
 */

export interface DemoSlot {
  iso: string;
  label: string;
}

export interface TemplatePayload {
  subject: string;
  html: string;
  text: string;
}

interface LeadForTemplate {
  firstName: string;
  lastName?: string | null;
  company?: string | null;
}

interface RepInfo {
  name?: string | null;
  email?: string | null;
}

const BRAND = "AETHER OS";
const BRAND_COLOR = "#6366F1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aether-os-navy.vercel.app";

function shell({
  title,
  preheader,
  body,
}: {
  title: string;
  preheader: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escape(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F5F6FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
    <span style="display:none;font-size:1px;color:#F5F6FB;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(preheader)}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5F6FB;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:20px;box-shadow:0 6px 24px rgba(15,23,42,0.06);overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%);">
                <table width="100%"><tr>
                  <td style="color:#ffffff;font-weight:700;font-size:16px;letter-spacing:0.5px;">${BRAND}</td>
                  <td align="right" style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">AI-Powered CRM</td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:11px;color:#64748B;text-align:center;">
                Sent by ${BRAND} \u00b7 <a href="${APP_URL}" style="color:${BRAND_COLOR};text-decoration:none;">${APP_URL.replace(/^https?:\/\//, "")}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function repSignatureBlock(rep: RepInfo | undefined): string {
  if (!rep?.name && !rep?.email) {
    return `<p style="margin:0;font-size:14px;color:#0F172A;font-weight:600;">The ${BRAND} team</p>`;
  }
  return `
    <p style="margin:0;font-size:14px;color:#0F172A;font-weight:600;">${escape(rep.name || `The ${BRAND} team`)}</p>
    ${rep.email ? `<p style="margin:2px 0 0;font-size:12px;color:#64748B;">${escape(rep.email)}</p>` : ""}
  `;
}

function repSignatureText(rep: RepInfo | undefined): string {
  if (!rep?.name && !rep?.email) return `The ${BRAND} team`;
  return `${rep.name || `The ${BRAND} team`}${rep.email ? `\n${rep.email}` : ""}`;
}

function slotCardsHtml(slots: DemoSlot[], mailtoReply: string, subjectPrefix: string): string {
  return slots
    .map((s) => {
      const replyLink = `mailto:${mailtoReply}?subject=${encodeURIComponent(
        `${subjectPrefix} \u2014 ${s.label}`
      )}&body=${encodeURIComponent(
        `Hi, I'd like to confirm ${s.label} for our session.`
      )}`;
      return `<tr><td style="padding:4px 0;">
        <a href="${replyLink}" style="display:block;padding:12px 14px;border-radius:12px;border:1px solid #E2E8F0;background:#F8FAFC;text-decoration:none;color:#0F172A;font-size:14px;font-weight:600;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${BRAND_COLOR};margin-right:10px;vertical-align:middle;"></span>
          ${escape(s.label)}
          <span style="float:right;color:${BRAND_COLOR};font-size:12px;font-weight:600;">Confirm \u2192</span>
        </a>
      </td></tr>`;
    })
    .join("");
}

export function demoInviteTemplate(
  lead: LeadForTemplate,
  slots: DemoSlot[],
  rep?: RepInfo
): TemplatePayload {
  const subject = `${BRAND} \u00b7 Let's schedule your product demo`;
  const greeting = `Hi ${escape(lead.firstName)},`;
  const company = lead.company ? ` at <strong>${escape(lead.company)}</strong>` : "";
  const mailtoReply = rep?.email || "team@aetheros.com";

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0F172A;">You're invited to a product demo</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
      Thanks for your interest in ${BRAND}${company}. We'd love to walk you through how our AI-powered CRM can accelerate your sales pipeline.
    </p>
    <div style="margin:0 0 20px;padding:14px 16px;border-radius:14px;background:linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 100%);border:1px solid #E0E7FF;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND_COLOR};">What you'll see</p>
      <p style="margin:0;font-size:14px;color:#0F172A;line-height:1.5;">A 30-minute walkthrough of lead scoring, deal Kanban, AI workflow automation, and the live analytics dashboard \u2014 tailored to your stack.</p>
    </div>
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0F172A;">Pick a time that works for you:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
      ${slotCardsHtml(slots, mailtoReply, "Demo confirmation")}
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#64748B;line-height:1.6;">
      Need a different time? Just reply to this email and we'll find a slot that works.
    </p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
    ${repSignatureBlock(rep)}
  `;

  const text = `${BRAND} \u00b7 Product demo invitation

Hi ${lead.firstName},

Thanks for your interest in ${BRAND}${lead.company ? ` at ${lead.company}` : ""}. We'd love to walk you through how our AI-powered CRM can accelerate your sales pipeline.

A 30-minute walkthrough of lead scoring, deal Kanban, AI workflow automation, and the live analytics dashboard \u2014 tailored to your stack.

Please pick a time that works for you:
${slots.map((s, i) => `${i + 1}. ${s.label}`).join("\n")}

Need a different time? Just reply to this email and we'll find a slot that works.

${repSignatureText(rep)}
${APP_URL}`;

  return { subject, html: shell({ title: subject, preheader: "Pick a 30-minute slot that works for you.", body: bodyHtml }), text };
}

export function callInviteTemplate(
  lead: LeadForTemplate,
  slots: DemoSlot[],
  rep?: RepInfo
): TemplatePayload {
  const subject = `${BRAND} \u00b7 Quick discovery call?`;
  const greeting = `Hi ${escape(lead.firstName)},`;
  const company = lead.company ? ` at <strong>${escape(lead.company)}</strong>` : "";
  const mailtoReply = rep?.email || "team@aetheros.com";

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0F172A;">Let's hop on a quick call</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
      I'd love to learn more about what you're building${company} and see if ${BRAND} is the right fit. The call is short \u2014 15 minutes, no slides, no pitch deck.
    </p>
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0F172A;">Pick a slot:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
      ${slotCardsHtml(slots, mailtoReply, "Call confirmation")}
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#64748B;line-height:1.6;">
      None of these work? Reply with a time that does and we'll make it happen.
    </p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
    ${repSignatureBlock(rep)}
  `;

  const text = `${BRAND} \u00b7 Discovery call

Hi ${lead.firstName},

I'd love to learn more about what you're building${lead.company ? ` at ${lead.company}` : ""} and see if ${BRAND} is the right fit. The call is short \u2014 15 minutes, no slides, no pitch deck.

Pick a slot:
${slots.map((s, i) => `${i + 1}. ${s.label}`).join("\n")}

None of these work? Reply with a time that does and we'll make it happen.

${repSignatureText(rep)}
${APP_URL}`;

  return { subject, html: shell({ title: subject, preheader: "15 minutes, no slides, no pitch.", body: bodyHtml }), text };
}

export function followUpTemplate(
  lead: LeadForTemplate,
  context: { aiAnalysis?: string | null; aiClassification?: string | null },
  rep?: RepInfo
): TemplatePayload {
  const subject = `${BRAND} \u00b7 Following up on your interest`;
  const greeting = `Hi ${escape(lead.firstName)},`;
  const company = lead.company ? ` at <strong>${escape(lead.company)}</strong>` : "";
  const personalNote = context.aiAnalysis
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;font-style:italic;">${escape(
        context.aiAnalysis
      )}</p>`
    : "";

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0F172A;">Wanted to follow up</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
      Hope you're well. I wanted to circle back on your interest in ${BRAND}${company} \u2014 our AI noticed strong engagement signals from your team and I think there's a great fit here.
    </p>
    ${personalNote}
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
      Happy to set up a quick chat or send over a tailored overview. Whatever's easier for you.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${APP_URL}" style="display:inline-block;padding:12px 22px;background:${BRAND_COLOR};color:#ffffff;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">
        See what ${BRAND} can do \u2192
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
    ${repSignatureBlock(rep)}
  `;

  const text = `${BRAND} \u00b7 Following up

Hi ${lead.firstName},

Hope you're well. I wanted to circle back on your interest in ${BRAND}${lead.company ? ` at ${lead.company}` : ""} \u2014 our AI noticed strong engagement signals from your team and I think there's a great fit here.${
    context.aiAnalysis ? `\n\n${context.aiAnalysis}` : ""
  }

Happy to set up a quick chat or send over a tailored overview. Whatever's easier for you.

See what ${BRAND} can do: ${APP_URL}

${repSignatureText(rep)}`;

  return { subject, html: shell({ title: subject, preheader: "Circling back on your interest.", body: bodyHtml }), text };
}
