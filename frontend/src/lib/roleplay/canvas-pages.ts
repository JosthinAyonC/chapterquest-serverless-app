export function pageCanvasHasContent(canvasJson: string | null): boolean {
  if (!canvasJson) return false;
  try {
    const parsed = JSON.parse(canvasJson) as { objects?: unknown[] };
    return Array.isArray(parsed.objects) && parsed.objects.length > 0;
  } catch {
    return false;
  }
}

export function getIncompletePageNumbers(pagesWithContent: boolean[]): number[] {
  return pagesWithContent.reduce<number[]>((missing, hasContent, index) => {
    if (!hasContent) missing.push(index + 1);
    return missing;
  }, []);
}

export function allPagesHaveContent(pagesWithContent: boolean[]): boolean {
  return pagesWithContent.length > 0 && pagesWithContent.every(Boolean);
}

export function buildIncompletePagesMessage(missingPages: number[]): string {
  if (missingPages.length === 0) return '';
  if (missingPages.length === 1) {
    return `Page ${missingPages[0]} still needs your answers. Both pages are required.`;
  }
  const labels = missingPages.map((page) => `Page ${page}`).join(' and ');
  return `${labels} still need your answers. Both pages are required.`;
}
