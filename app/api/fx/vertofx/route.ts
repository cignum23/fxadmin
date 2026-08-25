//app\api\fx\vertofx\route.ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";

// GET /api/fx/vertofx
export async function GET() {
  try {
    const url = "https://www.vertofx.com/exchange-rates"; // VertoFX public rates page
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    // Example: find USD/NGN rate on the page
    const usdNgn = $("div")
      .filter((i, el) => $(el).text().includes("USD/NGN"))
      .next()
      .text()
      .trim();

    const rate = parseFloat(usdNgn.replace(/,/g, ""));
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json(
        { error: "VertoFX rate unavailable or unparseable" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      name: "VertoFX",
      rate,
      source: url,
    });
  } catch (err) {
    console.error("❌ VertoFX scrape failed:", err);
    return NextResponse.json(
      { error: "Failed to scrape VertoFX" },
      { status: 500 }
    );
  }
}
