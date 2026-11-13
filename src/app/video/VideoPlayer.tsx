'use client';

import { useEffect, useRef } from 'react';
import styles from './video.module.css';

type VideoPlayerProps = {
  slug: string;
  width: number;
  height: number;
  className: string;
};

export default function VideoPlayer({ slug, width, height, className }: VideoPlayerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const portrait = height > width;

  function close() {
    dialog.current?.querySelector('video')?.pause();
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
    trigger.current?.focus();
  }

  useEffect(() => () => {
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
  }, []);

  const video = (
    <video
      className={className}
      width={width}
      height={height}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      playsInline
      preload="none"
      poster={`/video/${slug}.webp`}
      aria-labelledby={`${slug}-title`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <source src={`/video/${slug}.mp4`} type="video/mp4" />
      您的浏览器暂不支持此视频，请使用支持 HTML5 视频的浏览器。
    </video>
  );

  if (portrait) {
    return (
      <figure className={styles.iphoneMockup} aria-label="Shots iPhone 17 Pro 样机中的 AI 短剧">
        <div className={styles.iphoneScreen}>{video}</div>
        {/* Existing Shots device artwork, shared with the design portfolio. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.iphoneFrame}
          src="/graphic-design/assets/shots-iphone17pro-deep-blue.png"
          width={1508}
          height={3278}
          alt=""
          aria-hidden="true"
        />
      </figure>
    );
  }

  return (
    <>
      <button
        className={styles.videoLaunch}
        ref={trigger}
        aria-label="居中播放视频"
        aria-describedby={`${slug}-title`}
        onClick={() => {
          previousOverflow.current = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          dialog.current?.showModal();
          dialog.current?.querySelector('video')?.play().catch(() => {});
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/video/${slug}.webp`} width={width} height={height} alt="" />
        <span className={styles.playIcon} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l12-7z" />
          </svg>
        </span>
      </button>
      <dialog
        className={styles.playbackDialog}
        ref={dialog}
        aria-labelledby={`${slug}-title`}
        onClose={close}
        onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      >
        <button className={styles.closePlayer} aria-label="关闭视频" onClick={() => dialog.current?.close()}>×</button>
        {video}
      </dialog>
    </>
  );
}
