// Resizes an image file down to a reasonable max dimension and re-encodes
// it as JPEG, both to keep the upload fast on mobile data and to stay
// comfortably under Vercel's serverless function body-size limit.
export function resizeImageToBase64(file, maxDimension = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = () => reject(new Error('تعذر فتح الصورة'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('تعذرت قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

export async function extractFromImage(file, kind) {
  const base64 = await resizeImageToBase64(file);
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mediaType: 'image/jpeg', kind })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذر تحليل الصورة');
  }
  return data.rows || [];
}
