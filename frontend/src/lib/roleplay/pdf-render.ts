import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PdfPageRender {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

const RENDER_SCALE = 1.5;

export async function renderPdfPages(pdfPath: string): Promise<PdfPageRender[]> {
  const doc = await pdfjs.getDocument({ url: pdfPath }).promise;
  const pages: PdfPageRender[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport, canvas }).promise;

    pages.push({
      pageNumber,
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}
