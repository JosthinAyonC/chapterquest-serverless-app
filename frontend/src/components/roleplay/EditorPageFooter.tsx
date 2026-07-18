export interface EditorPageFooterProps {
  activePageIndex: number;
  pageCount: number;
  pagesWithContent: boolean[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (pageIndex: number) => void;
}

export default function EditorPageFooter({
  activePageIndex,
  pageCount,
  pagesWithContent,
  onPrevPage,
  onNextPage,
  onGoToPage,
}: EditorPageFooterProps) {
  const canGoPrev = activePageIndex > 0;
  const canGoNext = activePageIndex < pageCount - 1;

  return (
    <div className="roleplay-editor-page-footer">
      <p className="roleplay-editor-page-footer-note">
        This worksheet has {pageCount} pages. Complete both before printing or finishing.
      </p>

      <div className="roleplay-editor-page-nav" aria-label="Worksheet pages">
        <button
          type="button"
          className="roleplay-editor-page-arrow"
          disabled={!canGoPrev}
          aria-label="Previous page"
          onClick={onPrevPage}
        >
          ‹
        </button>

        <div className="roleplay-editor-page-indicators">
          {Array.from({ length: pageCount }, (_, index) => {
            const isActive = index === activePageIndex;
            const hasContent = pagesWithContent[index] ?? false;
            return (
              <button
                key={index}
                type="button"
                className={`roleplay-editor-page-pill${
                  isActive ? ' roleplay-editor-page-pill--active' : ''
                }${hasContent ? ' roleplay-editor-page-pill--done' : ' roleplay-editor-page-pill--pending'}`}
                aria-label={`Go to page ${index + 1}${hasContent ? ', completed' : ', not started'}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onGoToPage(index)}
              >
                <span className="roleplay-editor-page-pill-label">Page {index + 1}</span>
                <span className="roleplay-editor-page-pill-status" aria-hidden="true">
                  {hasContent ? '✓' : '•'}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="roleplay-editor-page-arrow"
          disabled={!canGoNext}
          aria-label="Next page"
          onClick={onNextPage}
        >
          ›
        </button>
      </div>

      <p className="roleplay-editor-page-counter">
        Page {activePageIndex + 1} of {pageCount}
        {!pagesWithContent[activePageIndex] ? ' — add your answers on this page' : null}
      </p>
    </div>
  );
}
