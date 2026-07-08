interface CircularTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  running: boolean;
  compact?: boolean;
  mini?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CircularTimer({
  remainingSeconds,
  totalSeconds,
  running,
  compact = false,
  mini = false,
}: CircularTimerProps) {
  const size = mini ? 96 : compact ? 128 : 220;
  const radius = mini ? 38 : compact ? 52 : 90;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  return (
    <div
      className={`circular-timer${compact ? ' circular-timer--compact' : ''}${mini ? ' circular-timer--mini' : ''}`}
      role="timer"
      aria-live={running ? 'polite' : 'off'}
      aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="circular-timer-track"
          cx={center}
          cy={center}
          r={radius}
        />
        <circle
          className="circular-timer-progress"
          cx={center}
          cy={center}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="circular-timer-label">
        <span className="circular-timer-time">{formatTime(remainingSeconds)}</span>
        {!compact && !mini ? (
          <span className="circular-timer-caption">
            {running ? 'Reading time' : 'Ready to start'}
          </span>
        ) : null}
      </div>
    </div>
  );
}
