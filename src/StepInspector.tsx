import { useMemo, useState } from 'react';
import { Bug, ChevronLeft, ChevronRight, Gauge, Zap, Wind } from 'lucide-react';
import { OptimizerInfo, OptimizerConfig, defaultConfig, createOptimizerState, surfaces } from './optimizers';

interface InspectorStep {
  step: number;
  x: number;
  y: number;
  loss: number;
  gradX: number;
  gradY: number;
  gradMag: number;
  mx: number;
  my: number;
  sx: number;
  sy: number;
  effectiveLrX: number;
  effectiveLrY: number;
  stepSizeX: number;
  stepSizeY: number;
  stepMag: number;
}

interface StepInspectorProps {
  optimizer: OptimizerInfo;
  surfaceKey: string;
  maxSteps: number;
  config: Partial<OptimizerConfig>;
  customStart?: { x: number; y: number } | null;
}

export default function StepInspector({ optimizer, surfaceKey, maxSteps, config, customStart }: StepInspectorProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => {
    const surface = surfaces[surfaceKey];
    if (!surface) return [];
    const fullConfig = { ...defaultConfig, lr: optimizer.defaultLr, ...config };
    const startX = customStart?.x ?? surface.startX;
    const startY = customStart?.y ?? surface.startY;
    let state = createOptimizerState(startX, startY);
    const result: InspectorStep[] = [];

    for (let i = 0; i <= maxSteps; i++) {
      const loss = surface.fn(state.x, state.y);
      const [gx, gy] = surface.grad(state.x, state.y);
      const gradMag = Math.sqrt(gx * gx + gy * gy);

      // Compute effective LR for adaptive methods
      let eLrX = fullConfig.lr, eLrY = fullConfig.lr;
      if (state.sx > 0 || state.sy > 0) {
        const t = state.t || 1;
        if (['adam', 'adamw', 'nadam', 'amsgrad'].includes(optimizer.id)) {
          const sxHat = state.sx / (1 - Math.pow(fullConfig.beta2, t));
          const syHat = state.sy / (1 - Math.pow(fullConfig.beta2, t));
          eLrX = fullConfig.lr / (Math.sqrt(sxHat) + fullConfig.epsilon);
          eLrY = fullConfig.lr / (Math.sqrt(syHat) + fullConfig.epsilon);
        } else if (['rmsprop', 'adagrad'].includes(optimizer.id)) {
          eLrX = fullConfig.lr / (Math.sqrt(state.sx) + fullConfig.epsilon);
          eLrY = fullConfig.lr / (Math.sqrt(state.sy) + fullConfig.epsilon);
        }
      }

      const prevX = state.x;
      const prevY = state.y;

      result.push({
        step: i,
        x: state.x,
        y: state.y,
        loss,
        gradX: gx,
        gradY: gy,
        gradMag,
        mx: state.mx,
        my: state.my,
        sx: state.sx,
        sy: state.sy,
        effectiveLrX: eLrX,
        effectiveLrY: eLrY,
        stepSizeX: 0,
        stepSizeY: 0,
        stepMag: 0,
      });

      if (i < maxSteps) {
        const maxGrad = 50;
        const noise1 = fullConfig.noiseScale > 0 ? (Math.random() - 0.5) * 2 * fullConfig.noiseScale : 0;
        const noise2 = fullConfig.noiseScale > 0 ? (Math.random() - 0.5) * 2 * fullConfig.noiseScale : 0;
        const clippedGrad: [number, number] = [
          Math.max(-maxGrad, Math.min(maxGrad, gx + noise1)),
          Math.max(-maxGrad, Math.min(maxGrad, gy + noise2)),
        ];
        state = optimizer.step(state, clippedGrad, fullConfig);
        state.x = Math.max(surface.rangeX[0], Math.min(surface.rangeX[1], state.x));
        state.y = Math.max(surface.rangeY[0], Math.min(surface.rangeY[1], state.y));

        // Update step size for previous entry
        const last = result[result.length - 1];
        last.stepSizeX = state.x - prevX;
        last.stepSizeY = state.y - prevY;
        last.stepMag = Math.sqrt(last.stepSizeX ** 2 + last.stepSizeY ** 2);
      }
    }
    return result;
  }, [optimizer, surfaceKey, maxSteps, config, customStart]);

  const step = steps[currentStep];
  if (!step) return null;

  const fmtSci = (v: number) => {
    if (Math.abs(v) < 0.0001 || Math.abs(v) > 10000) return v.toExponential(3);
    return v.toFixed(6);
  };

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bug size={14} className="text-cyan-400" />
          Step Inspector
          <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: optimizer.color + '20', color: optimizer.color }}>
            {optimizer.name}
          </span>
        </h3>
      </div>

      {/* Step navigation */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setCurrentStep(0)} className="px-2 py-1 rounded text-[10px] bg-slate-700 text-slate-300 hover:bg-slate-600">⟵ Start</button>
        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300">
          <ChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={maxSteps}
            value={currentStep}
            onChange={e => setCurrentStep(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <button onClick={() => setCurrentStep(Math.min(maxSteps, currentStep + 1))} className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300">
          <ChevronRight size={14} />
        </button>
        <button onClick={() => setCurrentStep(maxSteps)} className="px-2 py-1 rounded text-[10px] bg-slate-700 text-slate-300 hover:bg-slate-600">End ⟶</button>
        <span className="text-xs font-mono text-slate-500 w-16 text-right">t={currentStep}</span>
      </div>

      {/* State display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5"><Gauge size={10} />Position</div>
          <p className="text-xs font-mono text-white">x: {step.x.toFixed(4)}</p>
          <p className="text-xs font-mono text-white">y: {step.y.toFixed(4)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5"><Zap size={10} />Loss</div>
          <p className="text-sm font-mono font-bold" style={{ color: optimizer.color }}>{fmtSci(step.loss)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5"><Wind size={10} />Gradient</div>
          <p className="text-xs font-mono text-white">∇x: {fmtSci(step.gradX)}</p>
          <p className="text-xs font-mono text-white">∇y: {fmtSci(step.gradY)}</p>
          <p className="text-[10px] font-mono text-slate-400">|∇|: {fmtSci(step.gradMag)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">📐 Step</div>
          <p className="text-xs font-mono text-white">Δx: {fmtSci(step.stepSizeX)}</p>
          <p className="text-xs font-mono text-white">Δy: {fmtSci(step.stepSizeY)}</p>
          <p className="text-[10px] font-mono text-slate-400">|Δ|: {fmtSci(step.stepMag)}</p>
        </div>
      </div>

      {/* Internal state for adaptive optimizers */}
      {optimizer.category === 'adaptive' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="text-[10px] text-slate-500 mb-0.5">1st Moment (m)</p>
            <p className="text-[11px] font-mono text-purple-300">mx: {fmtSci(step.mx)}</p>
            <p className="text-[11px] font-mono text-purple-300">my: {fmtSci(step.my)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="text-[10px] text-slate-500 mb-0.5">2nd Moment (v)</p>
            <p className="text-[11px] font-mono text-blue-300">vx: {fmtSci(step.sx)}</p>
            <p className="text-[11px] font-mono text-blue-300">vy: {fmtSci(step.sy)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Effective LR</p>
            <p className="text-[11px] font-mono text-amber-300">αx: {fmtSci(step.effectiveLrX)}</p>
            <p className="text-[11px] font-mono text-amber-300">αy: {fmtSci(step.effectiveLrY)}</p>
          </div>
        </div>
      )}

      {/* Mini sparkline of loss */}
      <div className="mt-3">
        <p className="text-[10px] text-slate-500 mb-1">Loss trajectory (dot = current step)</p>
        <svg viewBox="0 0 300 40" className="w-full">
          {(() => {
            const losses = steps.map(s => s.loss);
            const minL = Math.min(...losses);
            const maxL = Math.max(...losses);
            const range = maxL - minL || 1;
            const d = losses.map((l, i) => {
              const x = (i / maxSteps) * 300;
              const y = 38 - ((l - minL) / range) * 35;
              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ');
            const cx = (currentStep / maxSteps) * 300;
            const cy = 38 - ((step.loss - minL) / range) * 35;
            return (
              <>
                <path d={d} fill="none" stroke={optimizer.color} strokeWidth="1.5" opacity="0.5" />
                <path d={losses.slice(0, currentStep + 1).map((l, i) => {
                  const x = (i / maxSteps) * 300;
                  const y = 38 - ((l - minL) / range) * 35;
                  return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ')} fill="none" stroke={optimizer.color} strokeWidth="2" />
                <circle cx={cx} cy={cy} r="4" fill={optimizer.color} stroke="white" strokeWidth="1.5" />
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
