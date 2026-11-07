import { siteConfig } from '../site.config';

export interface RecommendationItem {
  initials: string;
  paragraphs: string[];
}

export const LINKEDIN_PROFILE_URL = siteConfig.socials.linkedin ?? '';

export const featuredRecommendation: RecommendationItem | null = null;
export const leftStackRecommendations: RecommendationItem[] = [];
export const midLeftRecommendation: RecommendationItem | null = null;
export const midRightRecommendation: RecommendationItem | null = null;
export const rightStackRecommendations: RecommendationItem[] = [];
