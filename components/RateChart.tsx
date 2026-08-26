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
    <Card className="bg-white/80 p-5 sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-[var(--color-text-strong)]">
        Rate History (Last 24 Hours)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(0,22,25,0.08)" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 600 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={['dataMin - 5', 'dataMax + 5']}
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 600 }}
          />
          <Tooltip
            formatter={(value: unknown) => {
              if (typeof value === 'number') {
                return [value.toFixed(2), ''];
              }
              return [String(value), ''];
            }}
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="final_usd_ngn_rate"
            stroke="var(--chart-usd-fiat)"
            dot={false}
            name="Final Rate"
            strokeWidth={2.5}
          />
          <Line
            type="monotone"
            dataKey="baseline_rate"
            stroke="var(--chart-neutral)"
            dot={false}
            name="Baseline"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
