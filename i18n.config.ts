export const i18n = {
  defaultLocale: 'ko',
  locales: ['ko', 'en', 'ja', 'zh'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
