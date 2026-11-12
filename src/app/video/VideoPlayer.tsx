'use client';

type VideoPlayerProps = {
  slug: string;
  width: number;
  height: number;
  className: string;
};

export default function VideoPlayer({ slug, width, height, className }: VideoPlayerProps) {
  return (
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
}
