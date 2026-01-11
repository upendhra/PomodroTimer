export function generateWallpaperThumbnail(
  imageUrl: string,
  width: number = 256,
  height: number = 256
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const img = new Image();
    // Allow cross-origin images
    img.crossOrigin = 'anonymous';

    // Set timeout for image loading
    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      const aspectRatio = img.width / img.height;
      const canvasAspectRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (aspectRatio > canvasAspectRatio) {
        drawWidth = height * aspectRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / aspectRatio;
        offsetY = (height - drawHeight) / 2;
      }

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Higher quality
        resolve(dataUrl);
      } catch (error) {
        reject(new Error('Failed to create thumbnail data URL'));
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      // Return null instead of broken URL as fallback
      console.warn(`Failed to load image: ${imageUrl}, returning null`);
      resolve(null);
    };

    img.src = imageUrl;
  });
}

export function generateColorSchemeThumbnail(
  backgroundColor: string,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  width: number = 150,
  height: number = 100
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = primaryColor;
  ctx.fillRect(10, 10, 40, 80);

  ctx.fillStyle = secondaryColor;
  ctx.fillRect(55, 10, 40, 80);

  ctx.fillStyle = accentColor;
  ctx.fillRect(100, 10, 40, 80);

  return canvas.toDataURL('image/png');
}
