// "use client";

// import { Line } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// type Props = {
//   labels: string[];
//   dataPoints: number[];
//   coin: string;
// };

// export default function PriceChart({ labels, dataPoints, coin }: Props) {
//   return (
//     <div className="mt-8 bg-white p-4 rounded-lg shadow-md">
//       <h3 className="text-lg font-semibold mb-2">{coin} 7-Day Price (USD)</h3>
//       <Line
//         data={{
//           labels,
//           datasets: [
//             {
//               label: `${coin} Price`,
//               data: dataPoints,
//               borderColor: "#4F46E5",
//               backgroundColor: "#EEF2FF",
//               tension: 0.3,
//             },
//           ],
//         }}
//         options={{
//           responsive: true,
//           scales: {
//             y: { beginAtZero: false },
//           },
//         }}
//       />
//     </div>
//   );
// }


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
    <div className="mt-8 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">{coin} 7-Day Price Chart</h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: `${coin} Price`,
              data: dataPoints,
              borderColor: "#4F46E5",
              backgroundColor: "#EEF2FF",
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
