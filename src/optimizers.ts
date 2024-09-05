// Loss surface functions
export type SurfaceFunction = (x: number, y: number) => number;
export type GradientFunction = (x: number, y: number) => [number, number];

export interface SurfaceConfig {
  name: string;
  fn: SurfaceFunction;
  grad: GradientFunction;
  description: string;
  startX: number;
  startY: number;
  rangeX: [number, number];
  rangeY: [number, number];
  scale: number;
  minimumLabel?: string;
}

export const surfaces: Record<string, SurfaceConfig> = {
  beale: {
    name: "Beale Function",
    fn: (x, y) => {
      const a = (1.5 - x + x * y) ** 2;
      const b = (2.25 - x + x * y ** 2) ** 2;
      const c = (2.625 - x + x * y ** 3) ** 2;
      return (a + b + c) * 0.01;
    },
    grad: (x, y) => {
      const da = 2 * (1.5 - x + x * y) * (-1 + y);
      const db = 2 * (2.25 - x + x * y ** 2) * (-1 + y ** 2);
      const dc = 2 * (2.625 - x + x * y ** 3) * (-1 + y ** 3);
      const dx = (da + db + dc) * 0.01;
      const ga = 2 * (1.5 - x + x * y) * x;
      const gb = 2 * (2.25 - x + x * y ** 2) * (2 * x * y);
      const gc = 2 * (2.625 - x + x * y ** 3) * (3 * x * y ** 2);
      const dy = (ga + gb + gc) * 0.01;
      return [dx, dy];
    },
    description: "A multi-modal surface with a single global minimum at (3, 0.5). Tests optimizer ability to navigate narrow valleys.",
    minimumLabel: "Min at (3, 0.5)",
    startX: -3,
    startY: -3,
    rangeX: [-4.5, 4.5],
    rangeY: [-4.5, 4.5],
    scale: 0.005,
  },
  rosenbrock: {
    name: "Rosenbrock Function",
    fn: (x, y) => {
      return ((1 - x) ** 2 + 100 * (y - x ** 2) ** 2) * 0.001;
    },
    grad: (x, y) => {
      const dx = (-2 * (1 - x) - 400 * x * (y - x ** 2)) * 0.001;
      const dy = (200 * (y - x ** 2)) * 0.001;
      return [dx, dy];
    },
    description: "The classic 'banana valley' — minimum at (1,1). Tests navigating long, narrow, parabolic valleys.",
    minimumLabel: "Min at (1, 1)",
    startX: -2,
    startY: 2,
    rangeX: [-3, 3],
    rangeY: [-3, 3],
    scale: 0.003,
  },
  himmelblau: {
    name: "Himmelblau Function",
    fn: (x, y) => {
      return ((x ** 2 + y - 11) ** 2 + (x + y ** 2 - 7) ** 2) * 0.005;
    },
    grad: (x, y) => {
      const dx = (4 * x * (x ** 2 + y - 11) + 2 * (x + y ** 2 - 7)) * 0.005;
      const dy = (2 * (x ** 2 + y - 11) + 4 * y * (x + y ** 2 - 7)) * 0.005;
      return [dx, dy];
    },
    description: "Has four identical local minima. Tests optimizer's path selection among equally valid solutions.",
    minimumLabel: "4 minima",
    startX: -4,
    startY: -4,
    rangeX: [-5, 5],
    rangeY: [-5, 5],
    scale: 0.003,
  },
  saddle: {
    name: "Saddle Point",
    fn: (x, y) => {
      return (x ** 2 - y ** 2) * 0.1 + 2;
    },
    grad: (x, y) => {
      return [2 * x * 0.1, -2 * y * 0.1];
    },
    description: "A classic saddle point at origin. Tests optimizer's ability to escape saddle points — a common challenge in deep learning.",
    minimumLabel: "Saddle at (0, 0)",
    startX: 0.1,
    startY: 0.1,
    rangeX: [-4, 4],
    rangeY: [-4, 4],
    scale: 0.1,
  },
  rastrigin: {
    name: "Rastrigin Function",
    fn: (x, y) => {
      const A = 10;
      return (A * 2 + (x ** 2 - A * Math.cos(2 * Math.PI * x)) + (y ** 2 - A * Math.cos(2 * Math.PI * y))) * 0.03;
    },
    grad: (x, y) => {
      const A = 10;
      const dx = (2 * x + A * 2 * Math.PI * Math.sin(2 * Math.PI * x)) * 0.03;
      const dy = (2 * y + A * 2 * Math.PI * Math.sin(2 * Math.PI * y)) * 0.03;
      return [dx, dy];
    },
    description: "Highly multi-modal with many local minima. Tests robustness to local traps — relates to complex loss landscapes.",
    minimumLabel: "Min at (0, 0)",
    startX: 3,
    startY: 3,
    rangeX: [-4, 4],
    rangeY: [-4, 4],
    scale: 0.02,
  },
  ackley: {
    name: "Ackley Function",
    fn: (x, y) => {
      const a = 20, b = 0.2, c = 2 * Math.PI;
      return (-a * Math.exp(-b * Math.sqrt(0.5 * (x * x + y * y))) -
        Math.exp(0.5 * (Math.cos(c * x) + Math.cos(c * y))) + a + Math.E) * 0.1;
    },
    grad: (x, y) => {
      const a = 20, b = 0.2, c = 2 * Math.PI;
      const r = Math.sqrt(0.5 * (x * x + y * y)) + 1e-10;
      const expR = Math.exp(-b * r);
      const expCos = Math.exp(0.5 * (Math.cos(c * x) + Math.cos(c * y)));
      const dx = (a * b * expR * (0.5 * x / r) + expCos * 0.5 * c * Math.sin(c * x)) * 0.1;
      const dy = (a * b * expR * (0.5 * y / r) + expCos * 0.5 * c * Math.sin(c * y)) * 0.1;
      return [dx, dy];
    },
    description: "Nearly flat outer region with a deep central hole. Tests ability to find the needle-in-haystack global minimum.",
    minimumLabel: "Min at (0, 0)",
    startX: 3,
    startY: 3,
    rangeX: [-4, 4],
    rangeY: [-4, 4],
    scale: 0.05,
  },
  sphere: {
    name: "Sphere (Convex)",
    fn: (x, y) => {
      return (x * x + y * y) * 0.1;
    },
    grad: (x, y) => {
      return [2 * x * 0.1, 2 * y * 0.1];
    },
    description: "The simplest convex function. All optimizers should converge. Compare their speed and path efficiency.",
    minimumLabel: "Min at (0, 0)",
    startX: 3.5,
    startY: 3.5,
    rangeX: [-4, 4],
    rangeY: [-4, 4],
    scale: 0.1,
  },
};

