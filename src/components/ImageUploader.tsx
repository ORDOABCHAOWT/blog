'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onUploadSuccess: (markdown: string) => void;
}

const MAX_IMAGE_UPLOAD_DIMENSION = 1600;
const IMAGE_UPLOAD_QUALITY = 0.78;
const IMAGE_UPLOAD_MIME_TYPE = 'image/webp';

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

async function compressImageForUpload(file: File) {
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

export default function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！');
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB！');
      return;
    }

    setUploading(true);

    try {
      const uploadFile = await compressImageForUpload(file);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onUploadSuccess(data.markdown);
        alert('✅ 图片上传成功！');
      } else {
        alert(`上传失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-uploader-root mb-4">
      <div
        className={`image-uploader-drop ${dragActive ? 'is-active' : ''} ${uploading ? 'is-uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={uploading ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="image-uploader-spinner mx-auto"></div>
            <p className="image-uploader-status">上传中…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <svg
              className="image-uploader-icon mx-auto"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="image-uploader-copy">
              <p className="image-uploader-cta">点击上传</p>
              <p className="image-uploader-hint">或拖拽图片到此处</p>
            </div>
            <p className="image-uploader-meta">支持 JPG · PNG · GIF · WebP（自动压缩，最大 10MB）</p>
          </div>
        )}
      </div>
      <style jsx global>{`
        .image-uploader-drop {
          position: relative;
          padding: 2.4rem 1.5rem;
          border: 1px dashed var(--site-border);
          border-radius: 14px;
          background: var(--site-panel);
          text-align: center;
          cursor: pointer;
          transition: border-color 220ms ease, background-color 220ms ease,
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .image-uploader-drop:hover {
          border-color: var(--site-accent);
          background: var(--site-panel-strong);
        }
        .image-uploader-drop.is-active {
          border-color: var(--site-accent);
          border-style: solid;
          background: color-mix(in srgb, var(--site-accent) 8%, var(--site-panel));
          transform: translateY(-1px);
        }
        .image-uploader-drop.is-uploading {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .image-uploader-icon {
          width: 2.8rem;
          height: 2.8rem;
          color: var(--site-muted);
        }
        .image-uploader-copy {
          font-family: var(--font-editorial-display);
        }
        .image-uploader-cta {
          margin: 0;
          color: var(--site-ink);
          font-size: 1.02rem;
          letter-spacing: var(--tracking-body);
        }
        .image-uploader-hint {
          margin: 0.2rem 0 0;
          color: var(--site-muted);
          font-size: 0.92rem;
          font-style: italic;
        }
        .image-uploader-meta {
          margin: 0;
          color: var(--site-muted);
          font-family: var(--font-editorial-mono), "SFMono-Regular", Consolas, monospace;
          font-size: 0.7rem;
          letter-spacing: var(--tracking-meta);
          text-transform: uppercase;
        }
        .image-uploader-status {
          margin: 0;
          color: var(--site-muted);
          font-family: var(--font-editorial-mono), monospace;
          font-size: 0.78rem;
          letter-spacing: var(--tracking-meta);
          text-transform: uppercase;
        }
        .image-uploader-spinner {
          width: 2.2rem;
          height: 2.2rem;
          border: 2px solid var(--site-border);
          border-top-color: var(--site-accent);
          border-radius: 50%;
          animation: image-uploader-spin 900ms linear infinite;
        }
        @keyframes image-uploader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
