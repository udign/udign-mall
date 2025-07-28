import { redirect } from 'next/navigation';
import { i18n } from '../../i18n.config';

export default function HomePage() {
  // 기본 언어로 리다이렉트
  redirect(`/${i18n.defaultLocale}/shop`);
}
