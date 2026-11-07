import { slugify } from '../utils/slugify';

export interface ExperienceItem {
  year: string;
  role: string;
  company: string;
  location: string;
  period: string;
  duration?: string;
  isCurrent?: boolean;
  progression?: string;
  highlights: string[];
  skills: string[];
}

export const experiences: ExperienceItem[] = [];

export const experienceTagSlugs = new Set<string>(
  experiences.flatMap((exp) => exp.skills.map((skill) => slugify(skill)))
);
