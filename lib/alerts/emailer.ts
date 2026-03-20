import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendAlertEmail(
  to: string,
  message: string,
  jobId: number
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[alerts] RESEND_API_KEY not set, skipping email:", message);
    return;
  }

  const from = process.env.ALERT_FROM_EMAIL || "alerts@example.com";

  await resend.emails.send({
    from,
    to,
    subject: `RingDing Alert: Price alert triggered`,
    html: `
      <h2>Price Alert Triggered</h2>
      <p>${message}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/jobs/${jobId}">View job details</a></p>
    `,
  });
}
