import { useState, useMemo, useCallback } from 'react';
import { Brain, RefreshCw, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { optimizers, surfaces, runOptimizer, OptimizerInfo } from './optimizers';

const surfaceKeys = Object.keys(surfaces);

interface QuizQuestion {
  surfaceKey: string;
  optimizer: OptimizerInfo;
  path: { x: number; y: number; z: number }[];
  choices: OptimizerInfo[];
}

function generateQuestion(): QuizQuestion {
  const surfaceKey = surfaceKeys[Math.floor(Math.random() * surfaceKeys.length)];
  const optimizer = optimizers[Math.floor(Math.random() * optimizers.length)];
  const path = runOptimizer(optimizer, surfaceKey, 200);

  // Pick 3 wrong answers + the correct one
  const wrongChoices = optimizers.filter(o => o.id !== optimizer.id);
  const shuffledWrong = wrongChoices.sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...shuffledWrong, optimizer].sort(() => Math.random() - 0.5);

  return { surfaceKey, optimizer, path, choices };
}

function PathVisualization({ path, surfaceKey }: { path: { x: number; y: number; z: number }[]; surfaceKey: string }) {
  const surface = surfaces[surfaceKey];
  const [xMin, xMax] = surface.rangeX;
  const [yMin, yMax] = surface.rangeY;
  const size = 300;
  const padding = 30;
  const inner = size - 2 * padding;

  // Mini contour
  const contourData = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = inner;
    canvas.height = inner;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(inner, inner);

    let zMin = Infinity, zMax = -Infinity;
    const zVals = new Float32Array(inner * inner);
    for (let py = 0; py < inner; py++) {
      for (let px = 0; px < inner; px++) {
        const x = xMin + (px / inner) * (xMax - xMin);
        const y = yMax - (py / inner) * (yMax - yMin);
        const z = Math.min(surface.fn(x, y), 50);
        zVals[py * inner + px] = z;
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
      }
    }

    for (let i = 0; i < inner * inner; i++) {
      const t = Math.pow(zMax > zMin ? (zVals[i] - zMin) / (zMax - zMin) : 0, 0.6);
      const idx = i * 4;
      imgData.data[idx] = Math.round(10 + t * 100);
      imgData.data[idx + 1] = Math.round(20 + t * 60 + (1 - t) * 80);
      imgData.data[idx + 2] = Math.round(60 + (1 - t) * 130);
      imgData.data[idx + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }, [surfaceKey]);

  const toPixel = (x: number, y: number) => ({
    px: padding + ((x - xMin) / (xMax - xMin)) * inner,
    py: padding + ((yMax - y) / (yMax - yMin)) * inner,
  });

  const d = path.map((p, i) => {
    const { px, py } = toPixel(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'}${px},${py}`;
  }).join(' ');

  const start = toPixel(path[0].x, path[0].y);
  const end = toPixel(path[path.length - 1].x, path[path.length - 1].y);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] rounded-xl bg-slate-900">
      <image href={contourData} x={padding} y={padding} width={inner} height={inner} />
      <rect x={padding} y={padding} width={inner} height={inner} fill="none" stroke="#334155" strokeWidth="1" />
      {/* Path */}
      <path d={d} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d={d} fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" opacity="0.2" />
      {/* Start */}
      <circle cx={start.px} cy={start.py} r="5" fill="none" stroke="white" strokeWidth="2" />
      <circle cx={start.px} cy={start.py} r="2" fill="white" />
      {/* End */}
      <circle cx={end.px} cy={end.py} r="5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
      {/* Labels */}
      <text x={size / 2} y={size - 5} fill="#64748b" fontSize="10" textAnchor="middle">{surfaces[surfaceKey].name}</text>
    </svg>
  );
}

