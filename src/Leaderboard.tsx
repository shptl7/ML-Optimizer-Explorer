import { useMemo } from 'react';
import { Trophy, TrendingDown, Route, Activity, Target } from 'lucide-react';
import { OptimizerInfo, runOptimizer, computeMetrics, OptimizerConfig } from './optimizers';

interface LeaderboardProps {
  selectedOptimizers: OptimizerInfo[];
  surfaceKey: string;
  maxSteps: number;
  config: Partial<OptimizerConfig>;
  customStart?: { x: number; y: number } | null;
}

export default function Leaderboard({ selectedOptimizers, surfaceKey, maxSteps, config, customStart }: LeaderboardProps) {
  const results = useMemo(() => {
    return selectedOptimizers.map(opt => {
      const path = runOptimizer(opt, surfaceKey, maxSteps, config, customStart ?? undefined);
      const metrics = computeMetrics(path);
      return { optimizer: opt, metrics };
    }).sort((a, b) => a.metrics.finalLoss - b.metrics.finalLoss);
  }, [selectedOptimizers, surfaceKey, maxSteps, config, customStart]);

  if (results.length === 0) return null;

  const bestLoss = results[0]?.metrics.finalLoss ?? 0;
  const bestSpeed = Math.min(...results.map(r => r.metrics.stepsTo90 ?? Infinity));
  const bestPath = Math.min(...results.map(r => r.metrics.pathLength));
  const bestOsc = Math.min(...results.map(r => r.metrics.oscillation));

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Trophy size={20} className="text-amber-400" />
        Performance Leaderboard
      </h2>
      <p className="text-xs text-slate-500 mb-4">Ranked by final loss value after {maxSteps} steps. Lower is better.</p>

      {/* Podium cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {results.slice(0, 3).map((r, i) => (
          <div
            key={r.optimizer.id}
            className={`rounded-xl p-4 border ${
              i === 0 ? 'border-amber-500/30 bg-amber-500/5' :
              i === 1 ? 'border-slate-400/30 bg-slate-400/5' :
              'border-orange-700/30 bg-orange-700/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{medals[i]}</span>
              <div>
                <span className="font-bold text-white">{r.optimizer.name}</span>
                <span className="text-xs text-slate-500 ml-2">{r.optimizer.fullName}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-900/50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <TrendingDown size={10} /> Final Loss
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: r.optimizer.color }}>
                  {r.metrics.finalLoss.toFixed(6)}
                </span>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <Target size={10} /> 90% Conv.
                </div>
                <span className="text-sm font-mono font-bold text-slate-200">
                  {r.metrics.stepsTo90 !== null ? `${r.metrics.stepsTo90} steps` : 'N/A'}
                </span>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <Route size={10} /> Path Length
                </div>
                <span className="text-sm font-mono font-bold text-slate-200">
                  {r.metrics.pathLength.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <Activity size={10} /> Oscillation
                </div>
                <span className="text-sm font-mono font-bold text-slate-200">
                  {(r.metrics.oscillation * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full table */}
      {results.length > 3 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-2 text-slate-500 text-xs font-medium">#</th>
                <th className="text-left py-2 px-2 text-slate-500 text-xs font-medium">Optimizer</th>
                <th className="text-right py-2 px-2 text-slate-500 text-xs font-medium">Final Loss</th>
                <th className="text-right py-2 px-2 text-slate-500 text-xs font-medium">90% Step</th>
                <th className="text-right py-2 px-2 text-slate-500 text-xs font-medium">Path Len</th>
                <th className="text-right py-2 px-2 text-slate-500 text-xs font-medium">Oscillation</th>
                <th className="text-left py-2 px-2 text-slate-500 text-xs font-medium">Position</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(3).map((r, i) => (
                <tr key={r.optimizer.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-1.5 px-2 text-slate-500">{i + 4}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.optimizer.color }} />
                      <span className="text-white font-medium">{r.optimizer.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs" style={{ color: r.metrics.finalLoss <= bestLoss * 1.01 ? '#22c55e' : '#94a3b8' }}>
                    {r.metrics.finalLoss.toFixed(6)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs" style={{ color: r.metrics.stepsTo90 !== null && r.metrics.stepsTo90 <= bestSpeed * 1.1 ? '#22c55e' : '#94a3b8' }}>
                    {r.metrics.stepsTo90 ?? '—'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs" style={{ color: r.metrics.pathLength <= bestPath * 1.1 ? '#22c55e' : '#94a3b8' }}>
                    {r.metrics.pathLength.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs" style={{ color: r.metrics.oscillation <= bestOsc * 1.1 ? '#22c55e' : '#94a3b8' }}>
                    {(r.metrics.oscillation * 100).toFixed(1)}%
                  </td>
                  <td className="py-1.5 px-2 font-mono text-xs text-slate-400">
                    ({r.metrics.finalX.toFixed(2)}, {r.metrics.finalY.toFixed(2)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary bar chart */}
      <div className="mt-5">
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Final Loss Comparison</h3>
        <div className="space-y-2">
          {results.map((r, i) => {
            const barWidth = bestLoss > 0 && r.metrics.finalLoss > 0
              ? Math.max(2, Math.min(100, (bestLoss / r.metrics.finalLoss) * 100))
              : 100;
            return (
              <div key={r.optimizer.id} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16 text-right font-medium">{r.optimizer.name}</span>
                <div className="flex-1 h-5 bg-slate-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${barWidth}%`, backgroundColor: r.optimizer.color + '40', borderRight: `3px solid ${r.optimizer.color}` }}
                  >
                    <span className="text-[9px] font-mono text-white/80">{r.metrics.finalLoss.toFixed(4)}</span>
                  </div>
                </div>
                {i === 0 && <span className="text-xs text-amber-400">🏆</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
