import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import CircularTimer from './CircularTimer';
import { useIsMobile } from '../hooks/useIsMobile';

interface DraggableReadingTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  running: boolean;
}

function getHeaderOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    '--header-height',
  );
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 72;
}

export default function DraggableReadingTimer({
  remainingSeconds,
  totalSeconds,
  running,
}: DraggableReadingTimerProps) {
  const isMobile = useIsMobile();
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  const placeDefault = useCallback(() => {
    const width = widgetRef.current?.offsetWidth ?? (isMobile ? 96 : 128);
    setPosition({
      x: Math.max(12, window.innerWidth - width - 16),
      y: getHeaderOffset() + 16,
    });
  }, [isMobile]);

  useEffect(() => {
    placeDefault();
    window.addEventListener('resize', placeDefault);
    return () => window.removeEventListener('resize', placeDefault);
  }, [placeDefault]);

  const clampPosition = useCallback((x: number, y: number) => {
    const width = widgetRef.current?.offsetWidth ?? 128;
    const height = widgetRef.current?.offsetHeight ?? 128;
    const maxX = Math.max(12, window.innerWidth - width - 12);
    const maxY = Math.max(getHeaderOffset() + 8, window.innerHeight - height - 12);

    return {
      x: Math.min(Math.max(12, x), maxX),
      y: Math.min(Math.max(getHeaderOffset() + 8, y), maxY),
    };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (position === null) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setPosition(
      clampPosition(
        drag.originX + (event.clientX - drag.startX),
        drag.originY + (event.clientY - drag.startY),
      ),
    );
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (position === null) return null;

  return createPortal(
    <div
      ref={widgetRef}
      className="reading-timer-widget"
      style={{ left: position.x, top: position.y }}
      role="group"
      aria-label="Reading timer. Drag to reposition."
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span className="reading-timer-widget-grip" aria-hidden="true">
        ⠿
      </span>
      <CircularTimer
        remainingSeconds={remainingSeconds}
        totalSeconds={totalSeconds}
        running={running}
        compact
        mini={isMobile}
      />
    </div>,
    document.body,
  );
}
