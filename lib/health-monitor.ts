import * as Sentry from "@sentry/nextjs";

export async function checkHealthAndAlert() {
  try {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/health`);
    const health = await response.json();

    if (health.overall !== "healthy") {
      Sentry.captureMessage("Health check failed", {
        level: "error",
        extra: health,
      });

      // Optionnel: envoie une email via Resend
      // const { resend } = await import("@/lib/resend");
      // await resend.emails.send({
      //   from: "alerts@calendapro.fr",
      //   to: process.env.ALERT_EMAIL!,
      //   subject: "⚠️ CalendaPro Health Check Failed",
      //   html: `<p>Supabase: ${health.supabase.status}</p><p>Stripe: ${health.stripe.status}</p>`,
      // });
    }

    return health;
  } catch (error) {
    Sentry.captureException(error, { tags: { source: "health_monitor" } });
    throw error;
  }
}
