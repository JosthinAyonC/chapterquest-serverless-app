import { Control, IText, type Canvas, type FabricObject } from 'fabric';

export const TEXT_PLACEHOLDER = 'Type here';
const PLACEHOLDER_FILL = 'rgba(128, 0, 0, 0.42)';

function renderDeleteControl(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
): void {
  const radius = 10;
  ctx.save();
  ctx.translate(left, top);
  ctx.fillStyle = '#800000';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fffefc';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(4, 4);
  ctx.moveTo(4, -4);
  ctx.lineTo(-4, 4);
  ctx.stroke();
  ctx.restore();
}

export function isPlaceholderText(text: IText): boolean {
  return text.get('data-is-placeholder') === true;
}

export function attachDeleteControl(object: FabricObject, onRemove: () => void): void {
  object.controls.deleteControl = new Control({
    x: 0.5,
    y: -0.5,
    offsetX: 14,
    offsetY: -14,
    cursorStyle: 'pointer',
    sizeX: 22,
    sizeY: 22,
    mouseUpHandler: (_eventData, transform) => {
      const target = transform.target;
      const canvas = target.canvas;
      if (!canvas) return false;
      canvas.remove(target);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      onRemove();
      return true;
    },
    render: (ctx, left, top) => {
      renderDeleteControl(ctx, left, top);
    },
  });
}

export function attachDeleteControlIfNeeded(
  object: FabricObject,
  onRemove: () => void,
): void {
  if (object.controls.deleteControl) return;
  attachDeleteControl(object, onRemove);
}

export function createEditorText(
  options: {
    left: number;
    top: number;
    fill: string;
    fontSize?: number;
    fontFamily?: string;
  },
  onRemove: () => void,
  immediateEdit = false,
): IText {
  const text = new IText(immediateEdit ? '' : TEXT_PLACEHOLDER, {
    left: options.left,
    top: options.top,
    fill: immediateEdit ? options.fill : PLACEHOLDER_FILL,
    fontSize: options.fontSize ?? 22,
    fontFamily: options.fontFamily ?? 'Tenor Sans, sans-serif',
  });
  text.set('data-is-placeholder', true);
  attachDeleteControl(text, onRemove);
  return text;
}

export function prepareTextForEditing(text: IText, fillColor: string): void {
  if (text.text === TEXT_PLACEHOLDER || isPlaceholderText(text)) {
    text.set({
      text: '',
      fill: fillColor,
    });
    text.set('data-is-placeholder', false);
  }
}

export function stripPlaceholderFromText(text: IText, fillColor: string): boolean {
  if (!text.text.includes(TEXT_PLACEHOLDER)) return false;
  text.set({
    text: text.text.replaceAll(TEXT_PLACEHOLDER, ''),
    fill: fillColor,
  });
  text.set('data-is-placeholder', false);
  return true;
}

export function handleTextEditingEntered(text: IText, fillColor: string): void {
  prepareTextForEditing(text, fillColor);
}

export function handleTextEditingExited(text: IText, canvas: Canvas): boolean {
  const value = text.text.trim();
  if (value === '' || value === TEXT_PLACEHOLDER || isPlaceholderText(text)) {
    canvas.remove(text);
    canvas.discardActiveObject();
    return true;
  }
  return false;
}

export function setupCanvasObjectControls(
  canvas: Canvas,
  onRemove: () => void,
): void {
  canvas.getObjects().forEach((object) => {
    attachDeleteControlIfNeeded(object, onRemove);

    if (!(object instanceof IText)) return;
    if (object.text.trim() === '' || object.text === TEXT_PLACEHOLDER) {
      object.set({
        text: TEXT_PLACEHOLDER,
        fill: PLACEHOLDER_FILL,
      });
      object.set('data-is-placeholder', true);
    } else {
      object.set('data-is-placeholder', false);
    }
  });
}
