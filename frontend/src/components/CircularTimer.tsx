interface CircularTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  running: boolean;
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
}: CircularTimerProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  return (
    <div
      className="circular-timer"
      role="timer"
      aria-live={running ? 'polite' : 'off'}
      aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
    >
      <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
        <circle
          className="circular-timer-track"
          cx="110"
          cy="110"
          r={radius}
        />
        <circle
          className="circular-timer-progress"
          cx="110"
          cy="110"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="circular-timer-label">
        <span className="circular-timer-time">{formatTime(remainingSeconds)}</span>
        <span className="circular-timer-caption">
          {running ? 'Reading time' : 'Ready to start'}
        </span>
      </div>
    </div>
  );
}