// Optimizer state interfaces
export interface OptimizerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mx: number;
  my: number;
  sx: number;
  sy: number;
  t: number;
  eg2x: number;
  eg2y: number;
  edx2x: number;
  edx2y: number;
  // for AMSGrad
  sxMax: number;
  syMax: number;
}

export function createOptimizerState(x: number, y: number): OptimizerState {
  return { x, y, vx: 0, vy: 0, mx: 0, my: 0, sx: 0, sy: 0, t: 0, eg2x: 0, eg2y: 0, edx2x: 0, edx2y: 0, sxMax: 0, syMax: 0 };
}

export interface OptimizerConfig {
  lr: number;
  beta1: number;
  beta2: number;
  epsilon: number;
  momentum: number;
  rho: number;
  weightDecay: number;
  noiseScale: number;
}

export const defaultConfig: OptimizerConfig = {
  lr: 0.01,
  beta1: 0.9,
  beta2: 0.999,
  epsilon: 1e-8,
  momentum: 0.9,
  rho: 0.95,
  weightDecay: 0.01,
  noiseScale: 0,
};

export type OptimizerStep = (
  state: OptimizerState,
  grad: [number, number],
  config: OptimizerConfig
) => OptimizerState;

// SGD
export const sgdStep: OptimizerStep = (state, [gx, gy], config) => {
  return {
    ...state,
    x: state.x - config.lr * gx,
    y: state.y - config.lr * gy,
    t: state.t + 1,
  };
};

