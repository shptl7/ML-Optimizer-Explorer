import { useMemo } from 'react';
import { Radar } from 'lucide-react';
import { OptimizerInfo, runOptimizer, computeMetrics, surfaces, OptimizerConfig } from './optimizers';

interface RadarChartProps {
  selectedOptimizers: OptimizerInfo[];
  maxSteps: number;
  config: Partial<OptimizerConfig>;
}

const surfaceKeys = Object.keys(surfaces);

export default function RadarChart({ selectedOptimizers, maxSteps, config }: RadarChartProps) {
  const data = useMemo(() => {
    return selectedOptimizers.map(opt => {
      const scores = surfaceKeys.map(sk => {
        const path = runOptimizer(opt, sk, maxSteps, config);
        const metrics = computeMetrics(path);
        return {
          surface: sk,
          surfaceName: surfaces[sk].name,
          finalLoss: metrics.finalLoss,
          convergenceSpeed: metrics.stepsTo90 ?? maxSteps,
          stability: 1 - metrics.oscillation,
          pathEfficiency: 1 / (metrics.pathLength + 0.01),
        };
      });
      return { optimizer: opt, scores };
    });
  }, [selectedOptimizers, maxSteps, config]);

  if (selectedOptimizers.length === 0) return null;

  // Compute aggregate scores per optimizer across all surfaces
  const aggregates = useMemo(() => {
    // For each metric, find global min/max for normalization
    const allFinalLoss = data.flatMap(d => d.scores.map(s => s.finalLoss));
    const allSpeed = data.flatMap(d => d.scores.map(s => s.convergenceSpeed));
    const allStability = data.flatMap(d => d.scores.map(s => s.stability));
    const allEfficiency = data.flatMap(d => d.scores.map(s => s.pathEfficiency));

    const norm = (val: number, arr: number[], invert = false) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      if (max === min) return 0.5;
      const n = (val - min) / (max - min);
      return invert ? 1 - n : n;
    };

    return data.map(d => {
      const avgLoss = d.scores.reduce((s, x) => s + norm(x.finalLoss, allFinalLoss, true), 0) / d.scores.length;
      const avgSpeed = d.scores.reduce((s, x) => s + norm(x.convergenceSpeed, allSpeed, true), 0) / d.scores.length;
      const avgStability = d.scores.reduce((s, x) => s + norm(x.stability, allStability), 0) / d.scores.length;
      const avgEfficiency = d.scores.reduce((s, x) => s + norm(x.pathEfficiency, allEfficiency), 0) / d.scores.length;

      // Simplicity score based on category
      const simplicity = d.optimizer.id === 'sgd' ? 1 : ['momentum', 'nesterov'].includes(d.optimizer.id) ? 0.7 : 0.4;

      return {
        optimizer: d.optimizer,
        axes: [
          { label: 'Convergence', value: avgLoss },
          { label: 'Speed', value: avgSpeed },
          { label: 'Stability', value: avgStability },
          { label: 'Efficiency', value: avgEfficiency },
          { label: 'Simplicity', value: simplicity },
        ],
      };
    });
  }, [data]);

  const cx = 200, cy = 200, radius = 150;
  const axes = aggregates[0]?.axes.map(a => a.label) ?? [];
  const n = axes.length;

  const getPoint = (axisIndex: number, value: number) => {
    const angle = (Math.PI * 2 * axisIndex) / n - Math.PI / 2;
    const r = value * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Radar size={18} className="text-cyan-400" />
        Multi-Axis Performance Radar
      </h2>
      <p className="text-xs text-slate-500 mb-4">Aggregated performance across all {surfaceKeys.length} loss surfaces. Larger area = better overall optimizer.</p>

      <div className="flex flex-col lg:flex-row gap-6">
        <svg viewBox="0 0 400 400" className="w-full max-w-[400px] mx-auto lg:mx-0">
          {/* Grid rings */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map(r => {
            const points = Array.from({ length: n }, (_, i) => getPoint(i, r));
            const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
            return <path key={r} d={d} fill="none" stroke="#1e293b" strokeWidth="1" />;
          })}

          {/* Axis lines */}
          {axes.map((_, i) => {
            const p = getPoint(i, 1);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#334155" strokeWidth="1" />;
          })}

          {/* Axis labels */}
          {axes.map((label, i) => {
            const p = getPoint(i, 1.18);
            return (
              <text key={label} x={p.x} y={p.y} fill="#94a3b8" fontSize="11" textAnchor="middle" dominantBaseline="middle" fontWeight="600">
                {label}
              </text>
            );
          })}

          {/* Optimizer polygons */}
          {aggregates.map(({ optimizer, axes: axesData }) => {
            const points = axesData.map((a, i) => getPoint(i, a.value));
            const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
            return (
              <g key={optimizer.id}>
                <path d={d} fill={optimizer.color} fillOpacity="0.08" stroke={optimizer.color} strokeWidth="2" strokeOpacity="0.8" />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={optimizer.color} stroke="#0f172a" strokeWidth="1.5" />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legend + scores */}
        <div className="flex-1 space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Scores (0–1, higher = better)</p>
          {aggregates.map(({ optimizer, axes: axesData }) => {
            const avgScore = axesData.reduce((s, a) => s + a.value, 0) / axesData.length;
            return (
              <div key={optimizer.id} className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: optimizer.color }} />
                    <span className="font-bold text-sm text-white">{optimizer.name}</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: optimizer.color + '20', color: optimizer.color }}>
                    avg: {(avgScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {axesData.map(a => (
                    <div key={a.label} className="text-center">
                      <div className="h-1 rounded-full bg-slate-800 overflow-hidden mb-0.5">
                        <div className="h-full rounded-full" style={{ width: `${a.value * 100}%`, backgroundColor: optimizer.color }} />
                      </div>
                      <span className="text-[9px] text-slate-500">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
