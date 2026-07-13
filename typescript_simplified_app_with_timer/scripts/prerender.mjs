// Build-time prerenderer.
// Runs after `vite build`. Takes the built dist/index.html and emits one static
// HTML file per exam (dist/exam/<slug>/index.html) and for /contact, each with
// its own <title>, meta description, canonical, Open Graph/Twitter tags, and a
// Course JSON-LD block. This gives correct per-page SEO + social link previews
// even though the app itself is a client-rendered SPA.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, '..');
const distDir = join(projectRoot, 'dist');
const indexPath = join(distDir, 'index.html');

const { SITE_URL, EXAMS, CONTACT_META } = await import(
  new URL('../src/seo/seoData.js', import.meta.url)
);

const escapeAttr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const template = readFileSync(indexPath, 'utf8');

/**
 * Replace a tag matched by `regex` with `replacement`. Throws if no match so
 * silent drift (e.g. index.html markup changes) fails the build loudly.
 */
function replaceOrThrow(html, regex, replacement, label) {
  if (!regex.test(html)) {
    throw new Error(`prerender: could not find ${label} tag to replace`);
  }
  return html.replace(regex, replacement);
}

function buildPage({ title, description, canonical, jsonLd }) {
  let html = template;
  const t = escapeAttr(title);
  const d = escapeAttr(description);

  html = replaceOrThrow(html, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`, 'title');
  html = replaceOrThrow(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${d}" />`,
    'meta description'
  );
  html = replaceOrThrow(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonical}" />`,
    'canonical'
  );
  html = replaceOrThrow(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${t}" />`,
    'og:title'
  );
  html = replaceOrThrow(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${d}" />`,
    'og:description'
  );
  html = replaceOrThrow(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonical}" />`,
    'og:url'
  );
  html = replaceOrThrow(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${t}" />`,
    'twitter:title'
  );
  html = replaceOrThrow(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${d}" />`,
    'twitter:description'
  );

  if (jsonLd) {
    const block = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n  </head>`;
    html = replaceOrThrow(html, /<\/head>/, block, '</head>');
  }

  return html;
}

function writePage(relDir, html) {
  const outDir = join(distDir, relDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
}

let count = 0;

for (const exam of EXAMS) {
  const canonical = `${SITE_URL}/exam/${exam.slug}`;
  const html = buildPage({
    title: `${exam.title} | FreeCertify`,
    description: exam.description,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: exam.title,
      description: exam.description,
      url: canonical,
      provider: {
        '@type': 'Organization',
        name: 'FreeCertify',
        '@id': `${SITE_URL}/#organization`,
      },
    },
  });
  writePage(`exam/${exam.slug}`, html);
  count++;
}

writePage(
  CONTACT_META.slug,
  buildPage({
    title: CONTACT_META.title,
    description: CONTACT_META.description,
    canonical: `${SITE_URL}/contact`,
  })
);
count++;

console.log(`prerender: wrote ${count} static pages to dist/`);
