'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Wraps the app to give every internal navigation a book-flip animation.
 *
 * Approach (works in all browsers — no View Transitions API dependency):
 *   1. Intercept clicks on internal <a> elements during capture phase
 *      so we beat Next's Link handler.
 *   2. Capture a snapshot of the current page using a clone of <body>
 *      and place it inside an overlay element.
 *   3. Run a CSS keyframe flip on the overlay while we call
 *      router.push() to navigate underneath.
 *   4. Remove the overlay when its animation ends.
 *
 * The book-flip itself (rotateY around the spine + shadow) is defined
 * in globals.css under the `.page-flip-overlay` class.
 */
export default function PageTransition() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      const fullPath = `${url.pathname}${url.search}${url.hash}`;
      const goingToPost = url.pathname.startsWith('/posts/');
      const leavingPost = window.location.pathname.startsWith('/posts/');
      const direction =
        goingToPost && !leavingPost ? 'forward' : leavingPost ? 'backward' : 'forward';

      if (reduceMotion) {
        router.push(fullPath);
        return;
      }

      // Build an overlay that captures a snapshot of the current page.
      const overlay = document.createElement('div');
      overlay.className = 'page-flip-overlay';
      overlay.dataset.direction = direction;
      const inner = document.createElement('div');
      inner.className = 'page-flip-overlay__page';
      const snapshot = document.createElement('div');
      snapshot.className = 'page-flip-overlay__snapshot';

      // Clone the body content (skip scripts/styles to keep it cheap).
      // We translate by -scrollY so the snapshot lines up with what the
      // user is actually seeing.
      const scrollY = window.scrollY;
      Array.from(document.body.children).forEach((child) => {
        if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') return;
        if ((child as HTMLElement).classList?.contains('page-flip-overlay')) return;
        const clone = child.cloneNode(true) as HTMLElement;
        // Strip ids on cloned elements to avoid duplicate-id warnings
        clone.removeAttribute('id');
        clone.querySelectorAll?.('[id]').forEach((el) => el.removeAttribute('id'));
        snapshot.appendChild(clone);
      });
      snapshot.style.transform = `translateY(${-scrollY}px)`;
      inner.appendChild(snapshot);
      overlay.appendChild(inner);
      document.body.appendChild(overlay);

      // Force a reflow so the starting frame is committed before the
      // animation class kicks in.
      void overlay.offsetWidth;
      overlay.classList.add('is-flipping');

      // Navigate immediately. Underneath the overlay, Next.js fetches
      // and renders the new page; when the overlay finishes flipping,
      // the new page is ready.
      router.push(fullPath);

      // Remove the overlay once the flip animation ends.
      const cleanup = () => {
        overlay.removeEventListener('animationend', cleanup);
        overlay.remove();
      };
      overlay.addEventListener('animationend', cleanup);
      // Safety timeout (animation should be ~700ms).
      window.setTimeout(cleanup, 1400);
    };

    document.addEventListener('click', onClick, { capture: true });
    return () =>
      document.removeEventListener(
        'click',
        onClick,
        { capture: true } as EventListenerOptions
      );
  }, [router]);

  return null;
}
