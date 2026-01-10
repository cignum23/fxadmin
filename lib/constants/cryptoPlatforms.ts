export type CryptoPlatformId =
  | "coingecko"
  | "coinmarketcap"
  | "cryptocompare"
  | "binance"
  | "abokifx"
  | "internal";

export const CRYPTO_PLATFORMS: {
  id: CryptoPlatformId;
  name: string;
}[] = [
  { id: "coingecko", name: "CoinGecko" },
  { id: "coinmarketcap", name: "CoinMarketCap" },
  { id: "cryptocompare", name: "CryptoCompare" },
  { id: "binance", name: "Binance" },
  { id: "abokifx", name: "Aboki FX" },
  { id: "internal", name: "Internal Engine" },
];