// SGD with Momentum
export const momentumStep: OptimizerStep = (state, [gx, gy], config) => {
  const vx = config.momentum * state.vx + gx;
  const vy = config.momentum * state.vy + gy;
  return {
    ...state,
    x: state.x - config.lr * vx,
    y: state.y - config.lr * vy,
    vx,
    vy,
    t: state.t + 1,
  };
};

// Nesterov Accelerated Gradient
export const nesterovStep: OptimizerStep = (state, [gx, gy], config) => {
  const vx = config.momentum * state.vx + config.lr * gx;
  const vy = config.momentum * state.vy + config.lr * gy;
  return {
    ...state,
    x: state.x - (config.momentum * vx + config.lr * gx),
    y: state.y - (config.momentum * vy + config.lr * gy),
    vx,
    vy,
    t: state.t + 1,
  };
};

// Adagrad
export const adagradStep: OptimizerStep = (state, [gx, gy], config) => {
  const sx = state.sx + gx * gx;
  const sy = state.sy + gy * gy;
  return {
    ...state,
    x: state.x - config.lr * gx / (Math.sqrt(sx) + config.epsilon),
    y: state.y - config.lr * gy / (Math.sqrt(sy) + config.epsilon),
    sx,
    sy,
    t: state.t + 1,
  };
};

// Adadelta
export const adadeltaStep: OptimizerStep = (state, [gx, gy], config) => {
  const rho = config.rho;
  const eps = config.epsilon;
  const eg2x = rho * state.eg2x + (1 - rho) * gx * gx;
  const eg2y = rho * state.eg2y + (1 - rho) * gy * gy;
  const dxVal = -(Math.sqrt(state.edx2x + eps) / Math.sqrt(eg2x + eps)) * gx;
  const dyVal = -(Math.sqrt(state.edx2y + eps) / Math.sqrt(eg2y + eps)) * gy;
  const edx2x = rho * state.edx2x + (1 - rho) * dxVal * dxVal;
  const edx2y = rho * state.edx2y + (1 - rho) * dyVal * dyVal;
  return {
    ...state,
    x: state.x + dxVal,
    y: state.y + dyVal,
    eg2x, eg2y, edx2x, edx2y,
    t: state.t + 1,
  };
};

// RMSProp
export const rmspropStep: OptimizerStep = (state, [gx, gy], config) => {
  const sx = config.beta2 * state.sx + (1 - config.beta2) * gx * gx;
  const sy = config.beta2 * state.sy + (1 - config.beta2) * gy * gy;
  return {
    ...state,
    x: state.x - config.lr * gx / (Math.sqrt(sx) + config.epsilon),
    y: state.y - config.lr * gy / (Math.sqrt(sy) + config.epsilon),
    sx,
    sy,
    t: state.t + 1,
  };
};

// Adam
export const adamStep: OptimizerStep = (state, [gx, gy], config) => {
  const t = state.t + 1;
  const mx = config.beta1 * state.mx + (1 - config.beta1) * gx;
  const my = config.beta1 * state.my + (1 - config.beta1) * gy;
  const sx = config.beta2 * state.sx + (1 - config.beta2) * gx * gx;
  const sy = config.beta2 * state.sy + (1 - config.beta2) * gy * gy;
  const mxHat = mx / (1 - config.beta1 ** t);
  const myHat = my / (1 - config.beta1 ** t);
  const sxHat = sx / (1 - config.beta2 ** t);
  const syHat = sy / (1 - config.beta2 ** t);
  return {
    ...state,
    x: state.x - config.lr * mxHat / (Math.sqrt(sxHat) + config.epsilon),
    y: state.y - config.lr * myHat / (Math.sqrt(syHat) + config.epsilon),
    mx, my, sx, sy, t,
  };
};

