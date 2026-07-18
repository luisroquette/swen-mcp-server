// ═══════════════════════════════════════════════════════════════
// i18n — Configuração de locale (domain-based)
// swen.ia.br → 'pt-BR' (default) | swen.live → 'en'
// ═══════════════════════════════════════════════════════════════

export const LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

// Header usado pelo proxy para propagar o locale aos Server Components.
export const LOCALE_HEADER = 'x-locale';

/**
 * Resolve o locale a partir do host da requisição.
 * Domínio próprio (swen.live) → inglês; qualquer outro → pt-BR.
 * Mantido simples e sem dependência de Next para ser testável isoladamente.
 */
export function localeFromHost(host: string | null | undefined): Locale {
  if (!host) return DEFAULT_LOCALE;
  const h = host.toLowerCase();
  // swen.live (e previews/subdomínios do projeto EN).
  if (h === 'swen.live' || h.endsWith('.swen.live') || h.startsWith('swen.live:')) {
    return 'en';
  }
  return DEFAULT_LOCALE;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'pt-BR' || value === 'en';
}

const PT_ONLY_ON_SWEN_LIVE_EXACT_PATHS = new Set([
  '/retrospectiva/ia-2026',
  '/estado-ia-brasil-2026',
  '/benchmark/ptbr',
  '/benchmark/modelos-brasileiros',
]);

/**
 * Rotas públicas PT-only que não devem existir no host EN.
 * Mantê-las indexáveis em swen.live polui o GSC com duplicatas/canonicals cruzados.
 */
export function isPtOnlyPathOnEnPortal(pathname: string): boolean {
  const cleanPath =
    pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  return cleanPath.startsWith('/ranking/') || PT_ONLY_ON_SWEN_LIVE_EXACT_PATHS.has(cleanPath);
}
