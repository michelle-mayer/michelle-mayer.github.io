import { themeConfig } from '../theme.config';
import {
  getEffectiveHomePage,
  getFeatureForHref,
  isFeatureEnabled,
  isUrlEnabled,
} from './features';

export interface NavItem {
  label: string;
  href: string;
  active: boolean;
}

export function getNavLinks(pathname: string): NavItem[] {
  const cleanPath = pathname.replace(/\/$/, '');
  const effectiveHome = getEffectiveHomePage();

  return themeConfig.navigation.items
    .filter((item) => {
      if (item.enabled === false) return false;
      const feature = getFeatureForHref(item.href);
      if (feature && !isFeatureEnabled(feature)) return false;
      return isUrlEnabled(item.href);
    })
    .map((item) => {
      const feature = getFeatureForHref(item.href);
      const isPromotedHome =
        effectiveHome !== 'home' && feature === effectiveHome;
      const cleanHref = item.href.replace(/\/$/, '');
      const matchesHref =
        cleanHref === ''
          ? cleanPath === ''
          : cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`);
      const matchesPromotedRoot = isPromotedHome && cleanPath === '';
      const matchesPrefix = (item.activePrefixes || [])
        .filter((prefix) => isUrlEnabled(prefix))
        .some((prefix) => cleanPath.startsWith(prefix));

      return {
        label: item.label,
        href: isPromotedHome ? '/' : item.href,
        active: matchesPromotedRoot || matchesHref || matchesPrefix,
      };
    });
}