// AdamW (Adam with decoupled weight decay)
export const adamwStep: OptimizerStep = (state, [gx, gy], config) => {
  const t = state.t + 1;
  const mx = config.beta1 * state.mx + (1 - config.beta1) * gx;
  const my = config.beta1 * state.my + (1 - config.beta1) * gy;
  const sx = config.beta2 * state.sx + (1 - config.beta2) * gx * gx;
  const sy = config.beta2 * state.sy + (1 - config.beta2) * gy * gy;
  const mxHat = mx / (1 - config.beta1 ** t);
  const myHat = my / (1 - config.beta1 ** t);
  const sxHat = sx / (1 - config.beta2 ** t);
  const syHat = sy / (1 - config.beta2 ** t);
  return {
    ...state,
    x: state.x - config.lr * (mxHat / (Math.sqrt(sxHat) + config.epsilon) + config.weightDecay * state.x),
    y: state.y - config.lr * (myHat / (Math.sqrt(syHat) + config.epsilon) + config.weightDecay * state.y),
    mx, my, sx, sy, t,
  };
};

// AMSGrad
export const amsgradStep: OptimizerStep = (state, [gx, gy], config) => {
  const t = state.t + 1;
  const mx = config.beta1 * state.mx + (1 - config.beta1) * gx;
  const my = config.beta1 * state.my + (1 - config.beta1) * gy;
  const sx = config.beta2 * state.sx + (1 - config.beta2) * gx * gx;
  const sy = config.beta2 * state.sy + (1 - config.beta2) * gy * gy;
  const sxMax = Math.max(state.sxMax, sx);
  const syMax = Math.max(state.syMax, sy);
  const mxHat = mx / (1 - config.beta1 ** t);
  const myHat = my / (1 - config.beta1 ** t);
  return {
    ...state,
    x: state.x - config.lr * mxHat / (Math.sqrt(sxMax) + config.epsilon),
    y: state.y - config.lr * myHat / (Math.sqrt(syMax) + config.epsilon),
    mx, my, sx, sy, sxMax, syMax, t,
  };
};

// AdaMax
export const adamaxStep: OptimizerStep = (state, [gx, gy], config) => {
  const t = state.t + 1;
  const mx = config.beta1 * state.mx + (1 - config.beta1) * gx;
  const my = config.beta1 * state.my + (1 - config.beta1) * gy;
  const sx = Math.max(config.beta2 * state.sx, Math.abs(gx));
  const sy = Math.max(config.beta2 * state.sy, Math.abs(gy));
  const mxHat = mx / (1 - config.beta1 ** t);
  const myHat = my / (1 - config.beta1 ** t);
  return {
    ...state,
    x: state.x - config.lr * mxHat / (sx + config.epsilon),
    y: state.y - config.lr * myHat / (sy + config.epsilon),
    mx, my, sx, sy, t,
  };
};

// NAdam (Nesterov + Adam)
export const nadamStep: OptimizerStep = (state, [gx, gy], config) => {
  const t = state.t + 1;
  const mx = config.beta1 * state.mx + (1 - config.beta1) * gx;
  const my = config.beta1 * state.my + (1 - config.beta1) * gy;
  const sx = config.beta2 * state.sx + (1 - config.beta2) * gx * gx;
  const sy = config.beta2 * state.sy + (1 - config.beta2) * gy * gy;
  const mxHat = mx / (1 - config.beta1 ** t);
  const myHat = my / (1 - config.beta1 ** t);
  const sxHat = sx / (1 - config.beta2 ** t);
  const syHat = sy / (1 - config.beta2 ** t);
  const nxHat = (config.beta1 * mxHat + (1 - config.beta1) * gx / (1 - config.beta1 ** t));
  const nyHat = (config.beta1 * myHat + (1 - config.beta1) * gy / (1 - config.beta1 ** t));
  return {
    ...state,
    x: state.x - config.lr * nxHat / (Math.sqrt(sxHat) + config.epsilon),
    y: state.y - config.lr * nyHat / (Math.sqrt(syHat) + config.epsilon),
    mx, my, sx, sy, t,
  };
};

