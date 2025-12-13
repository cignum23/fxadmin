//lib\api\fetchCryptoUsdPrice.ts
import axios from "axios";
import { CryptoPlatformId } from "@/lib/constants/cryptoPlatforms";

export async function fetchCryptoUsdPrice(
  platform: CryptoPlatformId,
  symbol: string
): Promise<number> {
  switch (platform) {
    case "coingecko": {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: symbol.toLowerCase(),
            vs_currencies: "usd",
          },
          timeout: 5000,
        }
      );
      const price = res.data?.[symbol.toLowerCase()]?.usd;
      if (!price) throw new Error(`No price data for ${symbol} on CoinGecko`);
      return Number(price);
    }

    case "coinmarketcap": {
      const res = await axios.get("/api/coinmarketcap", { timeout: 5000 });
      const coin = (res.data as Array<{ symbol: string; quote?: { USD?: { price: number } } }>).find(
        (c) => c.symbol === symbol
      );
      const price = coin?.quote?.USD?.price;
      if (!price) throw new Error(`No price data for ${symbol} on CoinMarketCap`);
      return Number(price);
    }

    case "cryptocompare": {
      const res = await axios.get(
        `https://min-api.cryptocompare.com/data/price`,
        {
          params: { fsym: symbol, tsyms: "USD" },
          timeout: 5000,
        }
      );
      const price = res.data?.USD;
      if (!price) throw new Error(`No price data for ${symbol} on CryptoCompare`);
      return Number(price);
    }

    case "binance": {
      const pair = `${symbol}USDT`;
      const res = await axios.get(
        `https://api.binance.com/api/v3/avgPrice`,
        {
          params: { symbol: pair },
          timeout: 5000,
        }
      );
      const price = res.data?.price;
      if (!price) throw new Error(`No price data for ${symbol} on Binance`);
      return Number(price);
    }

    default:
      throw new Error("Unsupported platform");
  }
}
