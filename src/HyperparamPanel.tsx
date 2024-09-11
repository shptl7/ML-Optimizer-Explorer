import { Settings, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { OptimizerConfig, defaultConfig } from './optimizers';

interface HyperparamPanelProps {
  config: Partial<OptimizerConfig>;
  onChange: (config: Partial<OptimizerConfig>) => void;
  onReset: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v: number) => v.toFixed(4),
  color = '#3b82f6',
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  color?: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
      {hint && <p className="text-[10px] text-slate-600 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function HyperparamPanel({ config, onChange, onReset }: HyperparamPanelProps) {
  const lr = config.lr ?? defaultConfig.lr;
  const beta1 = config.beta1 ?? defaultConfig.beta1;
  const beta2 = config.beta2 ?? defaultConfig.beta2;
  const momentum = config.momentum ?? defaultConfig.momentum;
  const weightDecay = config.weightDecay ?? defaultConfig.weightDecay;
  const noiseScale = config.noiseScale ?? defaultConfig.noiseScale;

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings size={14} className="text-slate-400" />
          Hyperparameters
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      <Slider
        label="Learning Rate (α)"
        value={lr}
        min={0.0001}
        max={0.5}
        step={0.0001}
        onChange={v => onChange({ ...config, lr: v })}
        format={v => v.toFixed(4)}
        color="#f59e0b"
        hint="Step size. Controls how far each update moves."
      />

      <Slider
        label="Momentum (γ)"
        value={momentum}
        min={0}
        max={0.99}
        step={0.01}
        onChange={v => onChange({ ...config, momentum: v })}
        format={v => v.toFixed(2)}
        color="#f97316"
        hint="For SGD/NAG. How much past velocity to keep."
      />

      <Slider
        label="β₁ (1st moment decay)"
        value={beta1}
        min={0.5}
        max={0.999}
        step={0.001}
        onChange={v => onChange({ ...config, beta1: v })}
        format={v => v.toFixed(3)}
        color="#8b5cf6"
        hint="For Adam/AdamW. Controls momentum averaging."
      />

      <Slider
        label="β₂ (2nd moment decay)"
        value={beta2}
        min={0.9}
        max={0.9999}
        step={0.0001}
        onChange={v => onChange({ ...config, beta2: v })}
        format={v => v.toFixed(4)}
        color="#3b82f6"
        hint="For Adam/RMSProp. Controls adaptive LR averaging."
      />

      <Slider
        label="Weight Decay (λ)"
        value={weightDecay}
        min={0}
        max={0.1}
        step={0.001}
        onChange={v => onChange({ ...config, weightDecay: v })}
        format={v => v.toFixed(3)}
        color="#14b8a6"
        hint="For AdamW. L2 regularization strength."
      />

      <div className="border-t border-slate-700/50 pt-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            {noiseScale > 0 ? <Volume2 size={12} className="text-amber-400" /> : <VolumeX size={12} />}
            Gradient Noise
          </span>
          <span className="text-xs font-mono text-amber-400">{noiseScale.toFixed(3)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.005}
          value={noiseScale}
          onChange={e => onChange({ ...config, noiseScale: Number(e.target.value) })}
          className="w-full"
        />
        <p className="text-[10px] text-slate-600 mt-0.5">
          Simulates mini-batch stochastic gradients. See how optimizers handle noise differently.
        </p>
      </div>
    </div>
  );
}
