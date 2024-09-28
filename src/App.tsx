import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, ChevronDown, ChevronUp, Zap, TrendingUp,
  Layers, Info, ArrowRight, Eye, EyeOff, Map, Box, Crosshair,
  Grid3x3, BookOpen, Code, Bug, Columns2, Brain, Share2, Keyboard
} from 'lucide-react';
import Surface3D from './Surface3D';
import ContourMap from './ContourMap';
import HyperparamPanel from './HyperparamPanel';
import Leaderboard from './Leaderboard';
import IntuitionBuilder from './IntuitionBuilder';
import StepInspector from './StepInspector';
import RadarChart from './RadarChart';
import LRScheduleDemo from './LRScheduleDemo';
import QuizMode from './QuizMode';
import CodeExport from './CodeExport';
import SplitView from './SplitView';
import HeatmapMatrix from './HeatmapMatrix';
import CustomSurface from './CustomSurface';
import WelcomeModal from './WelcomeModal';
import AlgorithmExplainer from './AlgorithmExplainer';
import ProTips from './ProTips';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { optimizers, surfaces, OptimizerInfo, OptimizerConfig, runOptimizer, SurfaceFunction, GradientFunction } from './optimizers';

const surfaceKeys = Object.keys(surfaces);

const categoryLabels: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  basic: { label: 'Basic', icon: Zap, color: 'from-red-500 to-orange-500' },
  momentum: { label: 'Momentum-Based', icon: TrendingUp, color: 'from-orange-500 to-yellow-500' },
  adaptive: { label: 'Adaptive Learning Rate', icon: Layers, color: 'from-blue-500 to-purple-500' },
};

// Compact Optimizer Card
function OptimizerCard({ optimizer, isSelected, onToggle, isExpanded, onExpand }: {
  optimizer: OptimizerInfo; isSelected: boolean; onToggle: () => void; isExpanded: boolean; onExpand: () => void;
}) {
  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isSelected ? 'border-opacity-60 shadow-lg shadow-black/20' : 'border-slate-700/50 hover:border-slate-600'}`}
      style={{ borderColor: isSelected ? optimizer.color : undefined, background: isSelected ? `linear-gradient(135deg, ${optimizer.color}10, transparent)` : undefined }}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={onToggle} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? 'border-transparent' : 'border-slate-500'}`} style={{ backgroundColor: isSelected ? optimizer.color : 'transparent' }}>
              {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{optimizer.name}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">{optimizer.year}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{optimizer.fullName}</p>
            </div>
          </div>
          <button onClick={onExpand} className="text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-slate-700/50 pt-2.5">
          <p className="text-xs text-slate-300">{optimizer.description}</p>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
            <p className="text-[10px] text-amber-500/80 font-medium uppercase tracking-wider mb-0.5">💡 Key Insight</p>
            <p className="text-xs text-amber-200/80">{optimizer.keyInsight}</p>
          </div>
          <div className="bg-slate-900/80 rounded-lg p-2.5">
            <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap">{optimizer.equation}</pre>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-2.5 py-1.5">
            <Code size={12} className="text-green-400" />
            <code className="text-[11px] text-green-300 font-mono">{optimizer.pytorchName}</code>
          </div>
        </div>
      )}
    </div>
  );
}

