import { visit } from 'unist-util-visit';

const ALERT_CONFIG = {
  warning: {
    title: 'Warning',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="markdown-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  caution: {
    title: 'Caution',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="markdown-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  },
  note: {
    title: 'Note',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="markdown-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  },
  tip: {
    title: 'Tip',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="markdown-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
  },
  important: {
    title: 'Important',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="markdown-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="12 8 8 12 12 16 16 12 12 8"/></svg>`
  }
};

export function remarkAlerts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const firstChild = node.children?.[0];
      if (firstChild?.type === 'paragraph') {
        const firstText = firstChild.children?.[0];
        if (firstText?.type === 'text') {
          const match = firstText.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\r?\n|\s+|$)/i);
          if (match) {
            const type = match[1].toLowerCase();
            const config = ALERT_CONFIG[type] || {
              title: type.charAt(0).toUpperCase() + type.slice(1),
              iconSvg: ''
            };

            // Remove [!TYPE] marker
            firstText.value = firstText.value.slice(match[0].length);

            // If firstText is now empty, remove it
            if (!firstText.value.trim() && firstChild.children.length === 1) {
              node.children.shift();
            }

            node.data = node.data || {};
            node.data.hName = 'div';
            node.data.hProperties = {
              className: ['markdown-alert', `markdown-alert-${type}`],
              role: 'note'
            };

            const headerNode = {
              type: 'html',
              value: `<div class="markdown-alert-header">${config.iconSvg}<span class="markdown-alert-title">${config.title}</span></div>`
            };

            node.children.unshift(headerNode);
          }
        }
      }
    });
  };
}

