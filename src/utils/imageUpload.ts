export interface ImageCompressOptions {
  maxWidth?: number;
  quality?: number;
  maxChars?: number;
}

const DEFAULT_MAX_WIDTH = 400;
const DEFAULT_QUALITY = 0.5;
const DEFAULT_MAX_CHARS = 25000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดระหว่างอ่านไฟล์รูปภาพ'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพที่รองรับ'));
    img.src = src;
  });
}

/**
 * Resize and compress any uploaded image to JPEG (maxWidth 400px, quality 0.5)
 * so Base64 strings stay compact (< 25,000 chars) and safe for Google Sheets cells.
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressOptions = {},
): Promise<string> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const initialQuality = options.quality ?? DEFAULT_QUALITY;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(rawDataUrl);

  let targetWidth = Math.min(img.width || maxWidth, maxWidth);
  let targetHeight = Math.max(1, Math.round((img.height / (img.width || 1)) * targetWidth));
  let quality = initialQuality;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('เบราว์เซอร์ไม่รองรับการบีบอัดรูปภาพ Canvas');
  }

  let output = '';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    output = canvas.toDataURL('image/jpeg', quality);
    if (output.length <= maxChars) {
      return output;
    }

    // Step down quality first, then dimensions if still over 25,000 chars
    if (quality > 0.25) {
      quality = Math.max(0.2, Math.round((quality - 0.1) * 10) / 10);
    } else {
      targetWidth = Math.max(180, Math.round(targetWidth * 0.78));
      targetHeight = Math.max(1, Math.round((img.height / (img.width || 1)) * targetWidth));
    }
  }

  return output;
}
