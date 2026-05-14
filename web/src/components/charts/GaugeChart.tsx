import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;   // 0–100
  label: string;
  color?: string;
  size?: number;
}

export function GaugeChart({ value, label, color = '#C27550', size = 160 }: GaugeChartProps) {
  const data = [{ value, fill: color }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size / 2 + 20 }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={data}
          >
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="num text-2xl font-bold text-text-primary">{value}%</span>
        </div>
      </div>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}
