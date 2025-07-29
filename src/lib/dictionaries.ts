import type { Locale } from '../../i18n.config';

const dictionaries = {
  ko: () => import('../locales/ko.json').then((module) => module.default),
  en: () => import('../locales/en.json').then((module) => module.default),
  ja: () => import('../locales/ja.json').then((module) => module.default),
  zh: () => import('../locales/zh.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
