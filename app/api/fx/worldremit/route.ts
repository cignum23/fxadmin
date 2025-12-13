

// app/api/fx/worldremit/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const url = "https://www.worldremit.com/en/us/send-money-to-nigeria";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    // Find the element containing "1 USD ="
    const usdRateText = $("body").text().match(/1 USD =\s*([\d,.]+)/);
    const rate = usdRateText ? usdRateText[1].replace(/,/g, "") : null;

    return NextResponse.json({
      name: "WorldRemit",
      rate: rate ? parseFloat(rate) : null,
      source: url,
    });
  } catch (err) {
    console.error("❌ WorldRemit scrape failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
