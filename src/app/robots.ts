import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'], // 관리자나 API는 검색 제외
    },
    // 나중에 실제 도메인이 생기면 그 주소로 바꿔주세요!
    sitemap: 'https://udign.com/sitemap.xml',
  };
}
