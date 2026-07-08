interface PageLoaderProps {
  label?: string;
  compact?: boolean;
}

export default function PageLoader({
  label = 'Loading',
  compact = false,
}: PageLoaderProps) {
  return (
    <div
      className={`page-loader${compact ? ' page-loader--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="page-loader-book" aria-hidden="true">
        <span className="page-loader-page page-loader-page--left" />
        <span className="page-loader-page page-loader-page--right" />
        <span className="page-loader-spine" />
      </div>
      <p className="page-loader-label">{label}</p>
    </div>
  );
}