// Loss Chart with hover
function LossChart({ selectedOptimizers, surfaceKey, maxSteps, animStep, config, customStart }: {
  selectedOptimizers: OptimizerInfo[]; surfaceKey: string; maxSteps: number; animStep: number;
  config: Partial<OptimizerConfig>; customStart?: { x: number; y: number } | null;
}) {
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  const paths = useMemo(() => selectedOptimizers.map(opt => ({
    optimizer: opt,
    path: runOptimizer(opt, surfaceKey, maxSteps, config, customStart ?? undefined),
  })), [selectedOptimizers, surfaceKey, maxSteps, config, customStart]);

  const allZs = paths.flatMap(p => p.path.map(pt => pt.z));
  const maxZ = Math.max(...allZs, 0.1), minZ = Math.min(...allZs, 0);
  const chartW = 500, chartH = 170, pad = { top: 10, right: 15, bottom: 25, left: 50 };
  const iw = chartW - pad.left - pad.right, ih = chartH - pad.top - pad.bottom;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (chartW / rect.width) - pad.left;
    const step = Math.round((px / iw) * maxSteps);
    setHoverStep(step >= 0 && step <= maxSteps ? step : null);
  };

  const displayStep = hoverStep ?? animStep;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <TrendingUp size={14} />Loss Over Steps
        {hoverStep !== null && <span className="text-[10px] text-slate-500 font-normal ml-2">Step {hoverStep}</span>}
      </h3>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full cursor-crosshair" style={{ maxHeight: '200px' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverStep(null)}>
        {[0, 0.5, 1].map(t => <line key={t} x1={pad.left} x2={chartW - pad.right} y1={pad.top + ih * (1 - t)} y2={pad.top + ih * (1 - t)} stroke="#334155" strokeWidth="0.5" />)}
        <line x1={pad.left + (displayStep / maxSteps) * iw} x2={pad.left + (displayStep / maxSteps) * iw} y1={pad.top} y2={pad.top + ih} stroke={hoverStep !== null ? '#f59e0b' : '#475569'} strokeWidth="1" strokeDasharray="3,3" />
        {paths.map(({ optimizer, path }) => {
          const d = path.slice(0, animStep + 1).map((p, i) => `${i === 0 ? 'M' : 'L'}${pad.left + (i / maxSteps) * iw},${pad.top + ih * (1 - (p.z - minZ) / (maxZ - minZ || 1))}`).join(' ');
          return <path key={optimizer.id} d={d} fill="none" stroke={optimizer.color} strokeWidth="2" strokeLinecap="round" />;
        })}
        {hoverStep !== null && paths.map(({ optimizer, path }) => {
          const pt = path[hoverStep];
          if (!pt) return null;
          return <circle key={optimizer.id} cx={pad.left + (hoverStep / maxSteps) * iw} cy={pad.top + ih * (1 - (pt.z - minZ) / (maxZ - minZ || 1))} r="4" fill={optimizer.color} stroke="#0f172a" strokeWidth="1.5" />;
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2">
        {paths.map(({ optimizer, path }) => (
          <div key={optimizer.id} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: optimizer.color }} />
            <span className="text-[11px] text-slate-400">{optimizer.name}: <span className="text-white font-mono">{(path[Math.min(displayStep, path.length - 1)]?.z ?? 0).toFixed(4)}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Share URL component
function ShareUrl({ selectedIds, surfaceKey, config }: { selectedIds: Set<string>; surfaceKey: string; config: Partial<OptimizerConfig> }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('opts', Array.from(selectedIds).join(','));
    params.set('surface', surfaceKey);
    if (config.lr) params.set('lr', String(config.lr));
    if (config.momentum) params.set('mom', String(config.momentum));
    if (config.beta1) params.set('b1', String(config.beta1));
    if (config.beta2) params.set('b2', String(config.beta2));
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [selectedIds, surfaceKey, config]);

  const copy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
      <Share2 size={12} />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}

// ============== MAIN APP ==============
export default function App() {
  // Check for welcome modal
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('hideWelcome'));
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['sgd', 'momentum', 'adam']));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [surfaceKey, setSurfaceKey] = useState('rosenbrock');
  const [maxSteps] = useState(200);
  const [animStep, setAnimStep] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showPanel, setShowPanel] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'contour' | 'split'>('3d');
  const [showGradients, setShowGradients] = useState(false);
  const [customStart, setCustomStart] = useState<{ x: number; y: number } | null>(null);
  const [hyperConfig, setHyperConfig] = useState<Partial<OptimizerConfig>>({});
  const [activeTab, setActiveTab] = useState<'viz' | 'learn' | 'compare' | 'quiz'>('viz');
  const [inspectorOptId, setInspectorOptId] = useState<string | null>(null);
  const [customSurface, setCustomSurface] = useState<{ fn: SurfaceFunction; grad: GradientFunction; name: string } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const selectedOptimizers = optimizers.filter(o => selectedIds.has(o.id));
  const inspectorOpt = optimizers.find(o => o.id === inspectorOptId) ?? null;
  const splitLeft = useMemo(() => selectedOptimizers.filter((_, i) => i % 2 === 0), [selectedOptimizers]);
  const splitRight = useMemo(() => selectedOptimizers.filter((_, i) => i % 2 === 1), [selectedOptimizers]);

  // Handle custom surface
  const activeSurfaceKey = customSurface ? 'custom' : surfaceKey;
  const activeSurfaces = useMemo(() => {
    if (customSurface) {
      return {
        ...surfaces,
        custom: {
          name: customSurface.name,
          fn: customSurface.fn,
          grad: customSurface.grad,
          description: 'Your custom loss function',
          startX: 3,
          startY: 3,
          rangeX: [-4, 4] as [number, number],
          rangeY: [-4, 4] as [number, number],
          scale: 0.1,
        },
      };
    }
    return surfaces;
  }, [customSurface]);

  const toggleOptimizer = useCallback((id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const resetAnimation = useCallback(() => { setAnimStep(0); setIsPlaying(true); }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => { if (animStep >= maxSteps) resetAnimation(); else setIsPlaying(p => !p); },
    onReset: resetAnimation,
    onStepForward: () => { setAnimStep(s => Math.min(s + 1, maxSteps)); setIsPlaying(false); },
    onStepBackward: () => { setAnimStep(s => Math.max(s - 1, 0)); setIsPlaying(false); },
    onView3D: () => setViewMode('3d'),
    onViewContour: () => setViewMode('contour'),
    onViewSplit: () => setViewMode('split'),
    onToggleGradients: () => setShowGradients(g => !g),
  }, activeTab === 'viz');

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setAnimStep(prev => { if (prev >= maxSteps) { setIsPlaying(false); return maxSteps; } return prev + speed; });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isPlaying, maxSteps, speed]);

  useEffect(() => { setAnimStep(0); setIsPlaying(true); setCustomStart(null); }, [surfaceKey]);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const opts = params.get('opts');
    if (opts) setSelectedIds(new Set(opts.split(',')));
    const surf = params.get('surface');
    if (surf && surfaces[surf]) setSurfaceKey(surf);
    const lr = params.get('lr');
    if (lr) setHyperConfig(c => ({ ...c, lr: parseFloat(lr) }));
  }, []);

  const categories = ['basic', 'momentum', 'adaptive'] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {/* Header */}
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap size={22} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                  ML Optimizer Explorer
                </h1>
              </div>
              <p className="text-slate-400 text-sm max-w-xl">
                Interactive visualization of optimization algorithms with 3D surfaces, live hyperparameters, and deep learning insights.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setShowShortcuts(!showShortcuts)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white">
                <Keyboard size={12} />Shortcuts
              </button>
              <ShareUrl selectedIds={selectedIds} surfaceKey={surfaceKey} config={hyperConfig} />
              <button onClick={() => setShowWelcome(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white">
                <Info size={12} />Help
              </button>
            </div>
          </div>
          {showShortcuts && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[['Space', 'Play/Pause'], ['←→', 'Step'], ['R', 'Reset'], ['1-3', 'Views'], ['G', 'Gradients']].map(([k, a]) => (
                <div key={k} className="flex items-center gap-1 text-[10px] bg-slate-800/50 px-2 py-1 rounded">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono">{k}</kbd>
                  <span className="text-slate-500">{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[{ id: 'viz' as const, label: 'Playground', icon: Box }, { id: 'learn' as const, label: 'Learn', icon: BookOpen }, { id: 'compare' as const, label: 'Compare', icon: Grid3x3 }, { id: 'quiz' as const, label: 'Quiz', icon: Brain }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <tab.icon size={15} />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 py-5">
        {/* ===== PLAYGROUND ===== */}
        {activeTab === 'viz' && (
          <>
            <div className="mb-5">
              <label className="block text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-medium">Loss Surface</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(activeSurfaces).map(key => (
                  <button key={key} onClick={() => { setSurfaceKey(key); if (key !== 'custom') setCustomSurface(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeSurfaceKey === key ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                    {activeSurfaces[key].name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{activeSurfaces[activeSurfaceKey]?.description}</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-5">
              <div className="flex-1 min-w-0 space-y-3">
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
                  <button onClick={() => { if (animStep >= maxSteps) resetAnimation(); else setIsPlaying(!isPlaying); }} className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={resetAnimation} className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"><RotateCcw size={16} /></button>
                  <input type="range" min={0} max={maxSteps} value={animStep} onChange={e => { setAnimStep(Number(e.target.value)); setIsPlaying(false); }} className="flex-1 min-w-[100px]" />
                  <span className="text-[11px] text-slate-400 font-mono w-14 text-right">{animStep}/{maxSteps}</span>
                  <div className="flex gap-1">{[1, 2, 4].map(s => <button key={s} onClick={() => setSpeed(s)} className={`text-[10px] px-1.5 py-0.5 rounded ${speed === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{s}x</button>)}</div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="flex bg-slate-800 rounded-lg p-0.5">
                    {([['3d', Box], ['contour', Map], ['split', Columns2]] as const).map(([m, I]) => (
                      <button key={m} onClick={() => setViewMode(m)} className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] ${viewMode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><I size={12} /></button>
                    ))}
                  </div>
                  {viewMode === 'contour' && <>
                    <button onClick={() => setShowGradients(!showGradients)} className={`px-2 py-1 rounded text-[11px] ${showGradients ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}><ArrowRight size={12} /></button>
                    <button onClick={() => setCustomStart(null)} className="px-2 py-1 rounded text-[11px] bg-slate-700 text-slate-400 hover:text-white"><Crosshair size={12} /></button>
                  </>}
                  <button onClick={() => setShowPanel(!showPanel)} className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center xl:hidden">
                    {showPanel ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Visualization */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden" style={{ height: viewMode === '3d' ? '500px' : 'auto' }}>
                  {selectedOptimizers.length > 0 ? (
                    viewMode === '3d' ? <Surface3D surfaceKey={activeSurfaceKey} selectedOptimizers={selectedOptimizers} animStep={animStep} maxSteps={maxSteps} config={hyperConfig} customStart={customStart} /> :
                    viewMode === 'contour' ? <ContourMap surfaceKey={activeSurfaceKey} selectedOptimizers={selectedOptimizers} animStep={animStep} maxSteps={maxSteps} config={hyperConfig} customStart={customStart} onClickStart={(x, y) => { setCustomStart({ x, y }); resetAnimation(); }} showGradients={showGradients} /> :
                    <SplitView surfaceKey={activeSurfaceKey} leftOptimizers={splitLeft} rightOptimizers={splitRight} animStep={animStep} maxSteps={maxSteps} config={hyperConfig} customStart={customStart} />
                  ) : <div className="w-full h-full min-h-[300px] flex items-center justify-center text-slate-500"><Layers size={48} className="opacity-30" /></div>}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3">
                  {selectedOptimizers.map(opt => <div key={opt.id} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} /><span className="text-xs text-slate-300">{opt.name}</span></div>)}
                </div>

                {selectedOptimizers.length > 0 && <LossChart selectedOptimizers={selectedOptimizers} surfaceKey={activeSurfaceKey} maxSteps={maxSteps} animStep={animStep} config={hyperConfig} customStart={customStart} />}

                {/* Step Inspector */}
                <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-white">Step Inspector</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedOptimizers.map(opt => (
                      <button key={opt.id} onClick={() => setInspectorOptId(inspectorOptId === opt.id ? null : opt.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${inspectorOptId === opt.id ? 'text-white border-opacity-50' : 'text-slate-500 border-slate-700'}`}
                        style={{ borderColor: inspectorOptId === opt.id ? opt.color : undefined, backgroundColor: inspectorOptId === opt.id ? opt.color + '20' : undefined }}>{opt.name}</button>
                    ))}
                  </div>
                  {inspectorOpt && <StepInspector optimizer={inspectorOpt} surfaceKey={activeSurfaceKey} maxSteps={maxSteps} config={hyperConfig} customStart={customStart} />}
                  {inspectorOpt && <AlgorithmExplainer optimizer={inspectorOpt} />}
                </div>

                <HyperparamPanel config={hyperConfig} onChange={c => { setHyperConfig(c); resetAnimation(); }} onReset={() => { setHyperConfig({}); resetAnimation(); }} />
                <CustomSurface onApply={(fn, grad, name) => { setCustomSurface({ fn, grad, name }); setSurfaceKey('custom'); resetAnimation(); }} onReset={() => { setCustomSurface(null); setSurfaceKey('rosenbrock'); }} />
                <CodeExport selectedOptimizers={selectedOptimizers} config={hyperConfig} />
              </div>

              {/* Side Panel */}
              <div className={`xl:w-[340px] flex-shrink-0 space-y-3 ${showPanel ? '' : 'hidden xl:block'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Optimizers</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedIds(new Set(optimizers.map(o => o.id)))} className="text-[11px] text-blue-400 hover:text-blue-300">All</button>
                    <span className="text-slate-600">|</span>
                    <button onClick={() => setSelectedIds(new Set())} className="text-[11px] text-slate-400 hover:text-slate-300">Clear</button>
                  </div>
                </div>
                <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-1 space-y-3">
                  {categories.map(cat => {
                    const catOpts = optimizers.filter(o => o.category === cat);
                    const { label, icon: Icon, color } = categoryLabels[cat];
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-950/80 backdrop-blur py-1 z-10">
                          <Icon size={12} className="text-slate-400" />
                          <span className={`text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{label}</span>
                        </div>
                        <div className="space-y-1.5">
                          {catOpts.map(opt => <OptimizerCard key={opt.id} optimizer={opt} isSelected={selectedIds.has(opt.id)} onToggle={() => toggleOptimizer(opt.id)} isExpanded={expandedId === opt.id} onExpand={() => setExpandedId(expandedId === opt.id ? null : opt.id)} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== LEARN ===== */}
        {activeTab === 'learn' && (
          <div className="space-y-8">
            <IntuitionBuilder />
            <LRScheduleDemo />
            <ProTips />
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Info size={20} />Evolution of Optimizers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800"><p className="text-sm font-bold text-red-400 mb-2">Era 1: Foundations (1951–1983)</p><p className="text-xs text-slate-400">SGD → Momentum → Nesterov. From basic gradient descent to physics-inspired acceleration.</p></div>
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800"><p className="text-sm font-bold text-blue-400 mb-2">Era 2: Adaptive (2011–2014)</p><p className="text-xs text-slate-400">Adagrad → RMSProp → Adam. Per-parameter learning rates revolutionized training.</p></div>
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800"><p className="text-sm font-bold text-purple-400 mb-2">Era 3: Refinements (2016+)</p><p className="text-xs text-slate-400">NAdam → AdamW → AMSGrad. Fixing edge cases, improving generalization.</p></div>
              </div>
            </div>
          </div>
        )}

        {/* ===== COMPARE ===== */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-medium">Surface</label>
                <div className="flex flex-wrap gap-1.5">
                  {surfaceKeys.map(k => <button key={k} onClick={() => setSurfaceKey(k)} className={`px-2.5 py-1 rounded text-[11px] font-medium ${surfaceKey === k ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{surfaces[k].name}</button>)}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-medium">Presets</label>
                <div className="flex gap-1.5">
                  {[{ l: 'All', ids: optimizers.map(o => o.id) }, { l: 'Popular', ids: ['sgd', 'momentum', 'adam', 'adamw'] }, { l: 'Adam+', ids: ['adam', 'adamw', 'nadam', 'amsgrad'] }].map(p => (
                    <button key={p.l} onClick={() => setSelectedIds(new Set(p.ids))} className="px-2.5 py-1 rounded text-[11px] bg-slate-800 text-slate-400 hover:text-white">{p.l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {optimizers.map(opt => (
                <button key={opt.id} onClick={() => toggleOptimizer(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${selectedIds.has(opt.id) ? 'text-white' : 'text-slate-500 border-slate-700'}`}
                  style={{ borderColor: selectedIds.has(opt.id) ? opt.color : undefined, backgroundColor: selectedIds.has(opt.id) ? opt.color + '15' : undefined }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color, opacity: selectedIds.has(opt.id) ? 1 : 0.3 }} />{opt.name}
                </button>
              ))}
            </div>
            {selectedOptimizers.length >= 2 && <RadarChart selectedOptimizers={selectedOptimizers} maxSteps={maxSteps} config={hyperConfig} />}
            {selectedOptimizers.length >= 2 && <HeatmapMatrix selectedOptimizers={selectedOptimizers} maxSteps={maxSteps} config={hyperConfig} />}
            {selectedOptimizers.length > 0 && <Leaderboard selectedOptimizers={selectedOptimizers} surfaceKey={surfaceKey} maxSteps={maxSteps} config={hyperConfig} customStart={customStart} />}
            <CodeExport selectedOptimizers={selectedOptimizers} config={hyperConfig} />
          </div>
        )}

        {/* ===== QUIZ ===== */}
        {activeTab === 'quiz' && <QuizMode />}
      </main>

      <footer className="border-t border-slate-800 py-6 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
          <span>ML Optimizer Explorer — Interactive visualization of optimization algorithms</span>
          <span className="text-xs text-slate-600">{optimizers.length} optimizers · {surfaceKeys.length} surfaces · React + Three.js</span>
        </div>
      </footer>
    </div>
  );
}
