/** Canvas-based preprocessing for nutrition label OCR */

export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
}

export function canvasFromImage(img, maxWidth = 1600) {
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Contrast + brightness boost for label text */
export function enhanceForOcr(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  const contrast = 1.35;
  const brightness = 8;

  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      d[i + c] = clamp((d[i + c] - 128) * contrast + 128 + brightness, 0, 255);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Simple sharpen kernel */
export function sharpen(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const src = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + ch;
            sum += src.data[idx] * kernel[ki++];
          }
        }
        const oi = (y * width + x) * 4 + ch;
        out.data[oi] = clamp(sum, 0, 255);
      }
      out.data[(y * width + x) * 4 + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** Grayscale for OCR accuracy */
export function toGrayscale(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Center-weighted crop — nutrition tables usually in middle of label photo */
export function autoCropLabel(canvas, ratio = 0.85) {
  const w = Math.round(canvas.width * ratio);
  const h = Math.round(canvas.height * ratio);
  const x = Math.round((canvas.width - w) / 2);
  const y = Math.round((canvas.height - h) / 2);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return out;
}

export async function preprocessLabelImage(dataUrl) {
  const img = await loadImage(dataUrl);
  let canvas = canvasFromImage(img);
  canvas = autoCropLabel(canvas);
  canvas = enhanceForOcr(canvas);
  canvas = sharpen(canvas);
  canvas = toGrayscale(canvas);
  return canvas.toDataURL('image/png');
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
