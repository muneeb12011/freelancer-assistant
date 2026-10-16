// src/lib/compressImage.js — shrink a photo in the browser before upload (keeps requests small and
// under hosting body limits). Returns a JPEG data URL no larger than ~maxBytes.
export default async function compressImage(file, { maxSide = 1600, maxBytes = 900 * 1024 } = {}) {
  if (!/^image\//.test(file.type)) throw new Error('Choose a photo (JPG, PNG or WEBP).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That image couldn’t be read. Try another photo.'));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    let q = 0.85;
    let out = canvas.toDataURL('image/jpeg', q);
    while (out.length * 0.75 > maxBytes && q > 0.4) { q -= 0.1; out = canvas.toDataURL('image/jpeg', q); }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
