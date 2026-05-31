import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabase: { status: "unknown" as string, latency_ms: 0, error: null as string | null },
    stripe: { status: "unknown" as string, latency_ms: 0, error: null as string | null },
    overall: "unknown" as string,
  };

  // Check Supabase
  const supabaseStart = Date.now();
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) throw error;

    checks.supabase.status = "ok";
    checks.supabase.latency_ms = Date.now() - supabaseStart;
  } catch (err) {
    checks.supabase.status = "error";
    checks.supabase.error = err instanceof Error
      ? err.message
      : JSON.stringify(err);
    checks.supabase.latency_ms = Date.now() - supabaseStart;
  }

  // Check Stripe
  const stripeStart = Date.now();
  try {
    // Appel simple et rapide pour vérifier l'API Stripe
    await stripe.customers.list({ limit: 1 });

    checks.stripe.status = "ok";
    checks.stripe.latency_ms = Date.now() - stripeStart;
  } catch (err) {
    checks.stripe.status = "error";
    checks.stripe.error = err instanceof Error ? err.message : String(err);
    checks.stripe.latency_ms = Date.now() - stripeStart;
  }

  // Determine overall status
  checks.overall =
    checks.supabase.status === "ok" && checks.stripe.status === "ok"
      ? "healthy"
      : "degraded";

  // Return appropriate status code
  const statusCode = checks.overall === "healthy" ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
