import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

interface PatternLockProps {
  value?: number[]; // Array of dot indices (0..8)
  onChange?: (pattern: number[]) => void;
  readOnly?: boolean;
  size?: number; // width & height in px
  monochrome?: boolean; // Force 100% black & white for receipt printing
}

// 3x3 Grid coordinates (0 to 8)
// 0  1  2
// 3  4  5
// 6  7  8
export const PatternLock: React.FC<PatternLockProps> = ({
  value = [],
  onChange,
  readOnly = false,
  size = 200,
  monochrome = false,
}) => {
  const [pattern, setPattern] = useState<number[]>(value);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPattern(value);
  }, [value]);

  const getDotCoords = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const padding = size * 0.18;
    const spacing = (size - padding * 2) / 2;
    return {
      x: padding + col * spacing,
      y: padding + row * spacing,
    };
  };

  const getDotFromPoint = (clientX: number, clientY: number): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let i = 0; i < 9; i++) {
      const coords = getDotCoords(i);
      const dist = Math.hypot(x - coords.x, y - coords.y);
      if (dist < size * 0.14) {
        return i;
      }
    }
    return null;
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (readOnly) return;
    const dot = getDotFromPoint(clientX, clientY);
    if (dot !== null) {
      setIsDrawing(true);
      const newPattern = [dot];
      setPattern(newPattern);
      if (onChange) onChange(newPattern);
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (readOnly || !isDrawing) return;
    const dot = getDotFromPoint(clientX, clientY);
    if (dot !== null && !pattern.includes(dot)) {
      const newPattern = [...pattern, dot];
      setPattern(newPattern);
      if (onChange) onChange(newPattern);
    }
  };

  const handleEnd = () => {
    if (readOnly) return;
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (readOnly) return;
    setPattern([]);
    if (onChange) onChange([]);
  };

  return (
    <div className="flex flex-col items-center space-y-2 select-none">
      <div
        ref={containerRef}
        className={`relative rounded-2xl p-2 transition-all ${
          monochrome
            ? 'bg-white border-2 border-black shadow-none'
            : 'bg-slate-900 shadow-inner'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer touch-none'}`}
        style={{ width: size, height: size }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
      >
        {/* Lines SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {pattern.map((dotIdx, i) => {
            if (i === 0) return null;
            const prev = getDotCoords(pattern[i - 1]);
            const curr = getDotCoords(dotIdx);
            return (
              <line
                key={i}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke={monochrome ? '#000000' : '#38bdf8'}
                strokeWidth={size * (monochrome ? 0.045 : 0.035)}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* 3x3 Dots Grid */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const coords = getDotCoords(i);
          const isSelected = pattern.includes(i);
          const order = pattern.indexOf(i) + 1;

          return (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-150"
              style={{
                left: coords.x,
                top: coords.y,
                width: size * 0.18,
                height: size * 0.18,
              }}
            >
              {/* Outer Ring */}
              <div
                className={`w-full h-full rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                  monochrome
                    ? isSelected
                      ? 'border-2 border-black bg-black text-white scale-110'
                      : 'border-2 border-black bg-white text-black'
                    : isSelected
                    ? 'border-2 border-sky-400 bg-sky-500/20 text-sky-200 scale-110 shadow-lg shadow-sky-500/50'
                    : 'border-2 border-slate-600 bg-slate-800/80 text-slate-400'
                }`}
              >
                {/* Inner Dot or Sequence Number */}
                {isSelected ? (
                  <span className="font-extrabold">{order}</span>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${monochrome ? 'bg-black' : 'bg-slate-400'}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pattern Sequence & Controls */}
      <div className="flex items-center justify-between w-full max-w-[200px] text-xs">
        <div className="text-[11px] font-mono font-bold text-black truncate">
          {pattern.length > 0 ? (
            <span className={monochrome ? 'text-black font-extrabold' : 'text-sky-700 bg-sky-100 px-2 py-0.5 rounded'}>
              Pola: {pattern.map((d) => d + 1).join(' ➔ ')}
            </span>
          ) : (
            <span className="text-gray-500 italic">Pola Belum Diisi</span>
          )}
        </div>

        {!readOnly && pattern.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1 transition shrink-0"
          >
            <RotateCcw className="w-3 h-3" /> Hapus
          </button>
        )}
      </div>
    </div>
  );
};
