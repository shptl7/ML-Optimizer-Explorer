import { useState, useMemo } from 'react';
import { Timer, TrendingDown } from 'lucide-react';

type ScheduleType = 'constant' | 'step' | 'cosine' | 'warmup_cosine' | 'exponential' | 'linear';

const schedules: Record<ScheduleType, {
  name: string;
  description: string;
  fn: (baseLr: number, step: number, totalSteps: number, params: Record<string, number>) => number;
  params: { key: string; label: string; min: number; max: number; step: number; default: number }[];
  color: string;
  useCase: string;
}> = {
  constant: {
    name: 'Constant',
    description: 'Fixed learning rate throughout training. Simplest approach.',
    fn: (baseLr) => baseLr,
    params: [],
    color: '#94a3b8',
    useCase: 'Quick experiments, simple problems',
  },
  step: {
    name: 'Step Decay',
    description: 'Multiplies LR by γ every N steps. Classic approach used in ResNet papers.',
    fn: (baseLr, step, _, params) => {
      const every = params.stepSize || 50;
      const gamma = params.gamma || 0.5;
      return baseLr * Math.pow(gamma, Math.floor(step / every));
    },
    params: [
      { key: 'stepSize', label: 'Step Size', min: 10, max: 100, step: 5, default: 50 },
      { key: 'gamma', label: 'Decay γ', min: 0.1, max: 0.9, step: 0.05, default: 0.5 },
    ],
    color: '#f97316',
    useCase: 'Image classification (ResNet, VGG)',
  },
  cosine: {
    name: 'Cosine Annealing',
    description: 'Smoothly decreases LR following a cosine curve to near zero. Very popular.',
    fn: (baseLr, step, totalSteps) => {
      return baseLr * 0.5 * (1 + Math.cos(Math.PI * step / totalSteps));
    },
    params: [],
    color: '#3b82f6',
    useCase: 'Most modern training: ViT, BERT fine-tuning',
  },
  warmup_cosine: {
    name: 'Warmup + Cosine',
    description: 'Linear warmup then cosine decay. The gold standard for transformer training.',
    fn: (baseLr, step, totalSteps, params) => {
      const warmup = params.warmup || 20;
      if (step < warmup) return baseLr * (step / warmup);
      const progress = (step - warmup) / (totalSteps - warmup);
      return baseLr * 0.5 * (1 + Math.cos(Math.PI * progress));
    },
    params: [
      { key: 'warmup', label: 'Warmup Steps', min: 5, max: 60, step: 5, default: 20 },
    ],
    color: '#8b5cf6',
    useCase: 'Transformers, LLM pre-training, GPT/BERT',
  },
  exponential: {
    name: 'Exponential Decay',
    description: 'Continuously decays LR by multiplying by γ each step.',
    fn: (baseLr, step, _, params) => {
      const gamma = params.gamma || 0.995;
      return baseLr * Math.pow(gamma, step);
    },
    params: [
      { key: 'gamma', label: 'Decay γ', min: 0.98, max: 0.999, step: 0.001, default: 0.995 },
    ],
    color: '#22c55e',
    useCase: 'GANs, reinforcement learning',
  },
  linear: {
    name: 'Linear Decay',
    description: 'Linearly decreases LR from base to zero (or min_lr).',
    fn: (baseLr, step, totalSteps, params) => {
      const minLr = params.minLr || 0;
      return baseLr - (baseLr - minLr) * (step / totalSteps);
    },
    params: [
      { key: 'minLr', label: 'Min LR', min: 0, max: 0.005, step: 0.0001, default: 0.0001 },
    ],
    color: '#14b8a6',
    useCase: 'NLP fine-tuning, simpler tasks',
  },
};

const scheduleKeys = Object.keys(schedules) as ScheduleType[];

