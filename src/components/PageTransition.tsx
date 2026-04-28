'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Wraps the app to give every internal navigation a subtle book-flip
 * transition.  Mechanism:
 *
 *   1. Intercept clicks on internal <a> elements.
 *   2. If the browser supports the View Transitions API, kick off
 *      `document.startViewTransition(() => router.push(href))`.
 *   3. The named CSS animations defined in globals.css drive the flip.
 *
 * Browsers without the API (e.g. Firefox) fall through to the default
 * Next.js navigation, so nothing breaks.
 */
export default function PageTransition() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Feature-detect View Transitions API.
    const supportsVT =
      typeof (document as any).startViewTransition === 'function';
    if (!supportsVT) return;

    const onClick = (event: MouseEvent) => {
      // Only handle plain left-click without modifiers.
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a');
      if (!anchor) return;
      // Skip external + new-tab + download
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Skip anchors that are non-internal navigation
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      // Same-origin internal links only
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Skip if same URL
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      const fullPath = `${url.pathname}${url.search}${url.hash}`;
      // Pick direction: list -> post = forward (open book), post -> elsewhere = backward
      const goingToPost = url.pathname.startsWith('/posts/');
      const leavingPost = window.location.pathname.startsWith('/posts/');
      const direction =
        goingToPost && !leavingPost ? 'forward' : leavingPost ? 'backward' : 'forward';
      document.documentElement.dataset.transition = direction;

      const vt = (document as any).startViewTransition(() => {
        router.push(fullPath);
      });
      // Clean up the data attribute after the animation finishes
      vt.finished.finally(() => {
        delete document.documentElement.dataset.transition;
      });
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [router]);

  return null;
}
