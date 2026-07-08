import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Role } from '../mocks/roles';

const CANVAS_SIZE = 600;
const SPIN_MS = 3600;
const FULL_SPINS = 6;
const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", emoji, sans-serif';

interface RouletteWheelProps {
  slices: Role[];
  /** Index within `slices` that must land under the top pointer. */
  prizeIndex: number;
  spinning: boolean;
  spinKey: number;
  onStopped: () => void;
}

/**
 * Geometry convention (keep it simple):
 * - The pointer is fixed at the TOP (12 o'clock).
 * - Segment `i` is drawn with its CENTER at angle `i * seg` measured CLOCKWISE
 *   from the top. So at rotation 0, segment 0 sits exactly under the pointer.
 * - CSS `rotate(R)` turns the wheel clockwise for positive R. After rotating,
 *   segment `i` center is at screen angle `(i * seg + R)` clockwise from the top.
 * - To land segment `w` under the pointer we need `w * seg + R ≡ 0 (mod 360)`,
 *   hence `R ≡ -w * seg (mod 360)`.
 */
function computeTargetRotation(
  prizeIndex: number,
  sliceCount: number,
  fromRotation: number,
): number {
  const seg = 360 / sliceCount;
  const desired = (((-prizeIndex * seg) % 360) + 360) % 360;
  const current = ((fromRotation % 360) + 360) % 360;
  let delta = ((desired - current) % 360 + 360) % 360;
  if (delta < 1) delta += 360;
  return fromRotation + FULL_SPINS * 360 + delta;
}

/** Canvas angle (radians) for a clockwise-from-top angle in degrees. */
function topClockwiseToCanvas(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

function drawWheel(canvas: HTMLCanvasElement, slices: Role[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || slices.length === 0) return;

  const count = slices.length;
  const seg = 360 / count;
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const outerRadius = CANVAS_SIZE / 2 - 8;
  const innerRadius = outerRadius * 0.22;
  const iconSize = count <= 2 ? 84 : count <= 4 ? 72 : 60;

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  slices.forEach((role, index) => {
    const centerDeg = index * seg;
    const startAngle = topClockwiseToCanvas(centerDeg - seg / 2);
    const endAngle = topClockwiseToCanvas(centerDeg + seg / 2);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = role.color;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 248, 240, 0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const iconAngle = topClockwiseToCanvas(centerDeg);
    const iconRadius = outerRadius * 0.63;
    const ix = cx + iconRadius * Math.cos(iconAngle);
    const iy = cy + iconRadius * Math.sin(iconAngle);

    ctx.save();
    ctx.font = `${iconSize}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(role.icon, ix, iy);
    ctx.restore();
  });

  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius - 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fff9ef';
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#E0D6B8';
  ctx.lineWidth = 4;
  ctx.stroke();
}

export default function RouletteWheel({
  slices,
  prizeIndex,
  spinning,
  spinKey,
  onStopped,
}: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onStoppedRef = useRef(onStopped);
  const [rotation, setRotation] = useState(0);
  const [withTransition, setWithTransition] = useState(false);

  onStoppedRef.current = onStopped;

  useLayoutEffect(() => {
    setRotation(0);
    setWithTransition(false);
  }, [spinKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    drawWheel(canvas, slices);

    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      void fonts.ready.then(() => {
        if (!cancelled && canvasRef.current) {
          drawWheel(canvasRef.current, slices);
        }
      });
    }
    const raf = window.requestAnimationFrame(() => {
      if (!cancelled && canvasRef.current) drawWheel(canvasRef.current, slices);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [slices, spinKey]);

  useEffect(() => {
    if (!spinning || slices.length === 0) return undefined;

    const target = computeTargetRotation(prizeIndex, slices.length, 0);
    let stopTimer = 0;

    const raf = window.requestAnimationFrame(() => {
      setWithTransition(true);
      setRotation(target);
      stopTimer = window.setTimeout(() => onStoppedRef.current(), SPIN_MS);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      if (stopTimer) window.clearTimeout(stopTimer);
    };
  }, [spinning, prizeIndex, slices.length, spinKey]);

  return (
    <div className="roulette-wheel-rotor-wrap">
      <div
        className="roulette-wheel-rotor"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: withTransition
            ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.24, 1)`
            : 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          className="roulette-wheel-canvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
