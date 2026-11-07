/**
 * Interactive Click-to-Expand & Pan/Zoom Lightbox for Mermaid Diagrams
 * Wraps inline Mermaid SVGs in `.prose` with an expandable card & toolbar,
 * and opens a full-viewport vector zoom/pan modal on click.
 */

const EXPAND_ICON =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

const ZOOM_IN_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';

const ZOOM_OUT_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';

const CLOSE_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

interface ModalState {
  overlay: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLElement;
  zoomLabel: HTMLButtonElement;
  scale: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  lastTrigger: HTMLElement | null;
}

let modalState: ModalState | null = null;

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function updateTransform() {
  if (!modalState) return;
  const { canvas, zoomLabel, scale, panX, panY } = modalState;
  canvas.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
  zoomLabel.textContent = `${Math.round(scale * 100)}%`;
}

function resetView() {
  if (!modalState) return;
  modalState.scale = 1;
  modalState.panX = 0;
  modalState.panY = 0;
  updateTransform();
}

function zoomBy(delta: number, focalX?: number, focalY?: number) {
  if (!modalState) return;
  const prevScale = modalState.scale;
  const nextScale = clamp(Math.round((prevScale + delta) * 100) / 100, MIN_SCALE, MAX_SCALE);
  if (nextScale === prevScale) return;

  if (typeof focalX === 'number' && typeof focalY === 'number') {
    const rect = modalState.stage.getBoundingClientRect();
    const cx = focalX - (rect.left + rect.width / 2);
    const cy = focalY - (rect.top + rect.height / 2);
    const ratio = nextScale / prevScale;
    modalState.panX = cx - (cx - modalState.panX) * ratio;
    modalState.panY = cy - (cy - modalState.panY) * ratio;
  }

  modalState.scale = nextScale;
  updateTransform();
}

function closeModal() {
  if (!modalState) return;
  const { overlay, canvas, lastTrigger } = modalState;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (!overlay.classList.contains('is-open')) {
      canvas.innerHTML = '';
    }
  }, 180);
  if (lastTrigger) {
    lastTrigger.focus({ preventScroll: true });
  }
}

