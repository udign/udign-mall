import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.udign.com';
  const languages = ['ko', 'en', 'ja', 'zh'];
  const routes = ['', '/shop', '/shop/categories'];

  const result: MetadataRoute.Sitemap = [];

  // flatMap 대신 안전하게 이중 forEach 사용
  languages.forEach((lang) => {
    routes.forEach((route) => {
      result.push({
        url: `${baseUrl}/${lang}${route}`,
        lastModified: new Date().toISOString(), // 날짜 형식을 더 명확하게
        changeFrequency: 'daily', // 타입을 명시적으로 인식하도록 작성
        priority: route === '' ? 1.0 : 0.8,
      });
    });
  });

  return result;
}
