import { useState, useMemo, useCallback } from 'react';
import { Code, Play, AlertTriangle, Sparkles, RotateCcw } from 'lucide-react';

interface CustomSurfaceProps {
  onApply: (fn: (x: number, y: number) => number, grad: (x: number, y: number) => [number, number], name: string) => void;
  onReset: () => void;
}

const presets = [
  {
    name: 'Bowl',
    fn: 'x*x + y*y',
    description: 'Simple quadratic bowl — the easiest surface',
  },
  {
    name: 'Ellipse',
    fn: '0.5*x*x + 4*y*y',
    description: 'Stretched ellipse — tests handling of different curvatures',
  },
  {
    name: 'Ripples',
    fn: 'x*x + y*y + 0.5*Math.sin(5*x)*Math.sin(5*y)',
    description: 'Bowl with sinusoidal ripples — local bumps',
  },
  {
    name: 'Wavy Valley',
    fn: 'x*x + 0.1*y*y + Math.sin(3*x)',
    description: 'Valley with waves along one axis',
  },
  {
    name: 'Steep Cliff',
    fn: 'Math.max(0, 5 - Math.sqrt(x*x + y*y))',
    description: 'Cone-like cliff — tests gradient clipping',
  },
  {
    name: 'Flat + Hole',
    fn: '1 / (1 + x*x + y*y)',
    description: 'Flat plateau with a single inverted peak',
  },
  {
    name: 'Abs Valley',
    fn: 'Math.abs(x) + 0.5*y*y',
    description: 'Non-smooth at x=0 — tests subgradient behavior',
  },
  {
    name: 'Double Well',
    fn: '(x*x - 1)*(x*x - 1) + y*y',
    description: 'Two minima at x=±1 — tests which minimum is found',
  },
];

export default function CustomSurface({ onApply, onReset }: CustomSurfaceProps) {
  const [fnString, setFnString] = useState('x*x + y*y');
  const [name, setName] = useState('Custom');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse and validate the function
  const parsed = useMemo(() => {
    try {
      // Create the loss function
      const fn = new Function('x', 'y', `
        try {
          return ${fnString};
        } catch(e) {
          return NaN;
        }
      `) as (x: number, y: number) => number;

      // Test it
      const testVal = fn(1, 1);
      if (typeof testVal !== 'number' || !isFinite(testVal)) {
        throw new Error('Function must return a finite number');
      }

      // Create numerical gradient function
      const grad = (x: number, y: number): [number, number] => {
        const h = 0.0001;
        const dfdx = (fn(x + h, y) - fn(x - h, y)) / (2 * h);
        const dfdy = (fn(x, y + h) - fn(x, y - h)) / (2 * h);
        return [dfdx, dfdy];
      };

      setError(null);
      return { fn, grad, valid: true };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid function');
      return { fn: null, grad: null, valid: false };
    }
  }, [fnString]);

  const handleApply = useCallback(() => {
    if (parsed.fn && parsed.grad) {
      onApply(parsed.fn, parsed.grad, name);
    }
  }, [parsed, name, onApply]);

  const applyPreset = useCallback((preset: typeof presets[0]) => {
    setFnString(preset.fn);
    setName(preset.name);
  }, []);

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Code size={16} className="text-violet-400" />
          Custom Loss Surface
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-slate-400 hover:text-white"
        >
          {isExpanded ? '▾ Collapse' : '▸ Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <p className="text-xs text-slate-500 mb-4">
            Define your own loss function f(x, y). Use JavaScript math: <code className="text-violet-300">Math.sin</code>, <code className="text-violet-300">Math.exp</code>, <code className="text-violet-300">Math.abs</code>, etc.
          </p>

          {/* Presets */}
          <div className="mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">Quick Presets</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div className="mb-3">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">Surface Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
              placeholder="My Custom Surface"
            />
          </div>

          {/* Function input */}
          <div className="mb-3">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">f(x, y) =</label>
            <div className="relative">
              <textarea
                value={fnString}
                onChange={e => setFnString(e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono text-violet-300 placeholder:text-slate-600 focus:outline-none resize-none ${
                  error ? 'border-red-500' : 'border-slate-700 focus:border-violet-500'
                }`}
                rows={2}
                placeholder="x*x + y*y"
              />
              {parsed.valid && (
                <Sparkles size={14} className="absolute right-2 top-2 text-green-400" />
              )}
            </div>
            {error && (
              <div className="flex items-center gap-1 mt-1 text-[11px] text-red-400">
                <AlertTriangle size={12} />
                {error}
              </div>
            )}
          </div>

          {/* Preview of f(1,1) */}
          {parsed.valid && parsed.fn && (
            <div className="mb-4 bg-slate-900/60 rounded-lg p-2 text-[11px]">
              <span className="text-slate-500">Preview: </span>
              <span className="text-slate-300">f(1, 1) = </span>
              <span className="text-violet-300 font-mono">{parsed.fn(1, 1).toFixed(4)}</span>
              <span className="text-slate-500 ml-3">f(0, 0) = </span>
              <span className="text-violet-300 font-mono">{parsed.fn(0, 0).toFixed(4)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={!parsed.valid}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                parsed.valid
                  ? 'bg-violet-600 hover:bg-violet-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play size={12} />
              Apply Custom Surface
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          {/* Help */}
          <div className="mt-4 text-[10px] text-slate-600">
            <p className="font-medium text-slate-500 mb-1">Available:</p>
            <p><code className="text-violet-400">x, y</code> — coordinates (typically -4 to 4)</p>
            <p><code className="text-violet-400">Math.sin, Math.cos, Math.exp, Math.log, Math.sqrt, Math.abs, Math.pow, Math.max, Math.min</code></p>
            <p className="mt-1 text-slate-500">Gradients are computed numerically via finite differences.</p>
          </div>
        </>
      )}
    </div>
  );
}
