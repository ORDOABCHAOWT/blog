'use client';

import { useState, useRef } from 'react';
import { uploadImageFile } from '@/lib/client-image-upload';

interface ImageUploaderProps {
  onUploadSuccess: (markdown: string) => void;
}

export default function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);

    try {
      const data = await uploadImageFile(file);
      onUploadSuccess(data.markdown);
      alert('✅ 图片上传成功！');
    } catch (error) {
      alert(`上传失败: ${error instanceof Error ? error.message : '请重试'}`);
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
          border: 1px dashed color-mix(in srgb, var(--site-border) 96%, transparent);
          border-radius: 16px;
          background: color-mix(
            in srgb,
            var(--site-panel-strong) 94%,
            var(--site-background)
          );
          text-align: center;
          cursor: pointer;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.68) inset,
            0 8px 24px color-mix(in srgb, var(--site-shadow) 42%, transparent);
          transition: border-color 160ms ease, background-color 160ms ease,
            transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .image-uploader-drop:hover {
          border-color: #0071e3;
          background: var(--site-panel-strong);
        }
        .image-uploader-drop.is-active {
          border-color: #0071e3;
          border-style: solid;
          background: color-mix(in srgb, #0071e3 7%, var(--site-panel-strong));
          transform: translateY(-1px);
        }
        .image-uploader-drop.is-uploading {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .image-uploader-icon {
          width: 2.8rem;
          height: 2.8rem;
          color: #0071e3;
        }
        .image-uploader-copy {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
        }
        .image-uploader-cta {
          margin: 0;
          color: var(--site-ink);
          font-size: 0.96rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .image-uploader-hint {
          margin: 0.2rem 0 0;
          color: var(--site-muted);
          font-size: 0.84rem;
          font-style: normal;
        }
        .image-uploader-meta {
          margin: 0;
          color: var(--site-muted);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 0.68rem;
          letter-spacing: -0.002em;
          text-transform: none;
        }
        .image-uploader-status {
          margin: 0;
          color: var(--site-muted);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: -0.005em;
          text-transform: none;
        }
        .image-uploader-spinner {
          width: 2.2rem;
          height: 2.2rem;
          border: 2px solid var(--site-border);
          border-top-color: #0071e3;
          border-radius: 50%;
          animation: image-uploader-spin 900ms linear infinite;
        }
        @media (prefers-color-scheme: dark) {
          .image-uploader-icon {
            color: #2997ff;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .image-uploader-drop {
            transition-duration: 0.01ms;
          }
          .image-uploader-drop.is-active {
            transform: none;
          }
        }
        @keyframes image-uploader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
