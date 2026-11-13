export const BLOG_CATEGORIES = ['tech', 'research', 'personal'] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const BLOG_CATEGORY_DETAILS = {
  tech: {
    label: 'Tech',
    description: 'Engineering, AI safety, and the people building technology.',
    coverClass: 'bg-gradient-to-br from-[#ddd6fe] via-[#a78bfa] to-[#5b21b6]',
    iconPath: 'M8 6 2 12l6 6m8-12 6 6-6 6M14 4l-4 16',
  },
  research: {
    label: 'Research',
    description: 'Paper notes, deeper investigations, and questions worth exploring.',
    coverClass: 'bg-gradient-to-br from-[#d8e4ec] via-[#8fb3c7] to-[#35566b]',
    iconPath: 'M9 3h6m-5 0v7l-6 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-9V3M8 15h8',
  },
  personal: {
    label: 'Personal',
    description: 'Cats, hobbies, everyday discoveries, and life beyond the keyboard.',
    coverClass: 'bg-gradient-to-br from-[#fde68a] via-[#f9a8d4] to-[#a78bfa]',
    iconPath: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  },
} satisfies Record<BlogCategory, {
  label: string;
  description: string;
  coverClass: string;
  iconPath: string;
}>;

export function blogCategoryHref(category: BlogCategory): string {
  return `/blog/category/${category}/`;
}