export default function LRScheduleDemo() {
  const [selectedSchedules, setSelectedSchedules] = useState<Set<ScheduleType>>(
    new Set(['constant', 'cosine', 'warmup_cosine', 'step'])
  );
  const [baseLr, setBaseLr] = useState(0.001);
  const [totalSteps, setTotalSteps] = useState(200);
  const [params, setParams] = useState<Record<string, Record<string, number>>>({});

  const getParam = (schedType: ScheduleType, key: string) => {
    return params[schedType]?.[key] ?? schedules[schedType].params.find(p => p.key === key)?.default ?? 0;
  };

  const curves = useMemo(() => {
    return scheduleKeys.filter(k => selectedSchedules.has(k)).map(key => {
      const sched = schedules[key];
      const paramVals: Record<string, number> = {};
      sched.params.forEach(p => { paramVals[p.key] = getParam(key, p.key); });
      const points: { step: number; lr: number }[] = [];
      for (let i = 0; i <= totalSteps; i++) {
        points.push({ step: i, lr: sched.fn(baseLr, i, totalSteps, paramVals) });
      }
      return { key, sched, points };
    });
  }, [selectedSchedules, baseLr, totalSteps, params]);

  const maxLr = Math.max(baseLr, ...curves.flatMap(c => c.points.map(p => p.lr)));

  const chartW = 500, chartH = 180;
  const pad = { top: 10, right: 15, bottom: 25, left: 55 };
  const iw = chartW - pad.left - pad.right;
  const ih = chartH - pad.top - pad.bottom;

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Timer size={18} className="text-blue-400" />
        Learning Rate Schedules
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        In practice, the learning rate isn't constant — it's <em>scheduled</em> to change over training.
        Compare popular strategies and see how they affect the effective learning rate.
      </p>

      {/* Schedule toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {scheduleKeys.map(key => {
          const s = schedules[key];
          const active = selectedSchedules.has(key);
          return (
            <button
              key={key}
              onClick={() => {
                const next = new Set(selectedSchedules);
                if (next.has(key)) next.delete(key); else next.add(key);
                setSelectedSchedules(next);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active ? 'text-white border-opacity-50' : 'text-slate-500 border-slate-700 hover:border-slate-500'
              }`}
              style={{ borderColor: active ? s.color : undefined, backgroundColor: active ? s.color + '15' : undefined }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, opacity: active ? 1 : 0.3 }} />
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Global controls */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Base LR</span>
            <span className="font-mono text-amber-400">{baseLr.toFixed(4)}</span>
          </div>
          <input type="range" min={0.0001} max={0.01} step={0.0001} value={baseLr} onChange={e => setBaseLr(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Total Steps</span>
            <span className="font-mono text-blue-400">{totalSteps}</span>
          </div>
          <input type="range" min={50} max={500} step={10} value={totalSteps} onChange={e => setTotalSteps(Number(e.target.value))} className="w-full" />
        </div>
      </div>

      {/* Per-schedule params */}
      {curves.map(({ key, sched }) => sched.params.length > 0 && (
        <div key={key} className="mb-3">
          <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: sched.color }}>{sched.name} Params</p>
          <div className="grid grid-cols-2 gap-3">
            {sched.params.map(p => (
              <div key={p.key}>
                <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                  <span>{p.label}</span>
                  <span className="font-mono">{getParam(key, p.key).toFixed(p.step < 0.01 ? 4 : p.step < 0.1 ? 3 : 1)}</span>
                </div>
                <input
                  type="range"
                  min={p.min} max={p.max} step={p.step}
                  value={getParam(key, p.key)}
                  onChange={e => setParams(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [p.key]: Number(e.target.value) } }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Chart */}
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full bg-slate-900/40 rounded-lg">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.top + ih * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.left} x2={chartW - pad.right} y1={y} y2={y} stroke="#1e293b" strokeWidth="0.5" />
              <text x={pad.left - 4} y={y + 3} fill="#475569" fontSize="8" textAnchor="end">{(maxLr * t).toExponential(1)}</text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <text key={t} x={pad.left + iw * t} y={chartH - 5} fill="#475569" fontSize="8" textAnchor="middle">
            {Math.round(totalSteps * t)}
          </text>
        ))}

        {/* Curves */}
        {curves.map(({ key, sched, points }) => {
          const d = points.map((p, i) => {
            const x = pad.left + (p.step / totalSteps) * iw;
            const y = pad.top + ih * (1 - p.lr / maxLr);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ');
          return <path key={key} d={d} fill="none" stroke={sched.color} strokeWidth="2" strokeLinecap="round" />;
        })}

        <text x={chartW / 2} y={chartH - 0} fill="#475569" fontSize="9" textAnchor="middle">Training Steps</text>
        <text x={8} y={chartH / 2} fill="#475569" fontSize="9" textAnchor="middle" transform={`rotate(-90, 8, ${chartH / 2})`}>Learning Rate</text>
      </svg>

      {/* Schedule descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
        {curves.map(({ key, sched }) => (
          <div key={key} className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sched.color }} />
              <span className="text-xs font-bold text-white">{sched.name}</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-1">{sched.description}</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <TrendingDown size={10} />
              <span>{sched.useCase}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
