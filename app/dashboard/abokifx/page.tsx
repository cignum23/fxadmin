"use client";

import useSWR from "swr";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AbokiRateResponse = {
  name: string;
  rate: number | null;
  mode?: "buy" | "sell" | "mid";
  mid_rate: number | null;
  buy_rate: number | null;
  sell_rate: number | null;
  currency: string;
  endpoint: string;
  timestamp: string | null;
  raw_rate: string | null;
  source: string;
  updated_at: string;
};

const fetchAbokiRate = async (): Promise<AbokiRateResponse> => {
  const response = await fetch("/api/fx/abokifx?mode=mid", { cache: "no-store" });
  const data = (await response.json()) as AbokiRateResponse;

  if (!response.ok) {
    throw new Error(data.rate === null ? "Aboki FX rate is unavailable." : "Failed to load Aboki FX data.");
  }

  return data;
};

function formatNaira(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unavailable";
  return `\u20A6${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Not supplied";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AbokiFxPage() {
  const { data, error, isLoading, mutate, isValidating } = useSWR("abokifx-dashboard", fetchAbokiRate, {
    refreshInterval: 30000,
  });

  const rows = data
    ? [
        ["Buy Rate", formatNaira(data.buy_rate), "Direct buy-side quote when supplied by Aboki."],
        ["Sell Rate", formatNaira(data.sell_rate), "Direct sell-side quote when supplied by Aboki."],
        ["Mid Rate", formatNaira(data.mid_rate ?? data.rate), "Baseline input used by the FX engine collector."],
        ["Raw Rate", data.raw_rate || "Not supplied", "Original Aboki text value before normalization."],
        ["Source", data.source, "Feed used after official and fallback checks."],
        ["Updated", formatDate(data.timestamp ?? data.updated_at), "Timestamp attached to the current quote."],
      ]
    : [];

  return (
    <div className="fx-page space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="fx-label mb-2">FX Market Source</p>
          <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">Aboki FX Rates</h1>
          <p className="mt-1 max-w-2xl font-medium text-muted-foreground">
            USD/NGN buy, sell, and mid-rate feed used as an external baseline input.
          </p>
        </div>

        <Button
          onClick={() => void mutate()}
          disabled={isValidating}
          className="h-11 gap-2 rounded-md px-5 text-sm font-extrabold uppercase tracking-[0.08em]"
        >
          <RefreshCcw className="h-4 w-4" />
          {isValidating ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      {error && (
        <Card className="border-danger/25 bg-danger/10">
          <CardContent className="flex items-start gap-3 p-5 text-danger">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{error instanceof Error ? error.message : "Failed to load Aboki FX data."}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>USD/NGN Snapshot</CardTitle>
          {data?.endpoint && <span className="fx-badge">{data.endpoint}</span>}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-xl border border-border bg-white p-8 text-center font-medium text-muted-foreground">
              Loading Aboki FX rates...
            </div>
          ) : data ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.45fr)_minmax(0,1fr)]">
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="fx-label mb-4">Current Mid</p>
                <p className="fx-value text-5xl">{formatNaira(data.mid_rate ?? data.rate)}</p>
                <p className="mt-3 font-semibold text-[var(--color-text-strong)]">1 USD quoted in NGN</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{formatDate(data.timestamp ?? data.updated_at)}</p>
              </div>

              <div className="fx-table-shell">
                <table className="fx-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                      <th>Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([metric, value, description]) => (
                      <tr key={metric}>
                        <td className="font-bold text-[var(--color-text-strong)]">{metric}</td>
                        <td className="font-semibold">{value}</td>
                        <td className="max-w-md whitespace-normal font-medium text-muted-foreground">{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white p-8 text-center font-semibold text-muted-foreground">
              No Aboki FX rate is available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
