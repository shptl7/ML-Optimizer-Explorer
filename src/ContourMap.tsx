import { useMemo, useCallback } from 'react';
import { surfaces, runOptimizer, OptimizerInfo, OptimizerConfig } from './optimizers';

interface ContourMapProps {
  surfaceKey: string;
  selectedOptimizers: OptimizerInfo[];
  animStep: number;
  maxSteps: number;
  config: Partial<OptimizerConfig>;
  customStart?: { x: number; y: number } | null;
  onClickStart?: (x: number, y: number) => void;
  showGradients?: boolean;
}

export default function ContourMap({
  surfaceKey,
  selectedOptimizers,
  animStep,
  maxSteps,
  config,
  customStart,
  onClickStart,
  showGradients = false,
}: ContourMapProps) {
  const surface = surfaces[surfaceKey];
  const size = 500;
  const padding = 40;
  const inner = size - 2 * padding;

  const [xMin, xMax] = surface.rangeX;
  const [yMin, yMax] = surface.rangeY;

  // Generate contour image data
  const contourImageData = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = inner;
    canvas.height = inner;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(inner, inner);

    // First pass: find min/max
    let zMin = Infinity, zMax = -Infinity;
    const zVals = new Float32Array(inner * inner);
    for (let py = 0; py < inner; py++) {
      for (let px = 0; px < inner; px++) {
        const x = xMin + (px / inner) * (xMax - xMin);
        const y = yMax - (py / inner) * (yMax - yMin);
        const z = surface.fn(x, y);
        const zc = Math.min(z, 50);
        zVals[py * inner + px] = zc;
        if (zc < zMin) zMin = zc;
        if (zc > zMax) zMax = zc;
      }
    }

    // Color palette - deep blue to cyan to yellow to red
    const colorMap = (t: number): [number, number, number] => {
      // Apply log-like scaling for better contrast
      t = Math.pow(t, 0.6);
      if (t < 0.2) {
        const s = t / 0.2;
        return [10 + s * 15, 10 + s * 50, 60 + s * 120];
      } else if (t < 0.4) {
        const s = (t - 0.2) / 0.2;
        return [25 + s * 5, 60 + s * 120, 180 - s * 30];
      } else if (t < 0.65) {
        const s = (t - 0.4) / 0.25;
        return [30 + s * 200, 180 + s * 50, 150 - s * 100];
      } else if (t < 0.85) {
        const s = (t - 0.65) / 0.2;
        return [230 + s * 25, 230 - s * 80, 50 - s * 30];
      } else {
        const s = (t - 0.85) / 0.15;
        return [255, 150 - s * 100, 20 + s * 10];
      }
    };

    for (let py = 0; py < inner; py++) {
      for (let px = 0; px < inner; px++) {
        const z = zVals[py * inner + px];
        const t = zMax > zMin ? (z - zMin) / (zMax - zMin) : 0;
        const [r, g, b] = colorMap(t);
        const idx = (py * inner + px) * 4;
        imgData.data[idx] = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = 255;

        // Add contour lines
        const numContours = 20;
        const contourLevel = t * numContours;
        const frac = contourLevel - Math.floor(contourLevel);
        if (frac < 0.06 || frac > 0.94) {
          imgData.data[idx] = Math.min(255, r + 40);
          imgData.data[idx + 1] = Math.min(255, g + 40);
          imgData.data[idx + 2] = Math.min(255, b + 40);
          imgData.data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }, [surfaceKey]);

  // Compute paths
  const paths = useMemo(() => {
    return selectedOptimizers.map(opt => ({
      optimizer: opt,
      path: runOptimizer(opt, surfaceKey, maxSteps, config, customStart ?? undefined),
    }));
  }, [surfaceKey, selectedOptimizers, maxSteps, config, customStart]);

  // Gradient field arrows
  const gradientArrows = useMemo(() => {
    if (!showGradients) return [];
    const arrows: { x1: number; y1: number; x2: number; y2: number; mag: number }[] = [];
    const gridN = 16;
    for (let i = 0; i <= gridN; i++) {
      for (let j = 0; j <= gridN; j++) {
        const x = xMin + (i / gridN) * (xMax - xMin);
        const y = yMin + (j / gridN) * (yMax - yMin);
        const [gx, gy] = surface.grad(x, y);
        const mag = Math.sqrt(gx * gx + gy * gy) + 1e-10;
        const scale = Math.min(0.6, mag * 2) / mag;
        const px1 = padding + (x - xMin) / (xMax - xMin) * inner;
        const py1 = padding + (yMax - y) / (yMax - yMin) * inner;
        const px2 = px1 - gx * scale * inner / (xMax - xMin) * 0.4;
        const py2 = py1 + gy * scale * inner / (yMax - yMin) * 0.4;
        arrows.push({ x1: px1, y1: py1, x2: px2, y2: py2, mag });
      }
    }
    return arrows;
  }, [surfaceKey, showGradients]);

  const toPixel = useCallback((x: number, y: number) => ({
    px: padding + ((x - xMin) / (xMax - xMin)) * inner,
    py: padding + ((yMax - y) / (yMax - yMin)) * inner,
  }), [surfaceKey]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClickStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = xMin + ((px - padding) / inner) * (xMax - xMin);
    const y = yMax - ((py - padding) / inner) * (yMax - yMin);
    if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
      onClickStart(x, y);
    }
  }, [surfaceKey, onClickStart]);

  const startPos = customStart ?? { x: surface.startX, y: surface.startY };
  const startPx = toPixel(startPos.x, startPos.y);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full rounded-xl bg-slate-900 cursor-crosshair"
        onClick={handleClick}
      >
        {/* Contour background */}
        <image
          href={contourImageData}
          x={padding}
          y={padding}
          width={inner}
          height={inner}
          style={{ imageRendering: 'auto' }}
        />

        {/* Border */}
        <rect x={padding} y={padding} width={inner} height={inner} fill="none" stroke="#334155" strokeWidth="1" />

        {/* Axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const val = xMin + t * (xMax - xMin);
          const px = padding + t * inner;
          return (
            <g key={`x-${t}`}>
              <text x={px} y={size - 8} fill="#64748b" fontSize="10" textAnchor="middle">{val.toFixed(1)}</text>
              <line x1={px} y1={padding} x2={px} y2={padding + inner} stroke="#334155" strokeWidth="0.3" strokeDasharray="4,4" />
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const val = yMax - t * (yMax - yMin);
          const py = padding + t * inner;
          return (
            <g key={`y-${t}`}>
              <text x={padding - 5} y={py + 3} fill="#64748b" fontSize="10" textAnchor="end">{val.toFixed(1)}</text>
              <line x1={padding} y1={py} x2={padding + inner} y2={py} stroke="#334155" strokeWidth="0.3" strokeDasharray="4,4" />
            </g>
          );
        })}

        {/* Gradient field */}
        {gradientArrows.map((arrow, i) => (
          <line
            key={i}
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x2}
            y2={arrow.y2}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            markerEnd="url(#arrowhead)"
          />
        ))}
        {showGradients && (
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="rgba(255,255,255,0.3)" />
            </marker>
          </defs>
        )}

        {/* Optimizer paths */}
        {paths.map(({ optimizer, path }) => {
          const visible = path.slice(0, Math.min(animStep + 1, path.length));
          if (visible.length < 2) return null;
          const d = visible.map((p, i) => {
            const { px, py } = toPixel(p.x, p.y);
            return `${i === 0 ? 'M' : 'L'}${px},${py}`;
          }).join(' ');

          const lastPt = visible[visible.length - 1];
          const { px: lastPx, py: lastPy } = toPixel(lastPt.x, lastPt.y);

          return (
            <g key={optimizer.id}>
              <path d={d} fill="none" stroke={optimizer.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
              {/* Glow effect */}
              <path d={d} fill="none" stroke={optimizer.color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
              {/* Current position */}
              <circle cx={lastPx} cy={lastPy} r="5" fill={optimizer.color} stroke="white" strokeWidth="1.5" />
              <circle cx={lastPx} cy={lastPy} r="8" fill={optimizer.color} opacity="0.3" />
              {/* Label */}
              <text x={lastPx + 10} y={lastPy - 8} fill={optimizer.color} fontSize="10" fontWeight="bold">{optimizer.name}</text>
            </g>
          );
        })}

        {/* Start position marker */}
        <g>
          <circle cx={startPx.px} cy={startPx.py} r="6" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx={startPx.px} cy={startPx.py} r="2" fill="#ffffff" />
          <text x={startPx.px + 10} y={startPx.py - 10} fill="#ffffff" fontSize="9" fontWeight="bold">START</text>
        </g>

        {/* Axis labels */}
        <text x={size / 2} y={size - 0} fill="#94a3b8" fontSize="11" textAnchor="middle">Parameter x</text>
        <text x={8} y={size / 2} fill="#94a3b8" fontSize="11" textAnchor="middle" transform={`rotate(-90, 8, ${size / 2})`}>Parameter y</text>
      </svg>
    </div>
  );
}
