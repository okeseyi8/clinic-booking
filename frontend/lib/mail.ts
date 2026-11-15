import "server-only";

/**
 * Transactional email through Brevo's free tier (300 emails/day, no own domain needed:
 * the sender only has to be a verified address in the Brevo account).
 * Plain fetch, no SDK. Without BREVO_API_KEY (local dev) the email is printed to the console instead.
 */
export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const { BREVO_API_KEY, MAIL_FROM } = process.env;
  if (!BREVO_API_KEY || !MAIL_FROM) {
    if (process.env.NODE_ENV === "production") throw new Error("BREVO_API_KEY and MAIL_FROM must be set to send email");
    console.info(`[mail:dev] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "HowBody", email: MAIL_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Brevo send failed (${res.status}): ${await res.text()}`);
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Simple branded, table-free email that renders in every client. */
export function resetPasswordEmail(name: string, url: string) {
  const text = `Hi ${name},\n\nUse this link to choose a new HowBody password. It expires in 1 hour:\n${url}\n\nIf you didn't ask for this, you can ignore this email.`;
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#17292c">
  <p style="font-size:22px;font-weight:bold;color:#0f4b4f;margin:0 0 24px">HowBody</p>
  <p style="font-size:16px;line-height:1.6">Hi ${escape(name)},</p>
  <p style="font-size:16px;line-height:1.6">Use the button below to choose a new password. The link expires in 1 hour.</p>
  <p style="margin:28px 0"><a href="${escape(url)}" style="background:#0f4b4f;color:#f5fbfa;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:16px">Choose a new password</a></p>
  <p style="font-size:14px;line-height:1.6;color:#4f5f62">If you didn't ask for this, you can ignore this email. Your password won't change.</p>
</div>`;
  return { subject: "Reset your HowBody password", html, text };
}
