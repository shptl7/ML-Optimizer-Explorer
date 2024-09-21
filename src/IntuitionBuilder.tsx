import { useState, useMemo } from 'react';
import { Lightbulb, Gauge, Wind, BarChart3 } from 'lucide-react';

// Simple 1D optimization visualization
function MiniOptViz({ title, description, icon: Icon, children }: {
  title: string;
  description: string;
  icon: typeof Lightbulb;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <Icon size={16} className="text-amber-400" />
        </div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">{description}</p>
      {children}
    </div>
  );
}

function LearningRateDemo() {
  const [lr, setLr] = useState(0.3);
  const width = 300;
  const height = 120;
  const padding = { left: 30, right: 10, top: 10, bottom: 25 };
  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;

  // Simple 1D quadratic: f(x) = x^2, starting at x=3
  const path = useMemo(() => {
    const pts: { step: number; x: number; loss: number }[] = [];
    let x = 3;
    for (let i = 0; i <= 30; i++) {
      pts.push({ step: i, x, loss: x * x });
      const grad = 2 * x;
      x = x - lr * grad;
      x = Math.max(-5, Math.min(5, x));
    }
    return pts;
  }, [lr]);

  const maxLoss = Math.max(...path.map(p => p.loss), 1);
  const diverges = path[path.length - 1].loss > path[0].loss;

  return (
    <MiniOptViz
      title="Learning Rate Effect"
      description="Drag the slider to see how learning rate affects convergence on f(x) = x². Too small → slow. Too large → diverges!"
      icon={Gauge}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Learning Rate: <span className="text-amber-400 font-mono">{lr.toFixed(2)}</span></span>
          {diverges && <span className="text-xs text-red-400 animate-pulse">⚠ Diverging!</span>}
          {!diverges && lr < 0.05 && <span className="text-xs text-yellow-400">🐌 Very slow</span>}
          {!diverges && lr >= 0.05 && lr <= 0.5 && <span className="text-xs text-green-400">✓ Good</span>}
        </div>
        <input
          type="range"
          min={0.01}
          max={1.2}
          step={0.01}
          value={lr}
          onChange={e => setLr(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[9px] text-slate-600 -mt-1">
          <span>0.01 (tiny)</span>
          <span>0.5 (sweet spot)</span>
          <span>1.2 (huge)</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid */}
        {[0, 0.5, 1].map(t => (
          <g key={t}>
            <line x1={padding.left} x2={width - padding.right} y1={padding.top + ih * (1 - t)} y2={padding.top + ih * (1 - t)} stroke="#1e293b" strokeWidth="0.5" />
            <text x={padding.left - 3} y={padding.top + ih * (1 - t) + 3} fill="#475569" fontSize="7" textAnchor="end">
              {(maxLoss * t).toFixed(1)}
            </text>
          </g>
        ))}
        <path
          d={path.map((p, i) => {
            const px = padding.left + (i / 30) * iw;
            const py = padding.top + ih * (1 - Math.min(p.loss, maxLoss) / maxLoss);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ')}
          fill="none"
          stroke={diverges ? '#ef4444' : '#f59e0b'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x={width / 2} y={height - 3} fill="#475569" fontSize="8" textAnchor="middle">Steps</text>
      </svg>
    </MiniOptViz>
  );
}

function MomentumDemo() {
  const [mom, setMom] = useState(0.9);
  const width = 300;
  const height = 120;
  const padding = { left: 30, right: 10, top: 10, bottom: 25 };
  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;
  const lr = 0.02;

  // 1D with ravine-like oscillation: f(x) = 0.5*x^2 + 5*sin(x)
  const pathNoMom = useMemo(() => {
    const pts: number[] = [];
    let x = 4;
    for (let i = 0; i <= 40; i++) {
      pts.push(0.5 * x * x);
      const grad = x + 5 * Math.cos(x);
      x = x - lr * grad;
    }
    return pts;
  }, []);

  const pathWithMom = useMemo(() => {
    const pts: number[] = [];
    let x = 4, v = 0;
    for (let i = 0; i <= 40; i++) {
      pts.push(0.5 * x * x);
      const grad = x + 5 * Math.cos(x);
      v = mom * v + grad;
      x = x - lr * v;
    }
    return pts;
  }, [mom]);

  const allVals = [...pathNoMom, ...pathWithMom];
  const maxVal = Math.max(...allVals, 1);

  return (
    <MiniOptViz
      title="Momentum Effect"
      description="Momentum accumulates velocity from past gradients. Watch how it smooths oscillations and accelerates convergence."
      icon={Wind}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Momentum γ: <span className="text-orange-400 font-mono">{mom.toFixed(2)}</span></span>
        </div>
        <input type="range" min={0} max={0.99} step={0.01} value={mom} onChange={e => setMom(Number(e.target.value))} className="w-full" />
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={padding.left} x2={width - padding.right} y1={padding.top + ih * (1 - t)} y2={padding.top + ih * (1 - t)} stroke="#1e293b" strokeWidth="0.5" />
        ))}
        {/* No momentum */}
        <path
          d={pathNoMom.map((val, i) => {
            const px = padding.left + (i / 40) * iw;
            const py = padding.top + ih * (1 - Math.min(val, maxVal) / maxVal);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ')}
          fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" opacity="0.7"
        />
        {/* With momentum */}
        <path
          d={pathWithMom.map((val, i) => {
            const px = padding.left + (i / 40) * iw;
            const py = padding.top + ih * (1 - Math.min(val, maxVal) / maxVal);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ')}
          fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round"
        />
        <text x={width - 10} y={padding.top + 12} fill="#ef4444" fontSize="7" textAnchor="end">No momentum</text>
        <text x={width - 10} y={padding.top + 22} fill="#f97316" fontSize="7" textAnchor="end">With momentum</text>
        <text x={width / 2} y={height - 3} fill="#475569" fontSize="8" textAnchor="middle">Steps</text>
      </svg>
    </MiniOptViz>
  );
}

function AdaptiveLRDemo() {
  const [step, setStep] = useState(0);
  const width = 300;
  const height = 120;
  const padding = { left: 35, right: 10, top: 10, bottom: 25 };
  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;

  // Show how Adagrad's LR shrinks vs RMSProp
  const maxSteps = 60;
  const lrs = useMemo(() => {
    const adagrad: number[] = [];
    const rmsprop: number[] = [];
    let sumG2_ada = 0;
    let emaG2_rms = 0;
    const baseLr = 0.5;
    const beta = 0.9;

    for (let i = 0; i <= maxSteps; i++) {
      const grad = 2 * Math.sin(i * 0.3) + 1; // Varying gradient
      const g2 = grad * grad;
      sumG2_ada += g2;
      emaG2_rms = beta * emaG2_rms + (1 - beta) * g2;

      adagrad.push(baseLr / (Math.sqrt(sumG2_ada) + 1e-8));
      rmsprop.push(baseLr / (Math.sqrt(emaG2_rms) + 1e-8));
    }
    return { adagrad, rmsprop };
  }, []);

  const allLrs = [...lrs.adagrad, ...lrs.rmsprop];
  const maxLr = Math.max(...allLrs);

  return (
    <MiniOptViz
      title="Adaptive vs Fixed Learning Rate"
      description="Adagrad's LR shrinks to zero (dies). RMSProp uses exponential average to keep it alive. Scrub through steps to see the difference."
      icon={BarChart3}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Step: <span className="text-blue-400 font-mono">{step}</span></span>
          <div className="flex gap-3">
            <span className="text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Adagrad: <span className="font-mono text-green-400">{lrs.adagrad[step]?.toFixed(4)}</span>
            </span>
            <span className="text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> RMSProp: <span className="font-mono text-blue-400">{lrs.rmsprop[step]?.toFixed(4)}</span>
            </span>
          </div>
        </div>
        <input type="range" min={0} max={maxSteps} step={1} value={step} onChange={e => setStep(Number(e.target.value))} className="w-full" />
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 0.5, 1].map(t => (
          <g key={t}>
            <line x1={padding.left} x2={width - padding.right} y1={padding.top + ih * (1 - t)} y2={padding.top + ih * (1 - t)} stroke="#1e293b" strokeWidth="0.5" />
            <text x={padding.left - 3} y={padding.top + ih * (1 - t) + 3} fill="#475569" fontSize="7" textAnchor="end">{(maxLr * t).toFixed(2)}</text>
          </g>
        ))}
        {/* Current step indicator */}
        <line x1={padding.left + (step / maxSteps) * iw} x2={padding.left + (step / maxSteps) * iw} y1={padding.top} y2={padding.top + ih} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
        {/* Adagrad LR */}
        <path
          d={lrs.adagrad.slice(0, step + 1).map((val, i) => {
            const px = padding.left + (i / maxSteps) * iw;
            const py = padding.top + ih * (1 - val / maxLr);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ')}
          fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"
        />
        {/* RMSProp LR */}
        <path
          d={lrs.rmsprop.slice(0, step + 1).map((val, i) => {
            const px = padding.left + (i / maxSteps) * iw;
            const py = padding.top + ih * (1 - val / maxLr);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ')}
          fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"
        />
        <text x={width / 2} y={height - 3} fill="#475569" fontSize="8" textAnchor="middle">Steps → (Effective LR over time)</text>
      </svg>
    </MiniOptViz>
  );
}

function BiasCorrectDemo() {
  const width = 300;
  const height = 120;
  const padding = { left: 35, right: 10, top: 10, bottom: 25 };
  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;

  const [beta, setBeta] = useState(0.9);

  const data = useMemo(() => {
    const uncorrected: number[] = [];
    const corrected: number[] = [];
    let m = 0;
    const trueGrad = 1.0;
    for (let t = 1; t <= 30; t++) {
      m = beta * m + (1 - beta) * trueGrad;
      uncorrected.push(m);
      corrected.push(m / (1 - Math.pow(beta, t)));
    }
    return { uncorrected, corrected };
  }, [beta]);

  const maxVal = Math.max(...data.corrected, ...data.uncorrected, 1.2);

  return (
    <MiniOptViz
      title="Why Bias Correction Matters"
      description="Adam's moment estimates start at 0, biasing early updates. Bias correction (m̂ = m/(1-β^t)) fixes this. Watch the uncorrected estimate slowly catch up."
      icon={Lightbulb}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">β₁: <span className="text-purple-400 font-mono">{beta.toFixed(2)}</span></span>
          <span className="text-[10px] text-slate-600">True gradient = 1.0 (dashed line)</span>
        </div>
        <input type="range" min={0.5} max={0.999} step={0.001} value={beta} onChange={e => setBeta(Number(e.target.value))} className="w-full" />
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* True gradient line */}
        <line x1={padding.left} x2={width - padding.right} y1={padding.top + ih * (1 - 1.0 / maxVal)} y2={padding.top + ih * (1 - 1.0 / maxVal)} stroke="#64748b" strokeWidth="1" strokeDasharray="4,3" />
        <text x={width - 10} y={padding.top + ih * (1 - 1.0 / maxVal) - 4} fill="#64748b" fontSize="7" textAnchor="end">True gradient</text>
        {/* Uncorrected */}
        <path
          d={data.uncorrected.map((val, i) => {
            const px = padding.left + ((i + 1) / 30) * iw;
            const py = padding.top + ih * (1 - val / maxVal);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ')}
          fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"
        />
        {/* Corrected */}
        <path
          d={data.corrected.map((val, i) => {
            const px = padding.left + ((i + 1) / 30) * iw;
            const py = padding.top + ih * (1 - Math.min(val, maxVal) / maxVal);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ')}
          fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"
        />
        <text x={width / 2} y={height - 3} fill="#475569" fontSize="8" textAnchor="middle">Steps</text>
        <text x={padding.left + 5} y={padding.top + 12} fill="#f43f5e" fontSize="7">Uncorrected</text>
        <text x={padding.left + 5} y={padding.top + 22} fill="#8b5cf6" fontSize="7">Corrected</text>
      </svg>
    </MiniOptViz>
  );
}

export default function IntuitionBuilder() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={20} className="text-amber-400" />
        <h2 className="text-xl font-bold text-white">Intuition Builder</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Interactive mini-experiments to build deep intuition about optimizer mechanics. Drag the sliders and watch how each concept works.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LearningRateDemo />
        <MomentumDemo />
        <AdaptiveLRDemo />
        <BiasCorrectDemo />
      </div>
    </div>
  );
}
