import { useState, useMemo, useEffect } from 'react';
import { Play, Pause, RotateCcw, BookOpen } from 'lucide-react';
import { OptimizerInfo, defaultConfig } from './optimizers';

interface AlgorithmExplainerProps {
  optimizer: OptimizerInfo;
}

interface AnimatedValue {
  name: string;
  symbol: string;
  value: number;
  color: string;
  description: string;
}

export default function AlgorithmExplainer({ optimizer }: AlgorithmExplainerProps) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const maxSteps = 15;

  // Simulate values for animation
  const simulation = useMemo(() => {
    const results: { step: number; values: AnimatedValue[]; gradX: number; gradY: number; x: number; y: number }[] = [];
    
    let x = 3, y = 3;
    let vx = 0, vy = 0;
    let mx = 0, my = 0;
    let sx = 0, sy = 0;
    const lr = optimizer.defaultLr;
    const { beta1, beta2, momentum, epsilon } = defaultConfig;

    for (let t = 0; t <= maxSteps; t++) {
      // Simulated gradients (from x^2 + y^2 surface)
      const gradX = 2 * x * 0.1;
      const gradY = 2 * y * 0.1;

      const values: AnimatedValue[] = [];

      if (optimizer.id === 'sgd') {
        values.push({ name: 'Gradient', symbol: '∇L', value: Math.sqrt(gradX ** 2 + gradY ** 2), color: '#ef4444', description: 'Current gradient magnitude' });
        values.push({ name: 'Learning Rate', symbol: 'α', value: lr, color: '#f59e0b', description: 'Step size multiplier' });
        values.push({ name: 'Update', symbol: 'Δθ', value: lr * Math.sqrt(gradX ** 2 + gradY ** 2), color: '#22c55e', description: 'α × |∇L|' });
        x -= lr * gradX;
        y -= lr * gradY;
      } else if (optimizer.id === 'momentum') {
        vx = momentum * vx + gradX;
        vy = momentum * vy + gradY;
        values.push({ name: 'Gradient', symbol: '∇L', value: Math.sqrt(gradX ** 2 + gradY ** 2), color: '#ef4444', description: 'Current gradient' });
        values.push({ name: 'Velocity', symbol: 'v', value: Math.sqrt(vx ** 2 + vy ** 2), color: '#f97316', description: 'γv + ∇L (accumulated)' });
        values.push({ name: 'Update', symbol: 'Δθ', value: lr * Math.sqrt(vx ** 2 + vy ** 2), color: '#22c55e', description: 'α × v' });
        x -= lr * vx;
        y -= lr * vy;
      } else if (optimizer.id === 'adam' || optimizer.id === 'adamw') {
        const tt = t + 1;
        mx = beta1 * mx + (1 - beta1) * gradX;
        my = beta1 * my + (1 - beta1) * gradY;
        sx = beta2 * sx + (1 - beta2) * gradX * gradX;
        sy = beta2 * sy + (1 - beta2) * gradY * gradY;
        const mxHat = mx / (1 - beta1 ** tt);
        const myHat = my / (1 - beta1 ** tt);
        const sxHat = sx / (1 - beta2 ** tt);
        const syHat = sy / (1 - beta2 ** tt);
        
        values.push({ name: 'Gradient', symbol: '∇L', value: Math.sqrt(gradX ** 2 + gradY ** 2), color: '#ef4444', description: 'Current gradient' });
        values.push({ name: '1st Moment (m)', symbol: 'm', value: Math.sqrt(mx ** 2 + my ** 2), color: '#8b5cf6', description: 'β₁m + (1-β₁)∇L' });
        values.push({ name: '2nd Moment (v)', symbol: 'v', value: Math.sqrt(sx + sy), color: '#3b82f6', description: 'β₂v + (1-β₂)∇L²' });
        values.push({ name: 'Bias-Corrected m̂', symbol: 'm̂', value: Math.sqrt(mxHat ** 2 + myHat ** 2), color: '#a855f7', description: 'm / (1-β₁ᵗ)' });
        values.push({ name: 'Bias-Corrected v̂', symbol: 'v̂', value: Math.sqrt(sxHat + syHat), color: '#06b6d4', description: 'v / (1-β₂ᵗ)' });
        values.push({ name: 'Effective LR', symbol: 'α_eff', value: lr / (Math.sqrt((sxHat + syHat) / 2) + epsilon), color: '#f59e0b', description: 'α / (√v̂ + ε)' });
        
        x -= lr * mxHat / (Math.sqrt(sxHat) + epsilon);
        y -= lr * myHat / (Math.sqrt(syHat) + epsilon);
      } else if (optimizer.id === 'rmsprop') {
        sx = beta2 * sx + (1 - beta2) * gradX * gradX;
        sy = beta2 * sy + (1 - beta2) * gradY * gradY;
        
        values.push({ name: 'Gradient', symbol: '∇L', value: Math.sqrt(gradX ** 2 + gradY ** 2), color: '#ef4444', description: 'Current gradient' });
        values.push({ name: 'EMA of ∇²', symbol: 'E[g²]', value: Math.sqrt(sx + sy), color: '#3b82f6', description: 'β×E[g²] + (1-β)×g²' });
        values.push({ name: 'Effective LR', symbol: 'α_eff', value: lr / (Math.sqrt((sx + sy) / 2) + epsilon), color: '#f59e0b', description: 'α / √(E[g²] + ε)' });
        
        x -= lr * gradX / (Math.sqrt(sx) + epsilon);
        y -= lr * gradY / (Math.sqrt(sy) + epsilon);
      } else {
        // Generic fallback
        values.push({ name: 'Gradient', symbol: '∇L', value: Math.sqrt(gradX ** 2 + gradY ** 2), color: '#ef4444', description: 'Current gradient magnitude' });
        values.push({ name: 'Position', symbol: 'θ', value: Math.sqrt(x ** 2 + y ** 2), color: '#22c55e', description: 'Distance from origin' });
      }

      results.push({ step: t, values, gradX, gradY, x, y });
    }

    return results;
  }, [optimizer]);

  useEffect(() => {
    if (isPlaying && step < maxSteps) {
      const timer = setTimeout(() => setStep(s => s + 1), 500);
      return () => clearTimeout(timer);
    } else if (step >= maxSteps) {
      setIsPlaying(false);
    }
  }, [isPlaying, step]);

  const currentData = simulation[step] ?? simulation[0];

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen size={14} className="text-emerald-400" />
          Algorithm Visualization
          <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: optimizer.color + '20', color: optimizer.color }}>
            {optimizer.name}
          </span>
        </h3>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setStep(0); setIsPlaying(true); }}
          className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={() => { setStep(0); setIsPlaying(false); }}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
        >
          <RotateCcw size={14} />
        </button>
        <input
          type="range"
          min={0}
          max={maxSteps}
          value={step}
          onChange={e => { setStep(Number(e.target.value)); setIsPlaying(false); }}
          className="flex-1"
        />
        <span className="text-xs font-mono text-slate-400 w-12 text-right">t = {step}</span>
      </div>

      {/* Update equation */}
      <div className="bg-slate-900/80 rounded-lg p-3 mb-4">
        <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap">{optimizer.equation}</pre>
      </div>

      {/* Animated values */}
      <div className="space-y-2">
        {currentData.values.map(v => (
          <div key={v.name} className="flex items-center gap-3">
            <div className="w-20 text-right">
              <span className="text-[11px] font-mono font-bold" style={{ color: v.color }}>{v.symbol}</span>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.abs(v.value) * 30)}%`,
                    backgroundColor: v.color,
                  }}
                />
              </div>
            </div>
            <div className="w-20 text-right">
              <span className="text-[11px] font-mono text-white">{v.value.toFixed(4)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Position indicator */}
      <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
        <span>Position: <span className="font-mono text-white">({currentData.x.toFixed(3)}, {currentData.y.toFixed(3)})</span></span>
        <span>Loss: <span className="font-mono text-emerald-400">{(currentData.x ** 2 + currentData.y ** 2).toFixed(4)}</span></span>
      </div>

      {/* Value descriptions */}
      <div className="mt-3 grid grid-cols-2 gap-1">
        {currentData.values.slice(0, 4).map(v => (
          <div key={v.name} className="text-[9px] text-slate-500">
            <span style={{ color: v.color }}>{v.symbol}</span>: {v.description}
          </div>
        ))}
      </div>
    </div>
  );
}
