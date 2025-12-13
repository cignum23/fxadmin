'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface HistoryData {
  timestamp: string;
  final_usd_ngn_rate: number;
  baseline_rate: number;
  crypto_implied_rate: number | null;
}

interface RateChartProps {
  data: HistoryData[];
}

export default function RateChart({ data }: RateChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Rate History (Last 24 Hours)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
          <Tooltip
            formatter={(value: unknown) => {
              if (typeof value === 'number') {
                return [value.toFixed(2), ''];
              }
              return [String(value), ''];
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="final_usd_ngn_rate"
            stroke="#2563eb"
            dot={false}
            name="Final Rate"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="baseline_rate"
            stroke="#64748b"
            dot={false}
            name="Baseline"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
