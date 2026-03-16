/**
 * Compression d'image via Canvas HTML5.
 * Retourne un base64 JPEG compressé + les tailles avant/après.
 */

export interface CompressionResult {
  base64: string;
  originalSize: number;
  compressedSize: number;
}

export async function compressImage(
  file: File,
  maxWidthPx = 1200,
  qualityJpeg = 0.75
): Promise<CompressionResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erreur chargement image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidthPx) {
          height = Math.round(height * (maxWidthPx / width));
          width = maxWidthPx;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas non supporté')); return; }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', qualityJpeg);
        const compressedSize = Math.round((base64.length - 'data:image/jpeg;base64,'.length) * 0.75);

        resolve({ base64, originalSize, compressedSize });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
