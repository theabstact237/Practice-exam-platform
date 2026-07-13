import { Helmet } from 'react-helmet-async';
import {
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  CONTACT_META,
  examByType,
} from '../seo/seoData';

interface SeoProps {
  page: string;
  examType: string;
  isReview?: boolean;
}

export default function Seo({ page, examType, isReview = false }: SeoProps) {
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let canonical = `${SITE_URL}/`;

  const meta = examByType[examType];

  if ((page === 'exam_landing' || page === 'exam' || page === 'review') && meta) {
    canonical = `${SITE_URL}/exam/${meta.slug}`;
    description = meta.description;
    if (page === 'exam_landing') {
      title = `${meta.title} | FreeCertify`;
    } else {
      const suffix = isReview ? 'Results & Review' : 'Practice';
      title = `${meta.title} — ${suffix} | FreeCertify`;
    }
  } else if (page === 'contact') {
    title = CONTACT_META.title;
    description = CONTACT_META.description;
    canonical = `${SITE_URL}/contact`;
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
