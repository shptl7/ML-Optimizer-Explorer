import { useMemo } from 'react';
import { Grid2x2 } from 'lucide-react';
import { OptimizerInfo, runOptimizer, surfaces, OptimizerConfig } from './optimizers';

const surfaceKeys = Object.keys(surfaces);

interface HeatmapMatrixProps {
  selectedOptimizers: OptimizerInfo[];
  maxSteps: number;
  config: Partial<OptimizerConfig>;
}

export default function HeatmapMatrix({ selectedOptimizers, maxSteps, config }: HeatmapMatrixProps) {
  const data = useMemo(() => {
    return surfaceKeys.map(surfaceKey => {
      const results = selectedOptimizers.map(opt => {
        const path = runOptimizer(opt, surfaceKey, maxSteps, config);
        const finalLoss = path[path.length - 1]?.z ?? Infinity;
        return { optimizer: opt, finalLoss };
      });
      
      // Sort to find rankings
      const sorted = [...results].sort((a, b) => a.finalLoss - b.finalLoss);
      const rankings = new Map<string, number>();
      sorted.forEach((r, i) => rankings.set(r.optimizer.id, i + 1));
      
      const minLoss = sorted[0]?.finalLoss ?? 0;
      const maxLoss = sorted[sorted.length - 1]?.finalLoss ?? 1;
      
      return {
        surfaceKey,
        surfaceName: surfaces[surfaceKey].name,
        results: results.map(r => ({
          ...r,
          rank: rankings.get(r.optimizer.id) ?? 0,
          normalized: maxLoss > minLoss ? (r.finalLoss - minLoss) / (maxLoss - minLoss) : 0,
        })),
        winner: sorted[0]?.optimizer,
      };
    });
  }, [selectedOptimizers, maxSteps, config]);

  // Count wins per optimizer
  const winCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedOptimizers.forEach(opt => counts.set(opt.id, 0));
    data.forEach(row => {
      if (row.winner) {
        counts.set(row.winner.id, (counts.get(row.winner.id) ?? 0) + 1);
      }
    });
    return counts;
  }, [data, selectedOptimizers]);

  if (selectedOptimizers.length < 2) return null;

  const cellSize = 50;
  const labelWidth = 120;

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Grid2x2 size={18} className="text-emerald-400" />
        Convergence Heatmap
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Each cell shows the final loss. Green = best on that surface. Darker = worse relative performance.
      </p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row with optimizer names */}
          <div className="flex" style={{ marginLeft: labelWidth }}>
            {selectedOptimizers.map(opt => (
              <div
                key={opt.id}
                className="flex flex-col items-center justify-end pb-2"
                style={{ width: cellSize }}
              >
                <div
                  className="w-3 h-3 rounded-full mb-1"
                  style={{ backgroundColor: opt.color }}
                />
                <span
                  className="text-[10px] font-bold writing-mode-vertical transform -rotate-45 origin-bottom-left whitespace-nowrap"
                  style={{ color: opt.color }}
                >
                  {opt.name}
                </span>
              </div>
            ))}
          </div>

          {/* Data rows */}
          {data.map(row => (
            <div key={row.surfaceKey} className="flex items-center">
              {/* Surface label */}
              <div
                className="text-xs text-slate-400 pr-3 text-right font-medium truncate"
                style={{ width: labelWidth }}
              >
                {row.surfaceName}
              </div>
              
              {/* Cells */}
              {row.results.map(cell => {
                const isWinner = cell.rank === 1;
                const bgOpacity = 0.1 + cell.normalized * 0.6;
                
                return (
                  <div
                    key={cell.optimizer.id}
                    className={`flex items-center justify-center border border-slate-800 ${
                      isWinner ? 'ring-2 ring-emerald-500 ring-inset' : ''
                    }`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isWinner 
                        ? `rgba(34, 197, 94, 0.3)` 
                        : `rgba(239, 68, 68, ${bgOpacity})`,
                    }}
                    title={`${cell.optimizer.name} on ${row.surfaceName}: ${cell.finalLoss.toFixed(6)}`}
                  >
                    <div className="text-center">
                      <span className={`text-[9px] font-mono ${isWinner ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>
                        {cell.finalLoss < 0.0001 
                          ? cell.finalLoss.toExponential(1) 
                          : cell.finalLoss.toFixed(4)}
                      </span>
                      {isWinner && <span className="block text-[8px] text-emerald-400">🏆</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Win count row */}
          <div className="flex items-center mt-2 pt-2 border-t border-slate-700">
            <div
              className="text-xs text-slate-500 pr-3 text-right font-bold"
              style={{ width: labelWidth }}
            >
              Total Wins
            </div>
            {selectedOptimizers.map(opt => (
              <div
                key={opt.id}
                className="flex items-center justify-center"
                style={{ width: cellSize, height: 36 }}
              >
                <span
                  className="text-sm font-bold px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: opt.color + '20',
                    color: opt.color,
                  }}
                >
                  {winCounts.get(opt.id) ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500/30 ring-2 ring-emerald-500 ring-inset" />
          <span>Best (winner)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500/20" />
          <span>Worse (relative)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500/60" />
          <span>Worst</span>
        </div>
      </div>
    </div>
  );
}
