/**
 * Progressive Enhancement: Border Beam Viewport Entrance Animation
 *
 * Automatically observes clickable cards (.border-beam-card) as they enter
 * the viewport for the first time, playing a single, graceful 360° perimeter
 * beam sweep.
 *
 * Subsequent hover interactions continue to loop infinitely as standard.
 */

const BEAM_SELECTOR = '.border-beam-card';
let activeObserver: IntersectionObserver | null = null;

function initBorderBeamObserver(): void {
  // Respect user preference for reduced motion
  if (typeof window === 'undefined' || !window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  if (activeObserver) {
    activeObserver.disconnect();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let batchIndex = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const card = entry.target as HTMLElement;
        observer.unobserve(card);

        if (card.dataset.beamAnimated) continue;
        card.dataset.beamAnimated = 'true';

        // Subtle stagger for cards entering in the exact same intersection batch
        const delayMs = Math.min(batchIndex * 100, 300);
        batchIndex++;

        if (delayMs > 0) {
          card.style.setProperty('--beam-delay', `${delayMs}ms`);
        }
        card.classList.add('border-beam-active');

        const cleanup = () => {
          card.classList.remove('border-beam-active');
          card.style.removeProperty('--beam-delay');
        };

        // When mouse hovers, transition immediately to continuous hover spin
        card.addEventListener('mouseenter', cleanup, { once: true });

        // Clean up when entrance animation completes
        card.addEventListener(
          'animationend',
          (e: AnimationEvent) => {
            if (e.animationName === 'border-beam-entrance') {
              cleanup();
            }
          },
          { once: true }
        );

        // Safety fallback timer (delay + 1.1s duration + buffer)
        setTimeout(cleanup, delayMs + 1500);
      }
    },
    {
      root: null,
      rootMargin: '0px 0px -30px 0px',
      threshold: 0.1,
    }
  );

  activeObserver = observer;

  const cards = document.querySelectorAll<HTMLElement>(BEAM_SELECTOR);
  cards.forEach((card) => {
    if (!card.dataset.beamAnimated) {
      observer.observe(card);
    }
  });
}

// Initialize on DOM ready or immediately if already loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBorderBeamObserver);
  } else {
    initBorderBeamObserver();
  }
}

