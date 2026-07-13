// Single source of truth for SEO metadata, shared by the runtime app
// (src/components/Seo.tsx, src/App.tsx) and the build-time prerender script
// (scripts/prerender.mjs). Keep this as plain ESM so Node can import it directly.

export const SITE_URL = 'https://freecertify.org';

export const DEFAULT_TITLE =
  'FreeCertify — Free AWS, Python & Prompt Engineering Practice Exams';

export const DEFAULT_DESCRIPTION =
  'Free practice exams for AWS certifications, Python programming, and Prompt Engineering. Real exam-style questions with instant explanations, timed mode, and shareable certificates.';

// `type` matches the app's internal exam type identifiers (EXAM_TYPES).
// `slug` is the SEO-friendly URL segment used at /exam/<slug>.
export const EXAMS = [
  {
    type: 'solutions_architect',
    slug: 'aws-solutions-architect',
    title: 'AWS Solutions Architect Associate Practice Exam',
    description:
      'Free AWS Certified Solutions Architect – Associate (SAA-C03) practice exam with realistic questions and detailed explanations.',
  },
  {
    type: 'cloud_practitioner',
    slug: 'aws-cloud-practitioner',
    title: 'AWS Cloud Practitioner Practice Exam',
    description:
      'Free AWS Certified Cloud Practitioner (CLF-C02) practice exam. Learn AWS fundamentals with exam-style questions and instant explanations.',
  },
  {
    type: 'developer',
    slug: 'aws-developer',
    title: 'AWS Developer Associate Practice Exam',
    description:
      'Free AWS Certified Developer – Associate (DVA-C02) practice exam with realistic questions covering Lambda, DynamoDB, API Gateway and more.',
  },
  {
    type: 'devops',
    slug: 'aws-devops-engineer',
    title: 'AWS DevOps Engineer Professional Practice Exam',
    description:
      'Free AWS Certified DevOps Engineer – Professional practice exam covering CI/CD, IaC, monitoring, and resilient cloud solutions.',
  },
  {
    type: 'python',
    slug: 'python-programming',
    title: 'Python Programming Practice Exam',
    description:
      'Free Python practice exam from beginner to advanced across 14 chapters — variables, loops, functions, OOP, and APIs with explanations.',
  },
  {
    type: 'prompt_engineering',
    slug: 'prompt-engineering',
    title: 'Prompt Engineering Practice Exam',
    description:
      'Free Prompt Engineering practice exam covering AI prompting fundamentals, techniques, and advanced agent design with detailed explanations.',
  },
];

export const CONTACT_META = {
  slug: 'contact',
  title: 'Contact & Support | FreeCertify',
  description:
    'Get in touch with the FreeCertify team for support, feedback, or partnership inquiries.',
};

export const typeToSlug = Object.fromEntries(EXAMS.map((e) => [e.type, e.slug]));
export const slugToType = Object.fromEntries(EXAMS.map((e) => [e.slug, e.type]));
export const examByType = Object.fromEntries(EXAMS.map((e) => [e.type, e]));