export default function QuizMode() {
  const [question, setQuestion] = useState<QuizQuestion>(generateQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const isCorrect = selectedAnswer === question.optimizer.id;
  const answered = selectedAnswer !== null;

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedAnswer(null);
    setShowHint(false);
  }, []);

  const handleAnswer = useCallback((id: string) => {
    if (answered) return;
    setSelectedAnswer(id);
    setTotalAnswered(prev => prev + 1);
    if (id === question.optimizer.id) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(old => Math.max(old, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  }, [answered, question.optimizer.id]);

  const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  // Hint: describe the path behavior
  const hint = useMemo(() => {
    const opt = question.optimizer;
    const path = question.path;
    const finalLoss = path[path.length - 1].z;
    const initialLoss = path[0].z;
    const converged = finalLoss < initialLoss * 0.1;
    const hints: string[] = [];

    if (opt.category === 'basic') hints.push('This optimizer has no momentum or adaptive features.');
    if (opt.category === 'momentum') hints.push('This optimizer uses momentum but not adaptive learning rates.');
    if (opt.category === 'adaptive') hints.push('This optimizer uses adaptive per-parameter learning rates.');
    if (converged) hints.push('It converges well on this surface.');
    else hints.push('It struggles to converge on this surface.');
    if (['adam', 'adamw'].includes(opt.id)) hints.push('It\'s one of the most popular optimizers in deep learning.');
    if (opt.id === 'sgd') hints.push('It uses no extra state — just raw gradient descent.');

    return hints[Math.floor(Math.random() * hints.length)];
  }, [question]);

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain size={20} className="text-pink-400" />
          Guess the Optimizer
        </h2>
        <div className="flex items-center gap-4">
          {streak >= 3 && (
            <div className="flex items-center gap-1 text-amber-400 text-xs animate-pulse">
              <Sparkles size={14} /> {streak} streak!
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Score: <span className="text-white font-bold">{score}/{totalAnswered}</span></span>
            <span>Acc: <span className="text-green-400 font-bold">{accuracy}%</span></span>
            <span>Best: <span className="text-amber-400 font-bold">{bestStreak}🔥</span></span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Look at the optimization path (yellow line) on the loss surface. Can you identify which optimizer produced it?
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Path visualization */}
        <div className="flex-shrink-0">
          <PathVisualization path={question.path} surfaceKey={question.surfaceKey} />
          {!answered && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="mt-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showHint ? '🙈 Hide hint' : '💡 Show hint'}
            </button>
          )}
          {showHint && !answered && (
            <p className="text-[11px] text-amber-400/70 mt-1 italic">{hint}</p>
          )}
        </div>

        {/* Answer choices */}
        <div className="flex-1 space-y-2">
          <p className="text-xs text-slate-500 font-medium mb-2">Which optimizer made this path?</p>
          {question.choices.map(opt => {
            const isThis = selectedAnswer === opt.id;
            const isCorrectAnswer = opt.id === question.optimizer.id;
            let borderColor = 'border-slate-700';
            let bgColor = '';

            if (answered) {
              if (isCorrectAnswer) {
                borderColor = 'border-green-500';
                bgColor = 'bg-green-500/10';
              } else if (isThis && !isCorrect) {
                borderColor = 'border-red-500';
                bgColor = 'bg-red-500/10';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                disabled={answered}
                className={`w-full text-left p-3 rounded-lg border transition-all ${borderColor} ${bgColor} ${
                  !answered ? 'hover:border-slate-500 cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />
                    <span className="font-bold text-sm text-white">{opt.name}</span>
                    <span className="text-[10px] text-slate-500">{opt.fullName}</span>
                  </div>
                  {answered && isCorrectAnswer && <CheckCircle size={16} className="text-green-400" />}
                  {answered && isThis && !isCorrect && <XCircle size={16} className="text-red-400" />}
                </div>
                {answered && isCorrectAnswer && (
                  <p className="text-[11px] text-slate-400 mt-1.5">{opt.keyInsight}</p>
                )}
              </button>
            );
          })}

          {/* Result + next */}
          {answered && (
            <div className={`rounded-lg p-3 mt-3 ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className="text-sm font-bold mb-1" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
                {isCorrect ? '🎉 Correct!' : `❌ Wrong — it was ${question.optimizer.name}`}
              </p>
              <p className="text-[11px] text-slate-400">{question.optimizer.description}</p>
              <button
                onClick={nextQuestion}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
              >
                <RefreshCw size={12} /> Next Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
