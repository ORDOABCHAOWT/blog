export default function PostLoading() {
  return (
    <main
      className="post-shell post-loading"
      aria-busy="true"
      aria-label="正在打开文章"
    >
      <header className="post-hero">
        <div className="post-hero-top" aria-hidden="true">
          <span className="post-loading-line is-back" />
          <span className="post-loading-line is-stamp" />
        </div>

        <div className="post-hero-copy">
          <p className="eyebrow" role="status" aria-live="polite">
            正在打开文章…
          </p>
          <div className="post-loading-title" aria-hidden="true">
            <span className="post-loading-line" />
            <span className="post-loading-line is-short" />
          </div>
        </div>
      </header>

      <div className="post-loading-body" aria-hidden="true">
        <span className="post-loading-line" />
        <span className="post-loading-line" />
        <span className="post-loading-line is-medium" />
      </div>
    </main>
  );
}
