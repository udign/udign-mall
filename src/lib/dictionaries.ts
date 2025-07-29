import type { Locale } from '../../i18n.config';

const dictionaries = {
  ko: () => import('../locales/ko.json').then((module) => module.default),
  en: () => import('../locales/en.json').then((module) => module.default),
};

// 클라이언트에서 사용하는 dictionary 로더
export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
