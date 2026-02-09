import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://udign.com'; 
  const languages = ['ko', 'en', 'ja', 'zh'];
  const routes = ['', '/shop', '/shop/categories'];

  return languages.flatMap((lang) =>
    routes.map((route) => ({
      url: `${baseUrl}/${lang}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1.0 : 0.8,
    }))
  );
}
