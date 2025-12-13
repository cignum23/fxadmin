export type CryptoPlatformId =
  | "coingecko"
  | "coinmarketcap"
  | "cryptocompare"
  | "binance"
  | "internal";

export const CRYPTO_PLATFORMS: {
  id: CryptoPlatformId;
  name: string;
}[] = [
  { id: "coingecko", name: "CoinGecko" },
  { id: "coinmarketcap", name: "CoinMarketCap" },
  { id: "cryptocompare", name: "CryptoCompare" },
  { id: "binance", name: "Binance" },
  { id: "internal", name: "Internal Engine" },
];
