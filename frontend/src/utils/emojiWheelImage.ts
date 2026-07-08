const EMOJI_FONT =
  '700 128px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", emoji, sans-serif';

const DATA_URL_CACHE = new Map<string, string>();
const IMAGE_CACHE = new Map<string, HTMLImageElement>();

function renderEmojiDataUrl(emoji: string): string {
  const cached = DATA_URL_CACHE.get(emoji);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  const size = 192;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, size, size);
  ctx.font = EMOJI_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + 4);

  const uri = canvas.toDataURL('image/png');
  DATA_URL_CACHE.set(emoji, uri);
  return uri;
}

function loadEmojiImage(emoji: string): Promise<HTMLImageElement> {
  const cached = IMAGE_CACHE.get(emoji);
  if (cached?.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const uri = renderEmojiDataUrl(emoji);
    const img = new Image();
    img.onload = () => {
      IMAGE_CACHE.set(emoji, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load emoji image: ${emoji}`));
    img.src = uri;
  });
}

export function preloadEmojiWheelImages(emojis: string[]): Promise<void> {
  const unique = [...new Set(emojis)];
  return Promise.all(unique.map((emoji) => loadEmojiImage(emoji))).then(() => undefined);
}

export function getEmojiImageElement(emoji: string): HTMLImageElement | null {
  const cached = IMAGE_CACHE.get(emoji);
  if (cached?.complete && cached.naturalWidth > 0) return cached;
  return null;
}
