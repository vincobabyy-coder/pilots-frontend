import { clsx } from 'clsx';
import { AnomalyMatrix } from '@/types/analytics';

interface HeatmapChartProps {
  data: AnomalyMatrix;
  title: string;
}

function scoreColor(score: number): string {
  if (score >= 0.8) return 'bg-red-500 text-white';
  if (score >= 0.6) return 'bg-amber-400 text-white';
  if (score >= 0.4) return 'bg-amber-200 text-amber-900';
  if (score >= 0.2) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

export function HeatmapChart({ data, title }: HeatmapChartProps) {
  return (
    <div className="card overflow-x-auto">
      <p className="text-sm font-semibold text-text-primary mb-4">{title}</p>
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th className="p-1 text-left text-text-muted font-medium">Warehouse</th>
            {data.metrics.map((m) => (
              <th key={m} className="p-1 text-center text-text-muted font-medium whitespace-nowrap">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.warehouses.map((wh) => (
            <tr key={wh}>
              <td className="p-1 text-text-secondary font-medium whitespace-nowrap">{wh}</td>
              {data.metrics.map((metric) => {
                const cell = data.cells.find(
                  (c) => c.warehouseName === wh && c.metric === metric
                );
                const score = cell?.score ?? 0;
                return (
                  <td key={metric} className="p-1 text-center">
                    <span
                      className={clsx(
                        'inline-flex items-center justify-center w-10 h-7 rounded-md text-[11px] font-medium',
                        scoreColor(score)
                      )}
                    >
                      {(score * 100).toFixed(0)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
