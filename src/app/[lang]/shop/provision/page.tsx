import { termsOfService } from '@/lib/terms-content';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';

interface ProvisionPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ProvisionPage({ params }: ProvisionPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  // 약관 내용을 조항별로 분리
  const sections = termsOfService.split(/(?=제\d+조)/g).filter((section) => section.trim());

  return (
    <div className='min-h-screen' style={{ backgroundColor: '#0e1731' }}>
      <div className='px-6 py-8 sm:px-10'>
        <div className='mx-auto'>
          <h1 className='mb-8 text-center text-2xl font-bold text-white'>
            {dictionary.provision.title}
          </h1>

          <div className='space-y-6'>
            {sections.map((section, index) => {
              const lines = section
                .trim()
                .split('\n')
                .filter((line) => line.trim());
              if (lines.length === 0) return null;

              // 첫 번째 줄이 조항 제목인지 확인
              const isArticle = lines[0].startsWith('제') && lines[0].includes('조');

              if (!isArticle && index === 0) {
                // 서문인 경우
                return (
                  <div key={index} className='rounded-lg border border-white/20 p-6'>
                    <div className='space-y-4 leading-relaxed text-white/80'>
                      {lines.map((line, lineIndex) => (
                        <p key={lineIndex}>{line}</p>
                      ))}
                    </div>
                  </div>
                );
              }

              if (!isArticle) return null;

              const title = lines[0];
              const content = lines.slice(1);

              return (
                <div key={index} className='rounded-lg border border-white/20 p-6'>
                  <h2 className='mb-4 text-lg font-semibold text-white'>{title}</h2>
                  <div className='space-y-3 leading-relaxed text-white/80'>
                    {content.map((line, lineIndex) => {
                      // 숫자로 시작하는 목록 항목 처리
                      if (/^\d+\./.test(line.trim())) {
                        return (
                          <div key={lineIndex} className='ml-4'>
                            <p>{line}</p>
                          </div>
                        );
                      }
                      // 가, 나, 다 등으로 시작하는 세부 항목 처리
                      if (/^[가-힣]\./.test(line.trim())) {
                        return (
                          <div key={lineIndex} className='ml-8'>
                            <p>{line}</p>
                          </div>
                        );
                      }
                      // 일반 텍스트
                      if (line.trim()) {
                        return <p key={lineIndex}>{line}</p>;
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            })}

            {/* 부칙 */}
            <div className='rounded-lg border border-white/20 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-white'>
                {dictionary.provision.supplementary.title}
              </h2>
              <div className='space-y-2 text-white/80'>
                <p>{dictionary.provision.supplementary.content1}</p>
                <p>{dictionary.provision.supplementary.content2}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
