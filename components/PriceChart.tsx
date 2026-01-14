

//components\PriceChart.tsx
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
    <div className="mt-8 bg-card border border-border p-4 rounded-lg shadow-card">
      <h3 className="text-lg font-semibold mb-2 text-foreground">{coin} 7-Day Price Chart</h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: `${coin} Price`,
              data: dataPoints,
              borderColor: "#002E56",
              backgroundColor: "rgba(189, 161, 86, 0.18)",
              tension: 0.4,
            },
          ],
        }}
        options={{
          responsive: true,
          scales: { y: { beginAtZero: false } },
        }}
      />
    </div>
  );
}
