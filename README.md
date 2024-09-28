# ML Optimizer Explorer

> Interactive 3D visualization of how gradient-descent optimizers navigate loss landscapes — watch SGD, Adam, RMSProp and 8 others race across classic optimization surfaces in real time.

![ML Optimizer Explorer — 3D playground](docs/02-playground-3d.png)

**🔗 Live demo: [shptl7.github.io/ML-Optimizer-Explorer](https://shptl7.github.io/ML-Optimizer-Explorer/)**

Or run it locally (see [Getting started](#getting-started)) — no backend required; the whole app builds to a single self-contained HTML file.

---

## Demo

**Watching optimizers descend a loss surface (Rosenbrock — the classic "banana valley"):**

| 3D surface | 2D contour + gradient field |
|:---:|:---:|
| ![3D descent](docs/demo-3d.gif) | ![Contour descent](docs/demo-contour.gif) |

---

## What it does

Optimizers are usually taught as equations. This tool lets you *see* them: pick a loss surface, select the optimizers you want to compare, and watch their descent paths animate step-by-step in 3D — then dig into the math, hyperparameters, and per-step internals.

- **11 optimizers**, hand-implemented from their update rules — from vanilla SGD to AdamW.
- **7 loss surfaces**, each chosen to stress a different failure mode (narrow valleys, saddle points, many local minima, near-flat regions).
- **Live everything** — change the learning rate, momentum, or β values and the paths recompute instantly.

## Features

- **3D surface view** (Three.js) with animated descent paths, plus a 2D **contour view** and a **split view** for side-by-side comparison.
- **Step inspector** — scrub to any step and read the exact position, gradient, and internal state (velocity, moment estimates) for a selected optimizer.
- **Live hyperparameter panel** — learning rate, momentum, β₁/β₂, ε, weight decay, and gradient noise, all applied in real time.
- **Custom loss surfaces** — type your own `f(x, y)` and gradient and drop the optimizers onto it.
- **Compare tab** — radar chart and heatmap matrix ranking optimizers on convergence metrics (final loss, steps-to-90%, path length, oscillation).
- **Learn tab** — intuition builder, learning-rate schedule demos, pro tips, and a timeline of optimizer history.
- **Quiz mode** to test your understanding.
- **PyTorch code export** for the optimizers you've selected.
- **Shareable URLs** that encode your selection, surface, and hyperparameters.
- **Keyboard shortcuts** (space = play/pause, ←/→ = step, `R` = reset, `1`–`3` = views, `G` = gradients).

## Screenshots

**Split view** — compare two groups of optimizers side by side on the same surface:

![Split view](docs/04-split.png)

**Quiz mode** — identify the optimizer from its descent path:

![Quiz mode](docs/08-quiz.png)

<details>
<summary><b>Learn tab</b> — intuition builders, LR-schedule comparison, pro tips & optimizer history (click to expand)</summary>

![Learn tab](docs/06-learn.png)

</details>

<details>
<summary><b>Compare tab</b> — radar chart, convergence heatmap, leaderboard & PyTorch export for all 11 optimizers (click to expand)</summary>

![Compare tab](docs/07-compare.png)

</details>

<details>
<summary><b>Welcome tour</b> (click to expand)</summary>

![Welcome modal](docs/01-welcome.png)

</details>

## Optimizers

| Optimizer | Year | Category | PyTorch |
|---|---|---|---|
| SGD | 1951 | Basic | `torch.optim.SGD` |
| Momentum | 1964 | Momentum | `torch.optim.SGD(momentum=0.9)` |
| NAG (Nesterov) | 1983 | Momentum | `torch.optim.SGD(nesterov=True)` |
| Adagrad | 2011 | Adaptive | `torch.optim.Adagrad` |
| Adadelta | 2012 | Adaptive | `torch.optim.Adadelta` |
| RMSProp | 2012 | Adaptive | `torch.optim.RMSprop` |
| Adam | 2014 | Adaptive | `torch.optim.Adam` |
| AdaMax | 2014 | Adaptive | `torch.optim.Adamax` |
| NAdam | 2016 | Adaptive | `torch.optim.NAdam` |
| AdamW | 2017 | Adaptive | `torch.optim.AdamW` |
| AMSGrad | 2018 | Adaptive | `torch.optim.Adam(amsgrad=True)` |

Each update rule lives in [`src/optimizers.ts`](src/optimizers.ts) as a pure `(state, grad, config) => state` function, with bias correction, decoupled weight decay (AdamW), and the running-max variance (AMSGrad) implemented explicitly.

## Loss surfaces

| Surface | Tests |
|---|---|
| Rosenbrock | Navigating a long, narrow "banana" valley |
| Beale | Steep multi-modal walls around a single minimum |
| Himmelblau | Path selection among four equally-good minima |
| Rastrigin | Robustness to many local traps |
| Ackley | Finding a needle-in-a-haystack minimum in a flat region |
| Saddle point | Escaping saddles (a common deep-learning failure mode) |
| Sphere | Baseline convex case — compare raw speed |

## Tech stack

- **React 19** + **TypeScript**
- **Three.js** via **@react-three/fiber** / **drei** for 3D
- **Tailwind CSS 4**
- **Vite 7** (bundled to a single self-contained HTML file via `vite-plugin-singlefile`)

## Getting started

```bash
# install
npm install

# run the dev server
npm run dev

# type-check + production build (outputs a single dist/index.html)
npm run build

# preview the production build
npm run preview
```

Requires Node 18+.

## Project structure

```
src/
  optimizers.ts        # optimizer update rules, loss surfaces, metrics (core logic)
  App.tsx              # layout, tabs, animation loop, state
  Surface3D.tsx        # 3D loss surface + animated paths
  ContourMap.tsx       # 2D contour view with gradient field
  SplitView.tsx        # side-by-side comparison
  StepInspector.tsx    # per-step internal state readout
  HyperparamPanel.tsx  # live hyperparameter controls
  Leaderboard.tsx / RadarChart.tsx / HeatmapMatrix.tsx  # comparison views
  IntuitionBuilder.tsx / LRScheduleDemo.tsx / ProTips.tsx / QuizMode.tsx  # Learn & Quiz
  CustomSurface.tsx    # user-defined loss functions
  CodeExport.tsx       # PyTorch snippet generation
```

## License

[MIT](LICENSE) © Shrey Patel
