/**
 * Zero-Dependency Accessible Carousel for Homepage Sections
 *
 * Powers Style A (Minimalist Header Cluster) across Photo Roll, Blog, and Log:
 * - Fluid snap scrolling via CSS snap-x snap-mandatory
 * - Dynamic counter pill (`1–3 of 7`, `4–6 of 7`, `5–7 of 7`, or `1 of 7` on mobile)
 * - Circular frosted Prev/Next controls with proper disabled states
 * - Interactive pagination dots (click dot to scroll to item, active pill expands)
 * - Keyboard navigation (ArrowLeft / ArrowRight)
 * - Touch swipe & resize responsiveness
 */

export function initCarousels(): void {
  if (typeof document === 'undefined') return;

  const containers = document.querySelectorAll<HTMLElement>('[data-carousel-container]');
  if (!containers.length) return;

  const initialUpdaters: Array<{ read: () => void; write: () => void }> = [];

  containers.forEach((container) => {
    // Avoid duplicate initialization
    if (container.dataset.carouselInitialized === 'true') return;
    container.dataset.carouselInitialized = 'true';

    const track = container.querySelector<HTMLElement>('.carousel-track');
    const prevBtn = container.querySelector<HTMLButtonElement>('.carousel-prev');
    const nextBtn = container.querySelector<HTMLButtonElement>('.carousel-next');
    const counter = container.querySelector<HTMLElement>('.carousel-counter');
    const dots = container.querySelectorAll<HTMLButtonElement>('.carousel-dot');
    const items = container.querySelectorAll<HTMLElement>('.carousel-item');

    if (!track || items.length === 0) return;
    const total = items.length;

    const getMetrics = () => {
      const first = items[0];
      const second = items[1];
      const itemWidth = first ? first.getBoundingClientRect().width : 300;
      const gap = second
        ? second.getBoundingClientRect().left - (first.getBoundingClientRect().left + itemWidth)
        : 32;
      return { itemWidth, gap: Math.max(0, gap), step: itemWidth + Math.max(0, gap) };
    };

    const getItemTargetLeft = (index: number) => {
      const targetItem = items[Math.max(0, Math.min(index, total - 1))];
      if (!targetItem) return 0;
      return targetItem.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    };

    let cachedState = {
      visibleCount: 1,
      firstVisible: 0,
      lastVisible: 1,
      isStart: true,
      isEnd: false,
      activeIdx: 0,
    };

    const readState = () => {
      const { step } = getMetrics();
      const scrollLeft = track.scrollLeft;
      const trackWidth = track.clientWidth;
      const maxScroll = track.scrollWidth - trackWidth;

      const visibleCount = Math.max(1, Math.min(total, Math.round(trackWidth / step)));
      const isStart = scrollLeft <= 8;
      const isEnd = scrollLeft >= maxScroll - 8;

      let firstVisible = Math.round(scrollLeft / step);
      if (isEnd) {
        firstVisible = Math.max(0, total - visibleCount);
      } else {
        firstVisible = Math.max(0, Math.min(firstVisible, total - visibleCount));
      }

      const lastVisible = isEnd ? total : Math.min(total, firstVisible + visibleCount);
      const activeIdx = isEnd ? total - 1 : firstVisible;

      cachedState = { visibleCount, firstVisible, lastVisible, isStart, isEnd, activeIdx };
    };

    const writeState = () => {
      const { visibleCount, firstVisible, lastVisible, isStart, isEnd, activeIdx } = cachedState;

      // 1. Update counter pill only if text changed
      if (counter) {
        const nextText =
          visibleCount > 1
            ? `${firstVisible + 1}–${lastVisible} of ${total}`
            : `${firstVisible + 1} of ${total}`;
        if (counter.textContent !== nextText) {
          counter.textContent = nextText;
        }
      }

      // 2. Update navigation button states only if changed
      if (prevBtn && prevBtn.disabled !== isStart) {
        prevBtn.disabled = isStart;
      }
      if (nextBtn && nextBtn.disabled !== isEnd) {
        nextBtn.disabled = isEnd;
      }

      // 3. Update pagination dots only if active state changed
      dots.forEach((dot, idx) => {
        const isActive = idx === activeIdx;
        const currentlyActive = dot.getAttribute('aria-current') === 'true';
        if (isActive === currentlyActive) return;

        const indicator = dot.querySelector<HTMLElement>('.carousel-dot-indicator') ?? dot;
        if (isActive) {
          indicator.classList.remove('w-2', 'bg-gray-300', 'dark:bg-gray-700', 'hover:bg-gray-400', 'dark:hover:bg-gray-600', 'group-hover/dot:bg-gray-400', 'dark:group-hover/dot:bg-gray-600');
          indicator.classList.add('w-6', 'bg-amber-500', 'dark:bg-amber-400', 'shadow-xs');
          dot.setAttribute('aria-current', 'true');
        } else {
          indicator.classList.remove('w-6', 'bg-amber-500', 'dark:bg-amber-400', 'shadow-xs');
          indicator.classList.add('w-2', 'bg-gray-300', 'dark:bg-gray-700', 'group-hover/dot:bg-gray-400', 'dark:group-hover/dot:bg-gray-600');
          dot.removeAttribute('aria-current');
        }
      });
    };

    const updateState = () => {
      readState();
      writeState();
    };

    // Handle Previous button click
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const { step } = getMetrics();
        const visibleCount = Math.max(1, Math.round(track.clientWidth / step));
        const currentIdx = Math.round(track.scrollLeft / step);
        const targetIdx = Math.max(0, currentIdx - visibleCount);
        track.scrollTo({ left: getItemTargetLeft(targetIdx), behavior: 'smooth' });
      });
    }

    // Handle Next button click
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const { step } = getMetrics();
        const visibleCount = Math.max(1, Math.round(track.clientWidth / step));
        const currentIdx = Math.round(track.scrollLeft / step);
        const targetIdx = Math.min(total - 1, currentIdx + visibleCount);
        track.scrollTo({ left: getItemTargetLeft(targetIdx), behavior: 'smooth' });
      });
    }

    // Handle Dot clicks
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        track.scrollTo({ left: getItemTargetLeft(idx), behavior: 'smooth' });
      });
    });

    // Keyboard accessibility
    track.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevBtn?.click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextBtn?.click();
      }
    });

    // Optimized scroll synchronization
    let ticking = false;
    track.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updateState();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    // Resize observer (skip initial synchronous observation fire to avoid duplicate reflow)
    if (typeof ResizeObserver !== 'undefined') {
      let initializedResize = false;
      const resizeObserver = new ResizeObserver(() => {
        if (!initializedResize) {
          initializedResize = true;
          return;
        }
        if (!ticking) {
          requestAnimationFrame(() => {
            updateState();
            ticking = false;
          });
          ticking = true;
        }
      });
      resizeObserver.observe(track);
    }

    initialUpdaters.push({ read: readState, write: writeState });
  });

  // Batch all initial DOM reads across all carousels before any DOM writes
  initialUpdaters.forEach((u) => u.read());
  initialUpdaters.forEach((u) => u.write());
}

// Auto-initialize on DOM ready and Astro page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
  } else {
    initCarousels();
  }
}

