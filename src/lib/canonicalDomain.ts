// ═══════════════════════════════════════════════════════════════
// ZERO HARD CODE v4.0 - Canonical Domain Configuration
// These are STATIC FALLBACKS - use useEditorialSystemSettings hook for dynamic config
// The actual values are managed in Admin > Sistema > Editorial > Site
// ═══════════════════════════════════════════════════════════════

/**
 * CLÁUSULA PÉTREA: O domínio canônico oficial é swen.ia.br (sem www)
 * Todas as URLs, schemas, sitemaps e referências devem usar este domínio.
 * swen.ia.br redireciona permanentemente para swen.ia.br.
 *
 * EXCEÇÃO: O handle do Instagram permanece como @swen.ia.br (nome de usuário no IG)
 */

// Static fallbacks - for non-React contexts (Edge Functions, SSR)
// For React components, use useEditorialSystemSettings().settings.site
export const CANONICAL_DOMAIN = 'https://swen.ia.br';
export const INSTAGRAM_HANDLE = '@swen.ia.br';
export const SITE_URL = 'swen.ia.br';
export const EMAIL_CONTACT = 'contato@swen.ia.br';
export const OG_IMAGE_URL = `${CANONICAL_DOMAIN}/og-image.png`;
export const LOGO_URL = `${CANONICAL_DOMAIN}/pwa-512x512.png`;

// Static helpers - use for non-React contexts or Edge Functions
export function buildCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${CANONICAL_DOMAIN}${cleanPath}`;
}

export function buildNewsUrl(slugOrId: string): string {
  return buildCanonicalUrl(`/noticia/${slugOrId}`);
}

export function buildCategoryUrl(category: string): string {
  const slug = category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return buildCanonicalUrl(`/categoria/${slug}`);
}

// Dynamic builder - use with hook config
export function buildDynamicCanonicalUrl(baseUrl: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// ═══════════════════════════════════════════════════════════════
// Camada locale-aware (vertente EN — swen.live)
// Aditivo: os exports acima permanecem o default pt-BR (swen.ia.br),
// preservando os ~173 call-sites existentes. As funções abaixo
// resolvem o domínio por locale para a vertente em inglês.
// ═══════════════════════════════════════════════════════════════

import { DEFAULT_LOCALE, type Locale } from './i18n/config';

// Domínio EN comprado: swen.live (IONOS, mai/2026)
export const EN_CANONICAL_DOMAIN = 'https://swen.live';

const CANONICAL_DOMAIN_BY_LOCALE: Record<Locale, string> = {
  'pt-BR': CANONICAL_DOMAIN,
  en: EN_CANONICAL_DOMAIN,
};

/** Domínio canônico para o locale (fallback: default pt-BR). */
export function canonicalDomainForLocale(locale: Locale = DEFAULT_LOCALE): string {
  return CANONICAL_DOMAIN_BY_LOCALE[locale] ?? CANONICAL_DOMAIN;
}

/** Constrói URL canônica no domínio do locale. EN → swen.live, PT → swen.ia.br. */
export function buildCanonicalUrlForLocale(locale: Locale, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${canonicalDomainForLocale(locale)}${cleanPath}`;
}

/**
 * OG image servida do domínio do locale (corrige URL absoluta hardcoded swen.ia.br
 * em páginas EN). Quando houver arte aprovada para o swen.live, trocar o path EN
 * para '/og-image-en.png' — drop-in, sem tocar nos call-sites.
 */
export function ogImageForLocale(locale: Locale = DEFAULT_LOCALE): string {
  return `${canonicalDomainForLocale(locale)}/og-image.png`;
}


/**
 * Truncamento SEO em limite de palavra (auditoria #2 item 7):
 * titles >60c e descriptions >160c são cortados pelo Google no SERP —
 * notícias chegavam a 86c/207c. Trunca limpo, sem palavra pela metade.
 */
export function truncateForSeo(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut.slice(0, max)).trimEnd() + '…';
}

/**
 * Par recíproco de hreflang (pt-BR ↔ en) + x-default.
 * Mesmo path em ambos os domínios. Use em alternates.languages / CanonicalManager.
 */
export function hreflangAlternates(path: string): {
  'pt-BR': string;
  en: string;
  'x-default': string;
} {
  return {
    'pt-BR': buildCanonicalUrlForLocale('pt-BR', path),
    en: buildCanonicalUrlForLocale('en', path),
    'x-default': buildCanonicalUrlForLocale(DEFAULT_LOCALE, path),
  };
}
