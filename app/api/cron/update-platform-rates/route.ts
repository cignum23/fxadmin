import { NextResponse } from "next/server";
import { fetchAllPlatformRates } from "@/lib/api/fetchPlatformRates";
import { supabase } from "@/lib/supabaseClient";

/**
 * Cron job to update platform rates every 5 minutes
 * Fetches live USD/NGN rates from each platform and stores in database
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting platform rates update...");

    // Fetch the shared FX rate (USD → NGN) from vendors API once
    let sharedFxRate = 0;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const vendorsRes = await fetch(`${baseUrl}/api/fx/vendors`, {
        cache: "no-store",
      });

      if (vendorsRes.ok) {
        const vendors = (await vendorsRes.json()) as Array<{
          name: string;
          rate: number;
        }>;

        if (vendors && vendors.length > 0) {
          // Get median rate for stability
          const rates = vendors
            .map((v) => v.rate)
            .filter((r): r is number => typeof r === "number" && r > 0)
            .sort((a, b) => a - b);

          if (rates.length > 0) {
            const mid = Math.floor(rates.length / 2);
            sharedFxRate =
              rates.length % 2 === 1
                ? rates[mid]
                : (rates[mid - 1] + rates[mid]) / 2;
            sharedFxRate = Math.round(sharedFxRate * 100) / 100;
            console.log(`[CRON] Fetched shared FX rate: ₦${sharedFxRate}`);
          }
        }
      }
    } catch (fxError) {
      console.warn("[CRON] Failed to fetch shared FX rate:", fxError);
    }

    if (sharedFxRate <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch FX rate from vendors API",
        },
        { status: 500 }
      );
    }

    // Fetch rates from all platforms using the shared FX rate
    const rates = await fetchAllPlatformRates(sharedFxRate);

    if (rates.length === 0) {
      console.warn("[CRON] No rates fetched from any platform");
      return NextResponse.json(
        {
          success: false,
          message: "No rates fetched from any platform",
        },
        { status: 500 }
      );
    }

    // Filter successful rates
    const successfulRates = rates.filter((r) => r.success && r.usd_ngn_rate > 0);

    console.log(
      `[CRON] Fetched ${successfulRates.length} successful rates from ${rates.length} platforms`
    );

    // Store/update rates in database
    for (const rate of successfulRates) {
      const { error } = await supabase
        .from("platform_rates")
        .upsert(
          {
            platform_id: rate.platform_id,
            platform_name: rate.platform_name,
            rate_usd: rate.usd_ngn_rate,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "platform_id",
          }
        );

      if (error) {
        console.error(
          `[CRON] Failed to store rate for ${rate.platform_id}:`,
          error
        );
      } else {
        console.log(
          `[CRON] Stored rate for ${rate.platform_id}: ₦${rate.usd_ngn_rate}`
        );
      }
    }

    // Log failed rates
    const failedRates = rates.filter((r) => !r.success);
    if (failedRates.length > 0) {
      console.warn(
        `[CRON] ${failedRates.length} platforms failed:`,
        failedRates.map((r) => `${r.platform_name}: ${r.error}`).join("; ")
      );
    }

    return NextResponse.json({
      success: true,
      fetched: rates.length,
      stored: successfulRates.length,
      failed: failedRates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Platform rates update failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}