"use client";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

type Props = {
  labels: string[];
  dataPoints: number[];
  coin: string;
};

export default function PriceChart({ labels, dataPoints, coin }: Props) {
  return (
    <div className="mt-8 rounded-xl border border-border bg-white/80 p-5 shadow-card">
      <h3 className="mb-4 text-lg font-bold text-[var(--color-text-strong)]">{coin} 7-Day Price Chart</h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: `${coin} Price`,
              data: dataPoints,
              borderColor: "var(--chart-usd-fiat)",
              backgroundColor: "var(--chart-usd-fiat-soft)",
              tension: 0.4,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: "var(--color-text-muted)",
                font: { weight: 600 },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "var(--color-text-muted)", font: { weight: 600 } },
              grid: { color: "rgba(0,22,25,0.08)" },
            },
            y: {
              beginAtZero: false,
              ticks: { color: "var(--color-text-muted)", font: { weight: 600 } },
              grid: { color: "rgba(0,22,25,0.08)" },
            },
          },
        }}
      />
    </div>
  );
}
