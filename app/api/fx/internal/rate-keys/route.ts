import { NextResponse } from "next/server";
import { generateRateReadApiKey } from "@/lib/fx-engine/utils/rate-read-keys";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("rate_read_api_keys")
    .select("id, name, key_prefix, status, notes, created_by_email, created_at, last_used_at, last_used_ip, revoked_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { name?: unknown; notes?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (name.length < 3 || name.length > 80) {
    return NextResponse.json({ error: "Key name must be 3 to 80 characters." }, { status: 400 });
  }

  const generated = generateRateReadApiKey();
  const { data, error } = await supabaseAdmin
    .from("rate_read_api_keys")
    .insert({
      name,
      notes: notes || null,
      key_prefix: generated.keyPrefix,
      key_hash: generated.keyHash,
      created_by: user.id,
      created_by_email: user.email ?? null,
    })
    .select("id, name, key_prefix, status, notes, created_by_email, created_at, last_used_at, last_used_ip, revoked_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key: data, secret: generated.key }, { status: 201 });
}
