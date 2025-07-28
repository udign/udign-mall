import { privacyPolicy } from '@/lib/terms-content';

export default function PrivacyPage() {
  // 개인정보 처리방침 내용을 조항별로 분리
  const sections = privacyPolicy.split(/(?=제\d+조)/g).filter((section) => section.trim());

  return (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <div className='mx-auto'>
          <h1 className='mb-8 text-center text-2xl font-bold text-gray-900'>개인정보 처리방침</h1>

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
                      // 목록 항목 처리 (보존 항목, 보존 근거 등)
                      if (
                        line.includes('보존 항목') ||
                        line.includes('보존 근거') ||
                        line.includes('보존 기간') ||
                        line.includes('파기절차') ||
                        line.includes('파기방법') ||
                        line.includes('설정방법') ||
                        line.includes('쿠키 등 사용 목적') ||
                        line.includes('쿠키 설정 거부 방법')
                      ) {
                        return (
                          <div key={lineIndex} className='ml-4'>
                            <p className='font-medium'>{line}</p>
                          </div>
                        );
                      }
                      // 연락처 정보 처리
                      if (
                        line.includes('개인정보 보호책임자') ||
                        line.includes('전화번호') ||
                        line.includes('이메일') ||
                        line.includes('개인정보 침해신고센터') ||
                        line.includes('개인정보 분쟁조정위원회') ||
                        line.includes('대검찰청') ||
                        line.includes('경찰청')
                      ) {
                        return (
                          <div key={lineIndex} className='ml-4'>
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
              <div className='text-gray-700'>
                <p>본 방침은 OOOO년 OO월 OO일부터 시행합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
