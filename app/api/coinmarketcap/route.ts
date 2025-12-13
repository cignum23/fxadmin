

//app\api\coinmarketcap\route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic"; // Optional: disable caching

export async function GET() {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) return new NextResponse("Missing API key", { status: 500 });

  try {
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&convert=USD",
      { headers: { "X-CMC_PRO_API_KEY": apiKey } }
    );
    return NextResponse.json(res.data.data);
  } catch (err) {
    console.error("CMC fetch error:", err);
    return new NextResponse("Failed", { status: 500 });
  }
}

