import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getAppUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function isLikelyUnknownUserError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return normalized.includes("not found") || normalized.includes("user") && normalized.includes("exist");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const resetUrl = `${getAppUrl(request)}/reset-password`;
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: resetUrl },
  });

  if (error) {
    console.warn("Password reset link generation failed:", error.message);
    if (isLikelyUnknownUserError(error.message)) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Password reset is temporarily unavailable." }, { status: 500 });
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    return NextResponse.json({ error: "Password reset is temporarily unavailable." }, { status: 500 });
  }

  try {
    await sendPasswordResetEmail({ to: email, resetUrl: actionLink });
  } catch (mailError) {
    console.error("Password reset email send failed:", mailError instanceof Error ? mailError.message : mailError);
    return NextResponse.json({ error: "Password reset email could not be sent." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