export interface OptimizerInfo {
  id: string;
  name: string;
  fullName: string;
  year: number;
  paper: string;
  step: OptimizerStep;
  color: string;
  description: string;
  equation: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  defaultLr: number;
  category: 'basic' | 'momentum' | 'adaptive';
  keyInsight: string;
  pytorchName: string;
}

export const optimizers: OptimizerInfo[] = [
  {
    id: 'sgd',
    name: 'SGD',
    fullName: 'Stochastic Gradient Descent',
    year: 1951,
    paper: 'Robbins & Monro',
    step: sgdStep,
    color: '#ef4444',
    description: 'The simplest optimizer. Updates parameters directly proportional to the negative gradient. Each step moves in the steepest descent direction scaled by the learning rate.',
    equation: 'θ = θ - α · ∇J(θ)',
    pros: ['Simple and easy to understand', 'Low memory overhead', 'Good generalization in some cases'],
    cons: ['Sensitive to learning rate', 'Can oscillate in ravines', 'Slow convergence on ill-conditioned problems'],
    bestFor: 'Simple convex problems, when memory is constrained',
    defaultLr: 0.05,
    category: 'basic',
    keyInsight: 'The foundation of all gradient-based optimization. Every other optimizer is a modification of this core idea.',
    pytorchName: 'torch.optim.SGD',
  },
  {
    id: 'momentum',
    name: 'Momentum',
    fullName: 'SGD with Momentum',
    year: 1964,
    paper: 'Polyak',
    step: momentumStep,
    color: '#f97316',
    description: 'Adds a "velocity" term that accumulates past gradients. Like a ball rolling downhill — it builds speed in consistent directions and dampens oscillations.',
    equation: 'v = γ·v + ∇J(θ)\nθ = θ - α·v',
    pros: ['Accelerates convergence', 'Reduces oscillation', 'Helps escape shallow local minima'],
    cons: ['Extra hyperparameter (momentum)', 'Can overshoot the minimum', 'Still needs learning rate tuning'],
    bestFor: 'Training deep networks where SGD is too slow',
    defaultLr: 0.01,
    category: 'momentum',
    keyInsight: 'Momentum acts like physical inertia — the optimizer remembers its previous direction and resists sudden changes.',
    pytorchName: 'torch.optim.SGD(momentum=0.9)',
  },
  {
    id: 'nesterov',
    name: 'NAG',
    fullName: 'Nesterov Accelerated Gradient',
    year: 1983,
    paper: 'Nesterov',
    step: nesterovStep,
    color: '#eab308',
    description: 'A "look-ahead" version of momentum. Computes the gradient at the anticipated future position, giving it a corrective quality. It\'s like looking where you\'re going before stepping.',
    equation: 'v = γ·v + α·∇J(θ - γ·v)\nθ = θ - v',
    pros: ['Better convergence than standard momentum', 'Anticipatory correction reduces overshooting', 'Theoretically optimal for convex functions'],
    cons: ['Slightly more complex', 'Two gradient evaluations conceptually', 'Less benefit on highly stochastic gradients'],
    bestFor: 'When momentum overshoots, convex optimization',
    defaultLr: 0.01,
    category: 'momentum',
    keyInsight: 'Instead of computing gradient at current position, NAG "peeks ahead" — giving it foresight to slow down before overshooting.',
    pytorchName: 'torch.optim.SGD(nesterov=True)',
  },
  {
    id: 'adagrad',
    name: 'Adagrad',
    fullName: 'Adaptive Gradient Algorithm',
    year: 2011,
    paper: 'Duchi et al.',
    step: adagradStep,
    color: '#22c55e',
    description: 'Adapts the learning rate for each parameter based on the history of gradients. Frequent features get smaller updates; rare features get larger ones. Great for sparse data.',
    equation: 'G = G + (∇J)²\nθ = θ - α·∇J / (√G + ε)',
    pros: ['Per-parameter adaptive learning rate', 'Great for sparse features', 'No manual LR scheduling needed'],
    cons: ['Learning rate shrinks to zero over time', 'Accumulates squared gradients forever', 'Can stop learning too early'],
    bestFor: 'NLP, sparse data, recommendation systems',
    defaultLr: 0.5,
    category: 'adaptive',
    keyInsight: 'Parameters that update frequently get smaller learning rates, while rare parameters keep larger ones — perfect for sparse features.',
    pytorchName: 'torch.optim.Adagrad',
  },
  {
    id: 'adadelta',
    name: 'Adadelta',
    fullName: 'Adadelta',
    year: 2012,
    paper: 'Zeiler',
    step: adadeltaStep,
    color: '#06b6d4',
    description: 'An extension of Adagrad that fixes the dying learning rate problem. Uses a running window of past gradients instead of accumulating all of them, and doesn\'t even need a learning rate!',
    equation: 'E[g²] = ρ·E[g²] + (1-ρ)·g²\nΔθ = -√(E[Δθ²]+ε)/√(E[g²]+ε) · g',
    pros: ['No learning rate to tune', 'Fixes Adagrad\'s dying rate', 'Robust to noise'],
    cons: ['More memory than Adagrad', 'Can be slower than Adam', 'Less commonly used today'],
    bestFor: 'When you want minimal hyperparameter tuning',
    defaultLr: 1.0,
    category: 'adaptive',
    keyInsight: 'Replaces accumulated gradients with a windowed average, and uses parameter update magnitudes to set the step size — eliminating the learning rate entirely.',
    pytorchName: 'torch.optim.Adadelta',
  },
  {
    id: 'rmsprop',
    name: 'RMSProp',
    fullName: 'Root Mean Square Propagation',
    year: 2012,
    paper: 'Hinton (unpublished)',
    step: rmspropStep,
    color: '#3b82f6',
    description: 'Uses an exponentially decaying average of squared gradients to adapt learning rates. Solves Adagrad\'s vanishing learning rate problem. Proposed by Hinton in his Coursera course.',
    equation: 'E[g²] = β·E[g²] + (1-β)·g²\nθ = θ - α·g / √(E[g²] + ε)',
    pros: ['Fixes Adagrad\'s diminishing LR', 'Works well with RNNs', 'Simple and effective'],
    cons: ['Needs learning rate tuning', 'No bias correction', 'Can be unstable with large gradients'],
    bestFor: 'RNNs, non-stationary objectives',
    defaultLr: 0.01,
    category: 'adaptive',
    keyInsight: 'Uses exponential moving average instead of sum of all past squared gradients — the "forgetting" prevents the learning rate from dying.',
    pytorchName: 'torch.optim.RMSprop',
  },
  {
    id: 'adam',
    name: 'Adam',
    fullName: 'Adaptive Moment Estimation',
    year: 2014,
    paper: 'Kingma & Ba',
    step: adamStep,
    color: '#8b5cf6',
    description: 'Combines the best of Momentum (first moment) and RMSProp (second moment) with bias correction. The most popular optimizer in deep learning — the "default choice" for most tasks.',
    equation: 'm = β₁·m + (1-β₁)·g\nv = β₂·v + (1-β₂)·g²\nm̂ = m/(1-β₁ᵗ), v̂ = v/(1-β₂ᵗ)\nθ = θ - α·m̂/(√v̂ + ε)',
    pros: ['Combines momentum + adaptive LR', 'Bias-corrected estimates', 'Works great out-of-the-box'],
    cons: ['May not generalize as well as SGD', 'Can converge to sharp minima', 'Memory: stores m and v per parameter'],
    bestFor: 'Default choice for most deep learning tasks',
    defaultLr: 0.01,
    category: 'adaptive',
    keyInsight: 'Adam = Momentum + RMSProp + Bias Correction. The bias correction is crucial — without it, early steps would be biased toward zero.',
    pytorchName: 'torch.optim.Adam',
  },
  {
    id: 'adamw',
    name: 'AdamW',
    fullName: 'Adam with Decoupled Weight Decay',
    year: 2017,
    paper: 'Loshchilov & Hutter',
    step: adamwStep,
    color: '#a855f7',
    description: 'Fixes how Adam handles weight decay (L2 regularization). Standard Adam applies weight decay to the gradient, but AdamW decouples it — applying it directly to weights. This is now the preferred variant.',
    equation: 'm = β₁·m + (1-β₁)·g\nv = β₂·v + (1-β₂)·g²\nθ = θ - α·(m̂/√v̂ + λ·θ)',
    pros: ['Better generalization than Adam', 'Correct weight decay behavior', 'Now the standard in practice'],
    cons: ['Extra hyperparameter (weight decay)', 'Slightly more complex', 'Weight decay interaction with LR'],
    bestFor: 'Transformers, LLMs, modern architectures (the current industry standard)',
    defaultLr: 0.01,
    category: 'adaptive',
    keyInsight: 'L2 regularization ≠ weight decay in adaptive methods. AdamW applies weight decay directly to parameters rather than through the gradient, matching SGD\'s regularization behavior.',
    pytorchName: 'torch.optim.AdamW',
  },
  {
    id: 'amsgrad',
    name: 'AMSGrad',
    fullName: 'AMSGrad (Fixed Adam)',
    year: 2018,
    paper: 'Reddi, Kale & Kumar',
    step: amsgradStep,
    color: '#f43f5e',
    description: 'Fixes Adam\'s convergence issue by keeping the maximum of all past squared gradient averages. Guarantees convergence in settings where Adam provably fails.',
    equation: 'm = β₁·m + (1-β₁)·g\nv = β₂·v + (1-β₂)·g²\nv̂ = max(v̂_prev, v)\nθ = θ - α·m̂/√v̂',
    pros: ['Guaranteed convergence (unlike Adam)', 'Fixes Adam\'s theoretical issues', 'Simple modification'],
    cons: ['Often similar performance to Adam in practice', 'More conservative updates', 'Keeps running max (slightly more memory)'],
    bestFor: 'When Adam diverges, theoretical guarantees matter',
    defaultLr: 0.01,
    category: 'adaptive',
    keyInsight: 'Adam can fail to converge because its adaptive learning rate can increase. AMSGrad ensures the learning rate only ever decreases by using max of past v values.',
    pytorchName: 'torch.optim.Adam(amsgrad=True)',
  },
  {
    id: 'adamax',
    name: 'AdaMax',
    fullName: 'AdaMax (Adam with L∞ norm)',
    year: 2014,
    paper: 'Kingma & Ba',
    step: adamaxStep,
    color: '#ec4899',
    description: 'A variant of Adam based on the infinity norm. Replaces the second moment with the max of past gradients. More stable than Adam with large gradients or embeddings.',
    equation: 'm = β₁·m + (1-β₁)·g\nu = max(β₂·u, |g|)\nθ = θ - α·m̂ / u',
    pros: ['More stable with large gradients', 'Good for embeddings', 'Simple infinity norm computation'],
    cons: ['Less commonly used', 'May converge slower', 'Less well-studied'],
    bestFor: 'Models with embeddings, unstable gradients',
    defaultLr: 0.01,
    category: 'adaptive',
    keyInsight: 'By using the infinity norm (max) instead of L2 norm, AdaMax avoids issues with extreme gradient magnitudes that can destabilize Adam.',
    pytorchName: 'torch.optim.Adamax',
  },
  {
    id: 'nadam',
    name: 'NAdam',
    fullName: 'Nesterov Adam',
    year: 2016,
    paper: 'Dozat',
    step: nadamStep,
    color: '#14b8a6',
    description: 'Combines Adam with Nesterov momentum. Uses the look-ahead gradient correction from NAG within Adam\'s framework, often giving faster convergence.',
    equation: 'm̂ = β₁·m̂ + (1-β₁)·g/(1-β₁ᵗ)\nθ = θ - α·m̂/(√v̂ + ε)',
    pros: ['Combines best of NAG and Adam', 'Often faster than Adam', 'Better theoretical convergence'],
    cons: ['More complex implementation', 'Marginal improvement in practice', 'More compute per step'],
    bestFor: 'When Adam is close but you want a bit more speed',
    defaultLr: 0.01,
    category: 'adaptive',
    keyInsight: 'NAdam incorporates Nesterov\'s look-ahead trick into Adam by modifying the momentum update — getting the anticipatory benefit without separate gradient evaluation.',
    pytorchName: 'torch.optim.NAdam',
  },
];

