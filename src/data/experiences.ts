import { slugify } from '../utils/slugify';

export interface ExperienceItem {
  year: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  duration?: string;
  isCurrent?: boolean;
  progression?: string;
  highlights: string[];
  skills: string[];
}

export const experiences: ExperienceItem[] = [
  {
    year: '2026',
    role: 'Software Engineer II',
    company: 'Microsoft',
    period: 'Aug 2026 - Present',
    isCurrent: true,
    highlights: [],
    skills: [],
  },
  {
    year: '2022',
    role: 'Software Engineer I',
    company: 'Microsoft',
    period: '2022 - Aug 2026',
    highlights: [],
    skills: [],
  },
  {
    year: '2022',
    role: 'B.S. in Computer Engineering',
    company: 'Clemson University',
    period: 'May 2022',
    highlights: [],
    skills: [],
  },
  {
    year: '2021',
    role: 'Software Engineering Intern',
    company: 'GE Aviation',
    period: 'Summer 2021',
    highlights: [],
    skills: [],
  },
  {
    year: '2020',
    role: 'Software Engineering Intern',
    company: 'Dynetics / Leidos',
    period: 'Summer 2020',
    highlights: [],
    skills: [],
  },
  {
    year: '2019',
    role: 'Machine Learning Research',
    company: 'Clemson University',
    period: '2019 - 2022',
    highlights: [],
    skills: [],
  },
];

export const experienceTagSlugs = new Set<string>(
  experiences.flatMap((exp) => exp.skills.map((skill) => slugify(skill)))
);
