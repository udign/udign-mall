import { termsOfService } from '@/lib/terms-content';

export default function ProvisionPage() {
  // 약관 내용을 조항별로 분리
  const sections = termsOfService.split(/(?=제\d+조)/g).filter((section) => section.trim());

  return (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <div className='mx-auto'>
          <h1 className='mb-8 text-center text-2xl font-bold text-gray-900'>서비스 이용약관</h1>

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
                  <div key={index} className='rounded-lg border border-gray-200 p-6'>
                    <div className='space-y-4 leading-relaxed text-gray-700'>
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
                <div key={index} className='rounded-lg border border-gray-200 p-6'>
                  <h2 className='mb-4 text-lg font-semibold text-gray-900'>{title}</h2>
                  <div className='space-y-3 leading-relaxed text-gray-700'>
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
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>부칙</h2>
              <div className='space-y-2 text-gray-700'>
                <p>1. 이 약관은 2024년 01월 01일부터 시행합니다.</p>
                <p>
                  2. 이 약관은 전자상거래(인터넷사이버몰) 표준약관 제10023호(2014. 9. 19. 개정)를
                  준수합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
