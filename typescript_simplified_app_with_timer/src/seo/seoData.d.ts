export interface ExamSeoMeta {
  type: string;
  slug: string;
  title: string;
  description: string;
}

export const SITE_URL: string;
export const DEFAULT_TITLE: string;
export const DEFAULT_DESCRIPTION: string;
export const EXAMS: ExamSeoMeta[];
export const CONTACT_META: { slug: string; title: string; description: string };
export const typeToSlug: Record<string, string>;
export const slugToType: Record<string, string>;
export const examByType: Record<string, ExamSeoMeta>;
