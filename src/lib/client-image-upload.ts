export const MAX_IMAGE_UPLOAD_DIMENSION = 1600;
export const IMAGE_UPLOAD_QUALITY = 0.78;
export const IMAGE_UPLOAD_MIME_TYPE = 'image/webp';

function getCompressedFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${baseName}.webp`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image decode failed'));
    };
    image.src = objectUrl;
  });
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

export async function compressImageForUpload(file: File) {
  if (file.type === 'image/gif') {
    return file;
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file;
  }

  const image = await loadImage(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale =
    longestEdge > MAX_IMAGE_UPLOAD_DIMENSION
      ? MAX_IMAGE_UPLOAD_DIMENSION / longestEdge
      : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);

  const blob = await encodeCanvas(
    canvas,
    IMAGE_UPLOAD_MIME_TYPE,
    IMAGE_UPLOAD_QUALITY
  );

  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], getCompressedFileName(file.name), {
    type: IMAGE_UPLOAD_MIME_TYPE,
    lastModified: Date.now(),
  });
}

export async function uploadImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件！');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('图片大小不能超过 10MB！');
  }

  const uploadFile = await compressImageForUpload(file);
  const formData = new FormData();
  formData.append('file', uploadFile);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '未知错误');
  }

  return {
    markdown: data.markdown as string,
    url: data.url as string | undefined,
  };
}