// Run optimizer for N steps and collect the path
export function runOptimizer(
  optimizer: OptimizerInfo,
  surfaceKey: string,
  maxSteps: number,
  config: Partial<OptimizerConfig> = {},
  customStart?: { x: number; y: number },
): { x: number; y: number; z: number }[] {
  const surface = surfaces[surfaceKey];
  if (!surface) return [];

  const fullConfig = { ...defaultConfig, lr: optimizer.defaultLr, ...config };
  const startX = customStart?.x ?? surface.startX;
  const startY = customStart?.y ?? surface.startY;
  let state = createOptimizerState(startX, startY);
  const path: { x: number; y: number; z: number }[] = [];

  const z0 = surface.fn(state.x, state.y);
  path.push({ x: state.x, y: state.y, z: z0 });

  for (let i = 0; i < maxSteps; i++) {
    const grad = surface.grad(state.x, state.y);
    // Add noise if configured
    const noise1 = fullConfig.noiseScale > 0 ? (Math.random() - 0.5) * 2 * fullConfig.noiseScale : 0;
    const noise2 = fullConfig.noiseScale > 0 ? (Math.random() - 0.5) * 2 * fullConfig.noiseScale : 0;
    // Clip gradients
    const maxGrad = 50;
    const clippedGrad: [number, number] = [
      Math.max(-maxGrad, Math.min(maxGrad, grad[0] + noise1)),
      Math.max(-maxGrad, Math.min(maxGrad, grad[1] + noise2)),
    ];
    state = optimizer.step(state, clippedGrad, fullConfig);

    // Clamp to surface range
    state.x = Math.max(surface.rangeX[0], Math.min(surface.rangeX[1], state.x));
    state.y = Math.max(surface.rangeY[0], Math.min(surface.rangeY[1], state.y));

    const z = surface.fn(state.x, state.y);
    path.push({ x: state.x, y: state.y, z });
  }

  return path;
}

