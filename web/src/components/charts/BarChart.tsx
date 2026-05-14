import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { TimeseriesPoint } from '@/types/analytics';

interface BarChartProps {
  data: TimeseriesPoint[];
  title: string;
  height?: number;
}

const perfColor = {
  good:     '#4CAF50',
  warning:  '#FFA726',
  critical: '#EF5350',
};

export function BarChart({ data, title, height = 260 }: BarChartProps) {
  return (
    <div className="card">
      <p className="text-sm font-semibold text-text-primary mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="hour"
            tickFormatter={(v: number) => `${v}:00`}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
            labelFormatter={(v) => `Hour: ${v}:00`}
          />
          <Bar dataKey="deliveries" name="Deliveries" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={perfColor[entry.performance]} />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3">
        {Object.entries(perfColor).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 text-xs text-text-secondary capitalize">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: v }} />
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
