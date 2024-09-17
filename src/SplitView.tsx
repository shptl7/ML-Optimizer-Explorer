import { useMemo, useCallback } from 'react';
import { Columns2 } from 'lucide-react';
import { surfaces, runOptimizer, OptimizerInfo, OptimizerConfig } from './optimizers';

interface SplitViewProps {
  surfaceKey: string;
  leftOptimizers: OptimizerInfo[];
  rightOptimizers: OptimizerInfo[];
  animStep: number;
  maxSteps: number;
  config: Partial<OptimizerConfig>;
  customStart?: { x: number; y: number } | null;
}

function MiniContour({
  surfaceKey,
  optimizerList,
  animStep,
  maxSteps,
  config,
  customStart,
  label,
}: {
  surfaceKey: string;
  optimizerList: OptimizerInfo[];
  animStep: number;
  maxSteps: number;
  config: Partial<OptimizerConfig>;
  customStart?: { x: number; y: number } | null;
  label: string;
}) {
  const surface = surfaces[surfaceKey];
  const size = 400;
  const padding = 30;
  const inner = size - 2 * padding;
  const [xMin, xMax] = surface.rangeX;
  const [yMin, yMax] = surface.rangeY;

  const contourImageData = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = inner;
    canvas.height = inner;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(inner, inner);

    let zMin2 = Infinity, zMax2 = -Infinity;
    const zVals = new Float32Array(inner * inner);
    for (let py = 0; py < inner; py++) {
      for (let px = 0; px < inner; px++) {
        const x = xMin + (px / inner) * (xMax - xMin);
        const y = yMax - (py / inner) * (yMax - yMin);
        const z = Math.min(surface.fn(x, y), 50);
        zVals[py * inner + px] = z;
        if (z < zMin2) zMin2 = z;
        if (z > zMax2) zMax2 = z;
      }
    }

    for (let i = 0; i < inner * inner; i++) {
      const t = Math.pow(zMax2 > zMin2 ? (zVals[i] - zMin2) / (zMax2 - zMin2) : 0, 0.6);
      const idx = i * 4;
      imgData.data[idx] = Math.round(10 + t * 100);
      imgData.data[idx + 1] = Math.round(20 + t * 60 + (1 - t) * 80);
      imgData.data[idx + 2] = Math.round(60 + (1 - t) * 130);
      imgData.data[idx + 3] = 255;

      const numContours = 15;
      const contourLevel = t * numContours;
      const frac = contourLevel - Math.floor(contourLevel);
      if (frac < 0.05 || frac > 0.95) {
        imgData.data[idx] = Math.min(255, imgData.data[idx] + 30);
        imgData.data[idx + 1] = Math.min(255, imgData.data[idx + 1] + 30);
        imgData.data[idx + 2] = Math.min(255, imgData.data[idx + 2] + 30);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }, [surfaceKey]);

  const paths = useMemo(() => {
    return optimizerList.map(opt => ({
      optimizer: opt,
      path: runOptimizer(opt, surfaceKey, maxSteps, config, customStart ?? undefined),
    }));
  }, [surfaceKey, optimizerList, maxSteps, config, customStart]);

  const toPixel = useCallback((x: number, y: number) => ({
    px: padding + ((x - xMin) / (xMax - xMin)) * inner,
    py: padding + ((yMax - y) / (yMax - yMin)) * inner,
  }), [surfaceKey]);

  const startPos = customStart ?? { x: surface.startX, y: surface.startY };
  const startPx = toPixel(startPos.x, startPos.y);

  return (
    <div>
      <p className="text-xs font-bold text-slate-300 mb-1.5 text-center">{label}</p>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full rounded-xl bg-slate-900">
        <image href={contourImageData} x={padding} y={padding} width={inner} height={inner} />
        <rect x={padding} y={padding} width={inner} height={inner} fill="none" stroke="#334155" strokeWidth="1" />

        {/* Paths */}
        {paths.map(({ optimizer, path }) => {
          const visible = path.slice(0, Math.min(animStep + 1, path.length));
          if (visible.length < 2) return null;
          const d = visible.map((p, i) => {
            const { px, py } = toPixel(p.x, p.y);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ');
          const lastPt = visible[visible.length - 1];
          const { px: lpx, py: lpy } = toPixel(lastPt.x, lastPt.y);
          return (
            <g key={optimizer.id}>
              <path d={d} fill="none" stroke={optimizer.color} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
              <path d={d} fill="none" stroke={optimizer.color} strokeWidth="5" strokeLinecap="round" opacity="0.15" />
              <circle cx={lpx} cy={lpy} r="5" fill={optimizer.color} stroke="white" strokeWidth="1.5" />
              <text x={lpx + 8} y={lpy - 6} fill={optimizer.color} fontSize="10" fontWeight="bold">{optimizer.name}</text>
            </g>
          );
        })}

        {/* Start */}
        <circle cx={startPx.px} cy={startPx.py} r="5" fill="none" stroke="white" strokeWidth="2" />
        <circle cx={startPx.px} cy={startPx.py} r="2" fill="white" />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {optimizerList.map(opt => (
          <div key={opt.id} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
            <span className="text-[10px] text-slate-400">{opt.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SplitView(props: SplitViewProps) {
  const { surfaceKey, leftOptimizers, rightOptimizers, animStep, maxSteps, config, customStart } = props;

  if (leftOptimizers.length === 0 && rightOptimizers.length === 0) return null;

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Columns2 size={18} className="text-blue-400" />
        Side-by-Side View — {surfaces[surfaceKey].name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MiniContour
          surfaceKey={surfaceKey}
          optimizerList={leftOptimizers}
          animStep={animStep}
          maxSteps={maxSteps}
          config={config}
          customStart={customStart}
          label="Group A"
        />
        <MiniContour
          surfaceKey={surfaceKey}
          optimizerList={rightOptimizers}
          animStep={animStep}
          maxSteps={maxSteps}
          config={config}
          customStart={customStart}
          label="Group B"
        />
      </div>
    </div>
  );
}