function ensureModal(): ModalState {
  if (modalState && document.body.contains(modalState.overlay)) {
    return modalState;
  }

  const overlay = document.createElement('div');
  overlay.className = 'mermaid-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Expanded diagram viewer');
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <div class="mermaid-lightbox-header">
      <div class="mermaid-lightbox-controls" role="toolbar" aria-label="Diagram zoom controls">
        <button type="button" class="mermaid-ctrl-btn" data-action="zoom-out" aria-label="Zoom out" title="Zoom out (-)">
          ${ZOOM_OUT_ICON}
        </button>
        <button type="button" class="mermaid-ctrl-btn mermaid-zoom-readout" data-action="zoom-reset" aria-label="Reset zoom to 100%" title="Reset zoom (0)">
          100%
        </button>
        <button type="button" class="mermaid-ctrl-btn" data-action="zoom-in" aria-label="Zoom in" title="Zoom in (+)">
          ${ZOOM_IN_ICON}
        </button>
      </div>
      <button type="button" class="mermaid-ctrl-btn mermaid-close-btn" data-action="close" aria-label="Close diagram viewer" title="Close (Esc)">
        ${CLOSE_ICON}
      </button>
    </div>
    <div class="mermaid-lightbox-stage">
      <div class="mermaid-lightbox-canvas"></div>
    </div>
    <div class="mermaid-lightbox-hint" aria-hidden="true">
      Scroll to zoom &bull; Drag to pan &bull; Double-click to toggle 2&times; &bull; Esc to close
    </div>
  `;

  document.body.appendChild(overlay);

  const stage = overlay.querySelector<HTMLElement>('.mermaid-lightbox-stage')!;
  const canvas = overlay.querySelector<HTMLElement>('.mermaid-lightbox-canvas')!;
  const zoomLabel = overlay.querySelector<HTMLButtonElement>('[data-action="zoom-reset"]')!;
  const zoomInBtn = overlay.querySelector<HTMLButtonElement>('[data-action="zoom-in"]')!;
  const zoomOutBtn = overlay.querySelector<HTMLButtonElement>('[data-action="zoom-out"]')!;
  const closeBtn = overlay.querySelector<HTMLButtonElement>('[data-action="close"]')!;

  modalState = {
    overlay,
    stage,
    canvas,
    zoomLabel,
    scale: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastTrigger: null,
  };

  zoomInBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    zoomBy(ZOOM_STEP);
  });

  zoomOutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    zoomBy(-ZOOM_STEP);
  });

  zoomLabel.addEventListener('click', (e) => {
    e.stopPropagation();
    resetView();
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  // Close when clicking backdrop outside the SVG shape or when not dragging
  let pointerMoved = false;
  stage.addEventListener('pointerdown', (e) => {
    if (!modalState || e.button !== 0) return;
    pointerMoved = false;
    modalState.isDragging = true;
    modalState.dragStartX = e.clientX - modalState.panX;
    modalState.dragStartY = e.clientY - modalState.panY;
    stage.classList.add('is-dragging');
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', (e) => {
    if (!modalState || !modalState.isDragging) return;
    const dx = e.clientX - modalState.dragStartX - modalState.panX;
    const dy = e.clientY - modalState.dragStartY - modalState.panY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      pointerMoved = true;
    }
    modalState.panX = e.clientX - modalState.dragStartX;
    modalState.panY = e.clientY - modalState.dragStartY;
    updateTransform();
  });

  const endDrag = (e: PointerEvent) => {
    if (!modalState || !modalState.isDragging) return;
    modalState.isDragging = false;
    stage.classList.remove('is-dragging');
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if not captured
    }
    if (!pointerMoved && e.target === stage) {
      closeModal();
    }
  };

  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // Double-click to toggle 2x zoom at cursor
  stage.addEventListener('dblclick', (e) => {
    if (!modalState) return;
    e.preventDefault();
    if (modalState.scale > 1.1) {
      resetView();
    } else {
      zoomBy(1, e.clientX, e.clientY);
    }
  });

  // Wheel / trackpad pinch zoom toward cursor
  stage.addEventListener(
    'wheel',
    (e) => {
      if (!modalState || !overlay.classList.contains('is-open')) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      zoomBy(delta, e.clientX, e.clientY);
    },
    { passive: false }
  );

  // Keyboard shortcuts while open
  window.addEventListener('keydown', (e) => {
    if (!modalState || !modalState.overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomBy(ZOOM_STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomBy(-ZOOM_STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      resetView();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      modalState.panX += 40;
      updateTransform();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      modalState.panX -= 40;
      updateTransform();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      modalState.panY += 40;
      updateTransform();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      modalState.panY -= 40;
      updateTransform();
    }
  });

  return modalState;
}

function openDiagramModal(sourceSvg: SVGSVGElement, triggerEl: HTMLElement) {
  const state = ensureModal();
  state.lastTrigger = triggerEl;

  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement;
  // Namespace the cloned SVG's ID and all internal #id / url(#id) references (<style>, <marker>, <defs>)
  // so internal Mermaid styles and arrowheads render identically without colliding with the inline SVG.
  const origId = sourceSvg.id;
  if (origId) {
    const newId = `${origId}-lightbox`;
    clonedSvg.id = newId;
    clonedSvg.innerHTML = clonedSvg.innerHTML.split(origId).join(newId);
  }

  // Size cloned SVG from its viewBox so it renders crisp and large inside the modal stage
  const viewBox = clonedSvg.getAttribute('viewBox');
  const stageW = Math.max(window.innerWidth * 0.88, 320);
  const stageH = Math.max(window.innerHeight * 0.78, 280);

  clonedSvg.style.removeProperty('max-width');
  clonedSvg.removeAttribute('width');
  clonedSvg.removeAttribute('height');

  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n)) && parts[2] > 0 && parts[3] > 0) {
      const [, , vbW, vbH] = parts;
      const fitScale = Math.min(stageW / vbW, stageH / vbH);
      // Allow diagrams to scale up to fill the modal comfortably (up to 1.6x native viewBox, or at least 1x on wide diagrams)
      const initialRenderScale = Math.max(Math.min(fitScale, 1.6), Math.min(stageW / vbW, 1.0));
      clonedSvg.style.width = `${Math.round(vbW * initialRenderScale)}px`;
      clonedSvg.style.height = `${Math.round(vbH * initialRenderScale)}px`;
    }
  }

  state.canvas.innerHTML = '';
  state.canvas.appendChild(clonedSvg);
  resetView();

  state.overlay.setAttribute('aria-hidden', 'false');
  state.overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  const closeBtn = state.overlay.querySelector<HTMLButtonElement>('[data-action="close"]');
  closeBtn?.focus({ preventScroll: true });
}

/**
 * Fallback for diagrams not pre-wrapped at build time by `rehype-mermaid-a11y.mjs`.
 * Creates the `.mermaid-diagram-wrapper` card and Expand toolbar around the SVG.
 */
function wrapDiagram(svg: SVGSVGElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'mermaid-diagram-wrapper';
  svg.parentNode?.insertBefore(wrapper, svg);
  wrapper.appendChild(svg);

  const toolbar = document.createElement('div');
  toolbar.className = 'mermaid-diagram-toolbar';

  const expandBtn = document.createElement('button');
  expandBtn.type = 'button';
  expandBtn.className = 'mermaid-expand-btn';
  expandBtn.setAttribute('aria-label', 'Expand diagram in interactive zoom viewer');
  expandBtn.setAttribute('title', 'Click to expand and zoom diagram');
  expandBtn.innerHTML = `${EXPAND_ICON}<span>Expand</span>`;

  toolbar.appendChild(expandBtn);
  wrapper.appendChild(toolbar);
  return wrapper;
}

export function setupMermaidZoom() {
  const diagrams = document.querySelectorAll<SVGSVGElement>(
    '.prose svg.flowchart, .prose svg[id^="mermaid-"], .prose svg[aria-roledescription="flowchart"], .prose svg[aria-roledescription="diagram"]'
  );
  if (diagrams.length === 0) return;

  diagrams.forEach((svg) => {
    const parent = svg.parentElement;
    const wrapper = parent?.classList.contains('mermaid-diagram-wrapper') ? parent : wrapDiagram(svg);
    if (wrapper.dataset.zoomBound === 'true') return;
    wrapper.dataset.zoomBound = 'true';

    const expandBtn = wrapper.querySelector<HTMLButtonElement>('.mermaid-expand-btn');
    const trigger: HTMLElement = expandBtn ?? wrapper;

    expandBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openDiagramModal(svg, trigger);
    });

    // Clicking anywhere on the diagram (except interactive links/abbr tooltips) also opens the zoom modal
    wrapper.addEventListener('click', (e) => {
      const target = e.target as Element | null;
      if (target?.closest('a, button, abbr[data-tech-term]')) return;
      openDiagramModal(svg, trigger);
    });
  });
}

setupMermaidZoom();