// Compute convergence metrics
export interface ConvergenceMetrics {
  finalLoss: number;
  stepsTo90: number | null;
  pathLength: number;
  oscillation: number;
  finalX: number;
  finalY: number;
  avgStepSize: number;
}

export function computeMetrics(path: { x: number; y: number; z: number }[]): ConvergenceMetrics {
  if (path.length === 0) return { finalLoss: Infinity, stepsTo90: null, pathLength: 0, oscillation: 0, finalX: 0, finalY: 0, avgStepSize: 0 };

  const initialLoss = path[0].z;
  const finalLoss = path[path.length - 1].z;
  const reduction90 = initialLoss - (initialLoss - finalLoss) * 0.9;

  let stepsTo90: number | null = null;
  let pathLength = 0;
  let oscillation = 0;
  let totalStepSize = 0;

  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const stepLen = Math.sqrt(dx * dx + dy * dy);
    pathLength += stepLen;
    totalStepSize += stepLen;

    if (stepsTo90 === null && path[i].z <= reduction90) {
      stepsTo90 = i;
    }

    if (i >= 2) {
      const dz1 = path[i - 1].z - path[i - 2].z;
      const dz2 = path[i].z - path[i - 1].z;
      if (dz1 * dz2 < 0) oscillation += 1;
    }
  }

  return {
    finalLoss,
    stepsTo90,
    pathLength,
    oscillation: oscillation / Math.max(path.length - 2, 1),
    finalX: path[path.length - 1].x,
    finalY: path[path.length - 1].y,
    avgStepSize: totalStepSize / Math.max(path.length - 1, 1),
  };
}
