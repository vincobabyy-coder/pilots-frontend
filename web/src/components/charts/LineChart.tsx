import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  Line,
} from 'recharts';
import { ForecastPoint } from '@/types/analytics';

interface LineChartProps {
  data: ForecastPoint[];
  title: string;
  height?: number;
}

export function LineChart({ data, title, height = 260 }: LineChartProps) {
  return (
    <div className="card">
      <p className="text-sm font-semibold text-text-primary mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#C27550" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#C27550" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4A7C8C" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#4A7C8C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="upper"    stroke="transparent" fill="url(#bandGrad)" name="Upper" />
          <Area type="monotone" dataKey="lower"    stroke="transparent" fill="url(#bandGrad)" name="Lower" />
          <Area type="monotone" dataKey="forecast" stroke="#C27550" fill="url(#forecastGrad)" strokeWidth={2} name="Forecast" />
          <Line type="monotone" dataKey="actual"   stroke="#4A7C8C" strokeWidth={2} dot={false} name="Actual" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
