let delegatedListenersBound = false;

function resolveTooltipPair(target: EventTarget | null): {
  trigger: HTMLElement;
  bubble: HTMLElement;
} | null {
  if (!(target instanceof Element)) return null;
  const trigger = target.closest<HTMLElement>('.tech-tooltip-trigger');
  if (!trigger) return null;
  const wrapper = trigger.closest<HTMLElement>('.tech-tooltip-wrapper');
  const bubble = wrapper?.querySelector<HTMLElement>('.tech-tooltip-bubble');
  if (!bubble) return null;
  return { trigger, bubble };
}

function showTooltip(trigger: HTMLElement, bubble: HTMLElement): void {
  // Preserve native title for screen readers / fallbacks without duplicate OS popup
  const currentTitle = trigger.getAttribute('title');
  if (currentTitle && !trigger.hasAttribute('data-original-title')) {
    trigger.setAttribute('data-original-title', currentTitle);
  }
  if (trigger.hasAttribute('data-original-title')) {
    trigger.removeAttribute('title');
  }

  // Viewport collision checking
  const triggerRect = trigger.getBoundingClientRect();
  const bubbleHeight = bubble.offsetHeight || 120;
  const spaceAbove = triggerRect.top;

  if (spaceAbove < bubbleHeight + 20) {
    bubble.classList.add('is-flipped');
  } else {
    bubble.classList.remove('is-flipped');
  }

  // Check horizontal bounds against container and viewport
  const viewportWidth = window.innerWidth;
  const bubbleWidth = bubble.offsetWidth || 300;
  const triggerCenter = triggerRect.left + triggerRect.width / 2;

  // Viewport bounds
  const minViewportLeft = 12;
  const maxViewportRight = viewportWidth - 12;

  // Card / container bounds
  const container = trigger.closest<HTMLElement>('.border-beam-card, .prose, article, main');
  let minLeft = minViewportLeft;
  let maxRight = maxViewportRight;

  if (container) {
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width >= bubbleWidth + 24) {
      minLeft = Math.max(minViewportLeft, containerRect.left + 12);
      maxRight = Math.min(maxViewportRight, containerRect.right - 12);
    }
  }

  let offset = 0;
  const leftEdge = triggerCenter - bubbleWidth / 2;
  const rightEdge = triggerCenter + bubbleWidth / 2;

  if (leftEdge < minLeft) {
    offset = minLeft - leftEdge;
  } else if (rightEdge > maxRight) {
    offset = maxRight - rightEdge;
  }

  // Ensure clamped offset doesn't push left edge outside viewport
  const clampedLeft = leftEdge + offset;
  if (clampedLeft < minViewportLeft) {
    offset += minViewportLeft - clampedLeft;
  }

  if (offset !== 0) {
    bubble.style.setProperty('--tooltip-x-offset', `calc(-50% + ${offset}px)`);
  } else {
    bubble.style.removeProperty('--tooltip-x-offset');
  }

  // Position arrow so it always points precisely at trigger center
  const arrow = bubble.querySelector<HTMLElement>('.tech-tooltip-arrow');
  if (arrow) {
    if (offset !== 0) {
      const arrowOffset = Math.max(16, Math.min(bubbleWidth - 16, bubbleWidth / 2 - offset));
      arrow.style.left = `${arrowOffset}px`;
    } else {
      arrow.style.left = '50%';
    }
  }
}

function hideTooltip(trigger: HTMLElement, bubble: HTMLElement): void {
  const saved = trigger.getAttribute('data-original-title');
  if (saved) trigger.setAttribute('title', saved);
  bubble.classList.remove('is-active');
  bubble.style.removeProperty('--tooltip-x-offset');
  const arrow = bubble.querySelector<HTMLElement>('.tech-tooltip-arrow');
  if (arrow) arrow.style.removeProperty('left');
}

/**
 * Interactive Viewport Collision Clamping & Accessibility Management for Technical Tooltips
 * (Tooltip markup and dictionary definitions are compiled statically at build time).
 */
export function initTechTooltips(): void {
  if (delegatedListenersBound) return;
  delegatedListenersBound = true;

  document.addEventListener('pointerover', (e) => {
    const pair = resolveTooltipPair(e.target);
    if (!pair) return;
    if (e.relatedTarget instanceof Node && pair.trigger.contains(e.relatedTarget)) return;
    showTooltip(pair.trigger, pair.bubble);
  });

  document.addEventListener('pointerout', (e) => {
    const pair = resolveTooltipPair(e.target);
    if (!pair) return;
    if (e.relatedTarget instanceof Node && pair.trigger.contains(e.relatedTarget)) return;
    hideTooltip(pair.trigger, pair.bubble);
  });

  document.addEventListener('focusin', (e) => {
    const pair = resolveTooltipPair(e.target);
    if (pair) showTooltip(pair.trigger, pair.bubble);
  });

  document.addEventListener('focusout', (e) => {
    const pair = resolveTooltipPair(e.target);
    if (pair) hideTooltip(pair.trigger, pair.bubble);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const pair = resolveTooltipPair(e.target);
    if (pair) {
      hideTooltip(pair.trigger, pair.bubble);
      pair.trigger.blur();
    }
  });

  document.addEventListener('click', (e) => {
    const pair = resolveTooltipPair(e.target);
    if (pair) {
      if (window.matchMedia('(pointer: coarse)').matches) {
        e.preventDefault();
        const isActive = pair.bubble.classList.contains('is-active');
        document.querySelectorAll<HTMLElement>('.tech-tooltip-bubble.is-active').forEach((b) => {
          b.classList.remove('is-active');
        });
        if (!isActive) {
          showTooltip(pair.trigger, pair.bubble);
          pair.bubble.classList.add('is-active');
        } else {
          hideTooltip(pair.trigger, pair.bubble);
        }
      }
      return;
    }

    if (!(e.target instanceof Element && e.target.closest('.tech-tooltip-wrapper'))) {
      document.querySelectorAll<HTMLElement>('.tech-tooltip-bubble.is-active').forEach((b) => {
        b.classList.remove('is-active');
      });
    }
  });
}

// Auto-run on client
if (typeof window !== 'undefined') {
  initTechTooltips();
}
