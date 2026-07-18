import { useEffect, useId, useRef, useState } from 'react';

interface BookCardSummaryProps {
  text: string;
}

export default function BookCardSummary({ text }: BookCardSummaryProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const summaryId = useId();

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const measure = () => {
      const distance = content.scrollHeight - viewport.clientHeight;
      const hasOverflow = distance > 6;
      setOverflows(hasOverflow);
      if (hasOverflow) {
        content.style.setProperty('--scroll-distance', `-${distance}px`);
      } else {
        content.style.removeProperty('--scroll-distance');
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div
      className={`book-card-summary-block${overflows ? ' book-card-summary-block--overflow' : ''}${expanded ? ' book-card-summary-block--expanded' : ''}`}
    >
      <div ref={viewportRef} className="book-card-summary-viewport">
        <p ref={contentRef} id={summaryId} className="book-card-summary">
          {text}
        </p>
      </div>
      {overflows ? (
        <button
          type="button"
          className="book-card-summary-toggle"
          aria-expanded={expanded}
          aria-controls={summaryId}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Show less' : 'Read full description'}
        </button>
      ) : null}
    </div>
  );
}
