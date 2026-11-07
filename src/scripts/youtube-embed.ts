/**
 * Progressive Enhancement: click-to-load YouTube facades.
 *
 * Markup is generated at build time by `remark-youtube.mjs`. No iframe (and no
 * Google/YouTube script, cookie, or request beyond the thumbnail) is loaded
 * until a visitor activates the play button. The player uses the
 * privacy-enhanced `youtube-nocookie.com` domain.
 */

const EMBED_SELECTOR = '.youtube-embed';

function loadPlayer(figure: HTMLElement): void {
  const videoId = figure.dataset.videoId;
  if (!videoId || figure.querySelector('iframe')) return;

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  iframe.title = figure.dataset.title || 'YouTube video player';
  iframe.allow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';

  const button = figure.querySelector('.youtube-embed-btn');
  button?.replaceWith(iframe);
  figure.classList.add('is-playing');
  iframe.focus();
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLElement>('.youtube-embed-btn');
  if (!button) return;
  const figure = button.closest<HTMLElement>(EMBED_SELECTOR);
  if (figure) {
    event.preventDefault();
    event.stopPropagation();
    loadPlayer(figure);
  }
});

function checkVideoHash(): void {
  const hash = window.location.hash;
  if (!hash || !/^#video(-\d+)?$/.test(hash)) return;
  const target =
    document.getElementById(hash.slice(1)) ??
    document.querySelector<HTMLElement>(EMBED_SELECTOR);
  if (target && target.matches(EMBED_SELECTOR)) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    loadPlayer(target);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkVideoHash, { once: true });
} else {
  checkVideoHash();
}
window.addEventListener('hashchange', checkVideoHash);
