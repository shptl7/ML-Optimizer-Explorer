import { useState, useEffect } from 'react';
import { X, Zap, Box, Sliders, Brain, Sparkles, ArrowRight, Keyboard } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

const steps = [
  {
    icon: Box,
    title: 'Interactive 3D Visualization',
    description: 'Watch optimizers race across loss surfaces in real-time. Rotate, zoom, and explore the 3D landscape or switch to 2D contour view.',
    color: '#3b82f6',
  },
  {
    icon: Sliders,
    title: 'Tweak Hyperparameters Live',
    description: 'Adjust learning rate, momentum, β₁, β₂, and more. See instantly how changes affect convergence. Add noise to simulate mini-batch gradients.',
    color: '#f59e0b',
  },
  {
    icon: Zap,
    title: 'Compare 11 Optimizers',
    description: 'From classic SGD to modern AdamW. Each with detailed explanations, update equations, pros/cons, and PyTorch code.',
    color: '#8b5cf6',
  },
  {
    icon: Brain,
    title: 'Learn & Test Yourself',
    description: 'Interactive intuition builders, LR schedule demos, and a Quiz mode to test your optimizer identification skills.',
    color: '#ec4899',
  },
];

const shortcuts = [
  { key: 'Space', action: 'Play/Pause animation' },
  { key: '← →', action: 'Step backward/forward' },
  { key: 'R', action: 'Reset animation' },
  { key: '1-3', action: 'Switch view (3D/2D/Split)' },
  { key: 'G', action: 'Toggle gradients (2D mode)' },
];

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowShortcuts(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Welcome to ML Optimizer Explorer</h2>
              <p className="text-sm text-slate-400">Interactive visualization of optimization algorithms</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showShortcuts ? (
            <>
              {/* Feature steps */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: steps[currentStep].color + '20' }}
                  >
                    {(() => {
                      const Icon = steps[currentStep].icon;
                      return <Icon size={24} style={{ color: steps[currentStep].color }} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{steps[currentStep].title}</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </div>

              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStep ? 'w-6 bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  {currentStep < steps.length - 1 ? (
                    <>Next <ArrowRight size={14} /></>
                  ) : (
                    <>Shortcuts <Keyboard size={14} /></>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Keyboard shortcuts */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Keyboard size={20} className="text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
                </div>
                <div className="space-y-2">
                  {shortcuts.map(s => (
                    <div key={s.key} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-300">{s.action}</span>
                      <kbd className="px-2 py-1 rounded bg-slate-700 text-xs font-mono text-slate-200">{s.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-colors"
              >
                <Sparkles size={16} />
                Start Exploring
              </button>
            </>
          )}
        </div>

        {/* Don't show again */}
        <div className="px-6 pb-4">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              className="rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
              onChange={e => {
                if (e.target.checked) {
                  localStorage.setItem('hideWelcome', 'true');
                } else {
                  localStorage.removeItem('hideWelcome');
                }
              }}
            />
            Don't show this again
          </label>
        </div>
      </div>
    </div>
  );
}
