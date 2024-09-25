import { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';
import { OptimizerInfo, OptimizerConfig, defaultConfig } from './optimizers';

interface CodeExportProps {
  selectedOptimizers: OptimizerInfo[];
  config: Partial<OptimizerConfig>;
}

function generatePyTorchCode(opt: OptimizerInfo, config: Partial<OptimizerConfig>): string {
  const lr = config.lr ?? opt.defaultLr;
  const beta1 = config.beta1 ?? defaultConfig.beta1;
  const beta2 = config.beta2 ?? defaultConfig.beta2;
  const momentum = config.momentum ?? defaultConfig.momentum;
  const wd = config.weightDecay ?? defaultConfig.weightDecay;
  const eps = defaultConfig.epsilon;

  switch (opt.id) {
    case 'sgd':
      return `optimizer = torch.optim.SGD(\n    model.parameters(),\n    lr=${lr},\n)`;
    case 'momentum':
      return `optimizer = torch.optim.SGD(\n    model.parameters(),\n    lr=${lr},\n    momentum=${momentum},\n)`;
    case 'nesterov':
      return `optimizer = torch.optim.SGD(\n    model.parameters(),\n    lr=${lr},\n    momentum=${momentum},\n    nesterov=True,\n)`;
    case 'adagrad':
      return `optimizer = torch.optim.Adagrad(\n    model.parameters(),\n    lr=${lr},\n    eps=${eps},\n)`;
    case 'adadelta':
      return `optimizer = torch.optim.Adadelta(\n    model.parameters(),\n    rho=${defaultConfig.rho},\n    eps=${eps},\n)`;
    case 'rmsprop':
      return `optimizer = torch.optim.RMSprop(\n    model.parameters(),\n    lr=${lr},\n    alpha=${beta2},\n    eps=${eps},\n)`;
    case 'adam':
      return `optimizer = torch.optim.Adam(\n    model.parameters(),\n    lr=${lr},\n    betas=(${beta1}, ${beta2}),\n    eps=${eps},\n)`;
    case 'adamw':
      return `optimizer = torch.optim.AdamW(\n    model.parameters(),\n    lr=${lr},\n    betas=(${beta1}, ${beta2}),\n    eps=${eps},\n    weight_decay=${wd},\n)`;
    case 'amsgrad':
      return `optimizer = torch.optim.Adam(\n    model.parameters(),\n    lr=${lr},\n    betas=(${beta1}, ${beta2}),\n    eps=${eps},\n    amsgrad=True,\n)`;
    case 'adamax':
      return `optimizer = torch.optim.Adamax(\n    model.parameters(),\n    lr=${lr},\n    betas=(${beta1}, ${beta2}),\n    eps=${eps},\n)`;
    case 'nadam':
      return `optimizer = torch.optim.NAdam(\n    model.parameters(),\n    lr=${lr},\n    betas=(${beta1}, ${beta2}),\n    eps=${eps},\n)`;
    default:
      return `# ${opt.name} - configure manually`;
  }
}

function generateTrainingLoop(opts: OptimizerInfo[], config: Partial<OptimizerConfig>): string {
  const mainOpt = opts[0];
  if (!mainOpt) return '';
  const code = generatePyTorchCode(mainOpt, config);

  return `import torch
import torch.nn as nn

# Model (replace with your own)
model = YourModel()
criterion = nn.CrossEntropyLoss()

# Optimizer
${code}

# Optional: Learning rate scheduler
# scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)

# Training loop
for epoch in range(num_epochs):
    for batch_x, batch_y in dataloader:
        optimizer.zero_grad()
        output = model(batch_x)
        loss = criterion(output, batch_y)
        loss.backward()
        optimizer.step()
        # scheduler.step()  # If using scheduler

    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")`;
}

export default function CodeExport({ selectedOptimizers, config }: CodeExportProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (selectedOptimizers.length === 0) return null;

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <FileCode size={18} className="text-green-400" />
        Export as PyTorch Code
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Copy ready-to-use PyTorch optimizer configurations with your current hyperparameter settings.
      </p>

      {/* Individual optimizer configs */}
      <div className="space-y-3 mb-4">
        {selectedOptimizers.map(opt => {
          const code = generatePyTorchCode(opt, config);
          return (
            <div key={opt.id} className="bg-slate-900/60 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                  <span className="text-xs font-bold text-white">{opt.name}</span>
                  <span className="text-[10px] text-slate-500">{opt.pytorchName}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(code, opt.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  {copied === opt.id ? <><Check size={10} className="text-green-400" /> Copied!</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              <pre className="p-3 text-xs font-mono text-green-300 overflow-x-auto">{code}</pre>
            </div>
          );
        })}
      </div>

      {/* Full training loop */}
      <button
        onClick={() => setShowFull(!showFull)}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors mb-2"
      >
        {showFull ? '▾ Hide' : '▸ Show'} full training loop template
      </button>

      {showFull && (
        <div className="bg-slate-900/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50">
            <span className="text-xs font-bold text-white">Full Training Loop ({selectedOptimizers[0]?.name})</span>
            <button
              onClick={() => copyToClipboard(generateTrainingLoop(selectedOptimizers, config), 'full')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              {copied === 'full' ? <><Check size={10} className="text-green-400" /> Copied!</> : <><Copy size={10} /> Copy</>}
            </button>
          </div>
          <pre className="p-3 text-[11px] font-mono text-green-300 overflow-x-auto whitespace-pre">
            {generateTrainingLoop(selectedOptimizers, config)}
          </pre>
        </div>
      )}
    </div>
  );
}
