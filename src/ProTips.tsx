import { Lightbulb, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

const tips = [
  {
    category: 'Learning Rate',
    icon: Flame,
    color: '#f59e0b',
    tips: [
      { type: 'do', text: 'Start with 3e-4 for Adam/AdamW on most tasks' },
      { type: 'do', text: 'Use 0.1 with momentum 0.9 for SGD on image classification' },
      { type: 'do', text: 'Decay LR by 10x when validation loss plateaus' },
      { type: 'dont', text: "Don't use the same LR for Adam and SGD — they have different scales" },
      { type: 'tip', text: 'LR Finder: sweep from 1e-7 to 1 and pick the steepest descent point' },
    ],
  },
  {
    category: 'Optimizer Selection',
    icon: Lightbulb,
    color: '#8b5cf6',
    tips: [
      { type: 'do', text: 'Use AdamW as your default for transformers and LLMs' },
      { type: 'do', text: 'Try SGD+Momentum for CNNs if you want best generalization' },
      { type: 'do', text: 'Use Adam for RNNs/LSTMs to handle gradient scale variations' },
      { type: 'dont', text: "Don't switch optimizers mid-training without resetting state" },
      { type: 'tip', text: 'Adam trains faster but SGD often generalizes better with proper tuning' },
    ],
  },
  {
    category: 'Weight Decay',
    icon: CheckCircle,
    color: '#22c55e',
    tips: [
      { type: 'do', text: 'Use weight_decay=0.01-0.1 for AdamW on large models' },
      { type: 'do', text: 'Apply weight decay to all params except biases and LayerNorm' },
      { type: 'dont', text: "Don't use L2 regularization with Adam — use AdamW instead" },
      { type: 'tip', text: 'Higher weight decay → more regularization → smaller weights' },
    ],
  },
  {
    category: 'Warmup & Scheduling',
    icon: AlertTriangle,
    color: '#3b82f6',
    tips: [
      { type: 'do', text: 'Use linear warmup for 1-10% of total steps with Adam' },
      { type: 'do', text: 'Cosine annealing is standard for transformers and ViT' },
      { type: 'do', text: 'Step decay (÷10 at 30, 60, 90 epochs) works well for ResNet' },
      { type: 'dont', text: "Don't skip warmup for large learning rates — gradients are unstable early" },
      { type: 'tip', text: 'Warmup prevents exploding updates when moments are near zero' },
    ],
  },
  {
    category: 'Debugging',
    icon: AlertTriangle,
    color: '#ef4444',
    tips: [
      { type: 'do', text: 'Check gradient norms — they should be ~1.0 in stable training' },
      { type: 'do', text: 'Use gradient clipping (max_norm=1.0) for RNNs and transformers' },
      { type: 'dont', text: "Don't ignore NaN losses — check for div-by-zero or exploding grads" },
      { type: 'tip', text: 'If loss oscillates wildly, reduce LR by 2-10x' },
      { type: 'tip', text: 'If loss plateaus early, try increasing LR or reducing regularization' },
    ],
  },
];

export default function ProTips() {
  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Lightbulb size={18} className="text-amber-400" />
        Practical Tips from Research & Industry
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        Real-world advice for training neural networks. Based on papers, industry practice, and hard-won experience.
      </p>

      <div className="space-y-6">
        {tips.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.category}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} style={{ color: section.color }} />
                <h3 className="text-sm font-bold text-white">{section.category}</h3>
              </div>
              <div className="space-y-2 pl-6">
                {section.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {tip.type === 'do' && (
                      <span className="text-green-400 text-xs mt-0.5">✓</span>
                    )}
                    {tip.type === 'dont' && (
                      <span className="text-red-400 text-xs mt-0.5">✗</span>
                    )}
                    {tip.type === 'tip' && (
                      <span className="text-amber-400 text-xs mt-0.5">💡</span>
                    )}
                    <p className={`text-xs ${tip.type === 'dont' ? 'text-red-300/80' : tip.type === 'tip' ? 'text-amber-200/80 italic' : 'text-slate-300'}`}>
                      {tip.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick reference table */}
      <div className="mt-6 bg-slate-900/50 rounded-lg p-4">
        <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Quick Reference</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-1 px-2 text-slate-500">Task</th>
                <th className="text-left py-1 px-2 text-slate-500">Optimizer</th>
                <th className="text-left py-1 px-2 text-slate-500">LR</th>
                <th className="text-left py-1 px-2 text-slate-500">Schedule</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-1.5 px-2">ImageNet (ResNet)</td>
                <td className="py-1.5 px-2 text-orange-300">SGD + Mom</td>
                <td className="py-1.5 px-2 font-mono">0.1</td>
                <td className="py-1.5 px-2">Step ÷10 @ 30,60,90</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1.5 px-2">BERT Fine-tuning</td>
                <td className="py-1.5 px-2 text-purple-300">AdamW</td>
                <td className="py-1.5 px-2 font-mono">2e-5</td>
                <td className="py-1.5 px-2">Linear decay</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1.5 px-2">GPT Pretraining</td>
                <td className="py-1.5 px-2 text-purple-300">AdamW</td>
                <td className="py-1.5 px-2 font-mono">3e-4</td>
                <td className="py-1.5 px-2">Warmup + Cosine</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1.5 px-2">ViT Training</td>
                <td className="py-1.5 px-2 text-purple-300">AdamW</td>
                <td className="py-1.5 px-2 font-mono">1e-3</td>
                <td className="py-1.5 px-2">Warmup + Cosine</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2">GANs</td>
                <td className="py-1.5 px-2 text-blue-300">Adam</td>
                <td className="py-1.5 px-2 font-mono">2e-4</td>
                <td className="py-1.5 px-2">Constant (β₁=0.5)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
