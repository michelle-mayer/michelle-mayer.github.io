export function initSectionNav() {
  const floatingWrapper = document.querySelector<HTMLElement>('[data-nav-floating-wrapper]');
  if (!floatingWrapper) return;

  const allLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-inline] a[data-section], [data-nav-floating] a[data-section]'));
  const dropdownItems = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-section-item]'));
  const sectionIds = Array.from(
    new Set([
      ...allLinks.map((l) => l.getAttribute('data-section')),
      ...dropdownItems.map((l) => l.getAttribute('data-section-item')),
    ].filter(Boolean))
  ) as string[];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  const footerBottom =
    document.querySelector<HTMLElement>('[data-footer-bottom]') ||
    document.querySelector<HTMLElement>('footer > div > div:last-child');

  const sectionDropdownTriggers = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-section-dropdown-trigger]'));
  const sectionDropdownMenus = Array.from(document.querySelectorAll<HTMLElement>('[data-section-dropdown-menu]'));
  const activeLabels = Array.from(document.querySelectorAll<HTMLElement>('[data-section-active-label]'));
  const activeCounts = Array.from(document.querySelectorAll<HTMLElement>('[data-section-active-count]'));

  const siteTriggers = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-site-trigger]'));
  const siteMenus = Array.from(document.querySelectorAll<HTMLElement>('[data-site-menu]'));

  function toggleSectionDropdown(scope?: string, open?: boolean) {
    if (scope) {
      const trigger = sectionDropdownTriggers.find((t) => t.getAttribute('data-section-dropdown-trigger') === scope);
      const menu = sectionDropdownMenus.find((m) => m.getAttribute('data-section-dropdown-menu') === scope);
      if (!trigger || !menu) return;

      const isCurrentlyOpen = !menu.classList.contains('hidden');
      const shouldOpen = open !== undefined ? open : !isCurrentlyOpen;

      if (shouldOpen) {
        toggleSiteMenu(undefined, false);
        // Close other section dropdowns
        sectionDropdownMenus.forEach((m) => {
          if (m !== menu) m.classList.add('hidden');
        });
        sectionDropdownTriggers.forEach((t) => {
          if (t !== trigger) {
            t.setAttribute('aria-expanded', 'false');
            t.querySelector('[data-section-dropdown-arrow]')?.classList.remove('rotate-180');
          }
        });
        menu.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        trigger.querySelector('[data-section-dropdown-arrow]')?.classList.add('rotate-180');
      } else {
        menu.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.querySelector('[data-section-dropdown-arrow]')?.classList.remove('rotate-180');
      }
    } else {
      const shouldOpen = open !== undefined ? open : false;
      sectionDropdownMenus.forEach((menu) => menu.classList.toggle('hidden', !shouldOpen));
      sectionDropdownTriggers.forEach((trigger) => {
        trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        trigger.querySelector('[data-section-dropdown-arrow]')?.classList.toggle('rotate-180', shouldOpen);
      });
    }
  }

  function toggleSiteMenu(triggerBtn?: HTMLButtonElement, open?: boolean) {
    if (triggerBtn) {
      const parent = triggerBtn.closest('.relative');
      const targetMenu = parent?.querySelector<HTMLElement>('[data-site-menu]');
      if (!targetMenu) return;

      const isCurrentlyOpen = !targetMenu.classList.contains('hidden');
      const shouldOpen = open !== undefined ? open : !isCurrentlyOpen;

      if (shouldOpen) {
        toggleSectionDropdown(undefined, false);
        siteMenus.forEach((menu) => {
          if (menu !== targetMenu) menu.classList.add('hidden');
        });
        siteTriggers.forEach((trigger) => {
          if (trigger !== triggerBtn) {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.querySelector('[data-site-bars]')?.classList.remove('hidden');
            trigger.querySelector('[data-site-close]')?.classList.add('hidden');
          }
        });

        targetMenu.classList.remove('hidden');
        triggerBtn.setAttribute('aria-expanded', 'true');
        triggerBtn.querySelector('[data-site-bars]')?.classList.add('hidden');
        triggerBtn.querySelector('[data-site-close]')?.classList.remove('hidden');
      } else {
        targetMenu.classList.add('hidden');
        triggerBtn.setAttribute('aria-expanded', 'false');
        triggerBtn.querySelector('[data-site-bars]')?.classList.remove('hidden');
        triggerBtn.querySelector('[data-site-close]')?.classList.add('hidden');
      }
    } else {
      const shouldOpen = open !== undefined ? open : false;
      siteMenus.forEach((menu) => {
        menu.classList.toggle('hidden', !shouldOpen);
      });
      siteTriggers.forEach((trigger) => {
        trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        trigger.querySelector('[data-site-bars]')?.classList.toggle('hidden', shouldOpen);
        trigger.querySelector('[data-site-close]')?.classList.toggle('hidden', !shouldOpen);
      });
    }
  }

  siteTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSiteMenu(trigger);
    });
  });

  siteMenus.forEach((menu) => {
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        toggleSiteMenu(undefined, false);
      });
    });
  });

  sectionDropdownTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const scope = trigger.getAttribute('data-section-dropdown-trigger') || undefined;
      toggleSectionDropdown(scope);
    });
  });

  // Close on section dropdown item click
  dropdownItems.forEach((item) => {
    item.addEventListener('click', () => {
      toggleSectionDropdown(undefined, false);
      const targetId = item.getAttribute('data-section-item');
      if (targetId) {
        isClickScrolling = true;
        if (clickTimer) clearTimeout(clickTimer);
        setActivePill(targetId);
        clickTimer = setTimeout(() => {
          isClickScrolling = false;
          updateNav();
        }, 1200);
      }
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (sectionDropdownMenus.some((m) => !m.classList.contains('hidden'))) {
      const clickedInsideMenu = sectionDropdownMenus.some((m) => m.contains(target));
      const clickedInsideTrigger = sectionDropdownTriggers.some((t) => t.contains(target));
      if (!clickedInsideMenu && !clickedInsideTrigger) {
        toggleSectionDropdown(undefined, false);
      }
    }
    if (siteMenus.some((m) => !m.classList.contains('hidden'))) {
      const clickedInsideMenu = siteMenus.some((m) => m.contains(target));
      const clickedInsideTrigger = siteTriggers.some((t) => t.contains(target));
      if (!clickedInsideMenu && !clickedInsideTrigger) {
        toggleSiteMenu(undefined, false);
      }
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (sectionDropdownMenus.some((m) => !m.classList.contains('hidden'))) {
        const activeTrigger = sectionDropdownTriggers.find((t) => t.getAttribute('aria-expanded') === 'true');
        toggleSectionDropdown(undefined, false);
        activeTrigger?.focus();
      }
      if (siteMenus.some((m) => !m.classList.contains('hidden'))) {
        const activeTrigger = siteTriggers.find((t) => t.getAttribute('aria-expanded') === 'true');
        toggleSiteMenu(undefined, false);
        activeTrigger?.focus();
      }
    }
  });

  let ticking = false;
  let isClickScrolling = false;
  let clickTimer: ReturnType<typeof setTimeout> | null = null;
  let isFloating = false;
  let lastActiveId: string | null = sections[0]?.id ?? null;

  function setActivePill(targetId: string | null) {
    if (!targetId || !sections.length || targetId === lastActiveId) return;
    lastActiveId = targetId;

    // 1. Update Desktop and Inline horizontal pills (if rendered)
    allLinks.forEach((link) => {
      const id = link.getAttribute('data-section');
      const isActive = id === targetId;

      if (isActive) {
        link.classList.add('bg-amber-100', 'text-amber-900', 'dark:bg-gray-800', 'dark:text-amber-500', 'font-semibold');
        link.classList.remove('text-gray-500', 'text-gray-600', 'dark:text-gray-400', 'font-medium');
        link.setAttribute('aria-current', 'true');
      } else {
        link.classList.remove('bg-amber-100', 'text-amber-900', 'dark:bg-gray-800', 'dark:text-amber-500', 'font-semibold');
        link.classList.add('text-gray-600', 'dark:text-gray-400', 'font-medium');
        link.removeAttribute('aria-current');
      }
    });

    // 2. Update Dropdown Trigger Labels, Section Counter (e.g. 2/8), and Dropdown Menu Items
    const sectionIdx = sectionIds.indexOf(targetId);
    const matchingDropdownItem = dropdownItems.find((item) => item.getAttribute('data-section-item') === targetId);
    const matchingHorizontalLink = allLinks.find((l) => l.getAttribute('data-section') === targetId);
    const labelText = matchingDropdownItem?.textContent?.trim() || matchingHorizontalLink?.textContent?.trim() || targetId;

    activeLabels.forEach((el) => {
      el.textContent = labelText;
    });
    if (sectionIdx !== -1) {
      activeCounts.forEach((el) => {
        el.textContent = `${sectionIdx + 1}/${sectionIds.length}`;
      });
    }

    dropdownItems.forEach((item) => {
      const id = item.getAttribute('data-section-item');
      const isActive = id === targetId;
      const dot = item.querySelector('[data-active-dot]');

      if (isActive) {
        item.classList.add('bg-amber-100', 'text-amber-900', 'dark:bg-gray-800', 'dark:text-amber-500', 'font-semibold');
        item.classList.remove('text-gray-700', 'dark:text-gray-300');
        dot?.classList.remove('hidden');
        dot?.classList.add('inline-block');
      } else {
        item.classList.remove('bg-amber-100', 'text-amber-900', 'dark:bg-gray-800', 'dark:text-amber-500', 'font-semibold');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
        dot?.classList.add('hidden');
        dot?.classList.remove('inline-block');
      }
    });
  }

  function updateNav() {
    if (!floatingWrapper) return;

    // Batch all geometric DOM reads first before any DOM mutations to avoid forced reflows
    const scrollY = window.scrollY;
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    const shouldFloat = scrollY > 70;
    const isDesktop = innerWidth >= 640;
    const footerBottomTop =
      shouldFloat && !isDesktop && footerBottom ? footerBottom.getBoundingClientRect().top : null;

    let currentSectionId: string | null = null;
    if (sections.length && !isClickScrolling) {
      const threshold = innerHeight * 0.4;
      currentSectionId = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold) {
          currentSectionId = section.id;
        }
      }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 60) {
        currentSectionId = sections[sections.length - 1].id;
      }
    }

    // Apply all DOM writes after reads are complete
    if (shouldFloat !== isFloating) {
      isFloating = shouldFloat;
      if (isFloating) {
        if (floatingWrapper.parentElement !== document.body) {
          document.body.appendChild(floatingWrapper);
        }
        floatingWrapper.classList.remove('opacity-0', 'invisible', 'translate-y-4', 'sm:-translate-y-3', 'scale-95', 'pointer-events-none');
        floatingWrapper.classList.add('opacity-100', 'visible', 'translate-y-0', 'scale-100');
        floatingWrapper.setAttribute('aria-hidden', 'false');
        toggleSectionDropdown('inline', false);
      } else {
        floatingWrapper.classList.add('opacity-0', 'invisible', 'translate-y-4', 'sm:-translate-y-3', 'scale-95', 'pointer-events-none');
        floatingWrapper.classList.remove('opacity-100', 'visible', 'translate-y-0', 'scale-100');
        floatingWrapper.setAttribute('aria-hidden', 'true');
        floatingWrapper.style.transform = '';
        floatingWrapper.style.transition = '';
        toggleSectionDropdown('desktop', false);
        toggleSectionDropdown('mobile', false);
        toggleSiteMenu(undefined, false);
      }
    }

    if (isFloating) {
      if (!isDesktop && footerBottomTop !== null) {
        const defaultBottom = 24;
        const wrapperBottom = innerHeight - defaultBottom;
        const targetLimit = footerBottomTop - 14;
        const lift = wrapperBottom - targetLimit;
        if (lift > 0) {
          floatingWrapper.style.transform = `translateY(-${lift}px)`;
          floatingWrapper.style.transition = 'none';
        } else {
          floatingWrapper.style.transform = '';
          floatingWrapper.style.transition = '';
        }
      } else {
        floatingWrapper.style.transform = '';
        floatingWrapper.style.transition = '';
      }
    }

    if (currentSectionId) {
      setActivePill(currentSectionId);
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }

  allLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const targetId = link.getAttribute('data-section');
      if (!targetId) return;

      isClickScrolling = true;
      if (clickTimer) clearTimeout(clickTimer);
      setActivePill(targetId);

      clickTimer = setTimeout(() => {
        isClickScrolling = false;
        onScroll();
      }, 1200);
    });
  });

  const topButtons = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-top-button]'));
  topButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (window.scrollY > 0) {
    onScroll();
  }
}

initSectionNav();

