/**
 * Client-side canvas compressor to shrink large baggage files before upload
 */
export const compressBaggagePhoto = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    // Skip compression if the file format isn't an image asset safely
    if (!file.type.startsWith('image/')) return resolve(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Balance aspect proportions dynamically if width exceeds maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas state context array down to optimized binary JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to raw file if conversion pipeline clips
            }
          },
          'image/jpeg',
          quality // 0.7 triggers efficient 70% compression stripping metadata
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};
