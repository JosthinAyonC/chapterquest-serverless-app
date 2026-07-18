import { Canvas, FabricImage } from 'fabric';
import { jsPDF } from 'jspdf';
import type { PdfPageRender } from './pdf-render';

async function composePageImage(
  page: PdfPageRender,
  canvasJson: string | null,
): Promise<string> {
  const element = document.createElement('canvas');
  const fabricCanvas = new Canvas(element, {
    width: page.width,
    height: page.height,
    renderOnAddRemove: false,
  });

  const background = await FabricImage.fromURL(page.dataUrl, { crossOrigin: 'anonymous' });
  background.set({
    selectable: false,
    evented: false,
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    scaleX: page.width / (background.width || page.width),
    scaleY: page.height / (background.height || page.height),
  });
  fabricCanvas.backgroundImage = background;

  if (canvasJson) {
    await fabricCanvas.loadFromJSON(JSON.parse(canvasJson));
  }

  fabricCanvas.requestRenderAll();
  const dataUrl = fabricCanvas.toDataURL({
    format: 'jpeg',
    quality: 0.92,
    multiplier: 1,
  });
  fabricCanvas.dispose();
  return dataUrl;
}

function fitImageToPage(
  doc: jsPDF,
  imageDataUrl: string,
  sourceWidth: number,
  sourceHeight: number,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const scale = Math.min(pageWidth / sourceWidth, pageHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const x = (pageWidth - width) / 2;
  const y = (pageHeight - height) / 2;
  doc.addImage(imageDataUrl, 'JPEG', x, y, width, height);
}

async function buildPdfDocument(
  pages: PdfPageRender[],
  canvasPagesJson: (string | null)[],
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const composite = await composePageImage(page, canvasPagesJson[index] ?? null);
    if (index > 0) doc.addPage();
    fitImageToPage(doc, composite, page.width, page.height);
  }

  return doc;
}

export async function downloadReviewPdf(
  pages: PdfPageRender[],
  canvasPagesJson: (string | null)[],
  downloadName: string,
): Promise<void> {
  const doc = await buildPdfDocument(pages, canvasPagesJson);
  doc.save(downloadName);
}

export async function printReviewPdf(
  pages: PdfPageRender[],
  canvasPagesJson: (string | null)[],
): Promise<void> {
  const doc = await buildPdfDocument(pages, canvasPagesJson);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
}
