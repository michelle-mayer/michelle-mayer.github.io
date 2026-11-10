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
    year: 'Now',
    role: 'Software Engineer II',
    company: 'Microsoft',
    period: '[Start date] - Present',
    duration: '4.5 years',
    isCurrent: true,
    progression: 'Promoted from Software Engineer I in August.',
    highlights: [],
    skills: [],
  },
  {
    year: '2022',
    role: 'Computer engineering graduate',
    company: '[University name]',
    period: 'May 2022',
    highlights: [],
    skills: [],
  },
  {
    year: 'Before 2022',
    role: 'Two professional summer internships',
    company: '[Internship companies]',
    period: '[Summer dates]',
    highlights: [],
    skills: [],
  },
];

export const experienceTagSlugs = new Set<string>(
  experiences.flatMap((exp) => exp.skills.map((skill) => slugify(skill)))
);
