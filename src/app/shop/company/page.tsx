import Image from 'next/image';

export default function CompanyPage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <div className='mx-auto'>
          <h1 className='mb-8 text-center text-2xl font-bold text-gray-900'>회사소개</h1>

          <div className='mb-8 space-y-6'>
            <div className='relative overflow-hidden rounded-lg border border-gray-200'>
              <Image
                src='/images/comp_1.jpg'
                alt='유다인 회사 이미지 1'
                width={800}
                height={400}
                className='h-64 w-full object-cover'
              />
              <div className='bg-opacity-40 absolute inset-0 flex items-center justify-center'>
                <p className='px-6 text-center text-lg leading-normal font-medium text-white sm:text-2xl'>
                  유다인은 작가의 가치를 창출하고 새로운 문화를
                  <br />전 세계 곳곳에 전파하기 위해 노력합니다
                </p>
              </div>
            </div>
            <div className='overflow-hidden rounded-lg border border-gray-200'>
              <Image
                src='/images/comp_2.jpg'
                alt='유다인 회사 이미지 2'
                width={800}
                height={400}
                className='h-64 w-full object-cover'
              />
            </div>
          </div>

          <div className='mb-8 rounded-lg border border-gray-200 p-6'>
            <h2 className='mb-4 text-center text-lg font-semibold text-gray-900'>
              디자인 제작판매 플랫폼 유다인 방문을 환영합니다.
            </h2>
            <div className='space-y-4 text-gray-700'>
              <p>
                세련되고 트렌디한 디자인으로 레이아웃된 메인페이지와 총 60여 페이지에 달하는 다양한
                폼이 반영된 콘텐츠페이지로 구성되어 고객만족도를 한층 더 높이는 것이 가능해졌습니다.
              </p>
              <p>
                탬플릿에 올려진 샘플을 보고 업종에 맞는 페이지와 원하는 폼을 선택하여 홈페이지를
                구성할 수 있으며, 희망하는 경우 비용추가 없이 풀 버전 전체 사용도 가능합니다.
              </p>
              <p>
                솔루션 개발 덕분에 원가를 대폭 낮추어 서비스 공급하는 것이 가능해져서 저렴한
                비용으로 高 퀄리티 홈페이지를 짧은 기간 내 제작할 수 있습니다.
              </p>
              <p>
                기대에 충족될 수 있도록 고품격 홈페이지 제작을 약속드립니다. 홈페이지 제작을 통해
                고객님의 꿈과 미래를 함께 만들어 가시길 바랍니다.
              </p>
              <p>
                고객으로부터 신뢰와 사랑을 받는 건강한 기업 유다인이 되고자 끊임없는 노력을 경주
                하겠습니다.
              </p>
              <p className='font-medium text-blue-700'>
                유다인 회사 로고는 부와 행운을 상징하는 것으로 사업번창을 기원하는 의미를 담고
                있습니다. 고객님의 지속적인 사업번창과 성공을 기원합니다. 감사합니다.
              </p>
            </div>
          </div>

          <div className='mb-8 rounded-lg border border-gray-200 bg-blue-50 p-6'>
            <h2 className='mb-4 text-center text-xl font-bold text-gray-900'>경영이념 및 비전</h2>
            <div className='text-center'>
              <p className='mb-2 text-lg font-semibold text-blue-800'>
                Ethical Management, the Foundation of
              </p>
              <p className='mb-4 text-lg font-semibold text-blue-800'>
                Trust the Ground for Sustainable Growth
              </p>
              <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
                <div className='rounded-lg bg-white p-4'>
                  <h3 className='mb-2 font-semibold text-gray-900'>지속가능</h3>
                  <p className='text-gray-600'>지속가능한 성장을 위한 기업경영을 실천합니다.</p>
                </div>
                <div className='rounded-lg bg-white p-4'>
                  <h3 className='mb-2 font-semibold text-gray-900'>공정경쟁</h3>
                  <p className='text-gray-600'>
                    공정한 상거래 질서 유지 법규 및 사회상규를 준수합니다.
                  </p>
                </div>
                <div className='rounded-lg bg-white p-4'>
                  <h3 className='mb-2 font-semibold text-gray-900'>투명경영</h3>
                  <p className='text-gray-600'>구성원 및 이해관계자 정보공유, 리스크 사전예방</p>
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            <h2 className='text-xl font-bold text-gray-900'>핵심 가치</h2>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>고객만족 실현</h3>
              <p className='leading-relaxed text-gray-700'>
                고객의 의견을 중시하고, 더 큰 만족을 드리기 위해 한결같은 마음으로 고객가치 경영을
                실현 합니다. 고객의 의견을 중시하고, 더 큰 만족을 드리기 위해 한결같은 마음으로
                고객가치 경영을 실현 합니다. 고객의 의견을 중시하고, 더 큰 만족을 드리기 위해
                한결같은 마음으로 고객가치 경영을 실현 합니다.
              </p>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>공정하고 투명한 경영</h3>
              <p className='leading-relaxed text-gray-700'>
                법규를 준수하고 공정하고 깨끗한 경영환경을 만들어 갑니다. 법규를 준수하고 공정하고
                깨끗한 경영환경을 만들어 갑니다. 법규를 준수하고 공정하고 깨끗한 경영환경을 만들어
                갑니다. 법규를 준수하고 공정하고 깨끗한 경영환경을 만들어 갑니다. 법규를 준수하고
                공정하고 깨끗한 경영환경을 만들어 갑니다.
              </p>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>환경친화적인 경영</h3>
              <p className='leading-relaxed text-gray-700'>
                환경친화적인 사업활동을 통해 경제발전과 지역 사회 발전을 위해 노력합니다.
                환경친화적인 사업활동을 통해 경제발전과 지역 사회 발전을 위해 노력합니다.
                환경친화적인 사업활동을 통해 경제발전과 지역 사회 발전을 위해 노력합니다.
                환경친화적인 사업활동을 통해 경제발전과 지역 사회 발전을 위해 노력합니다.
              </p>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>품질경영</h3>
              <p className='leading-relaxed text-gray-700'>
                최고의 기술력으로 고품질 고부가가치를 지향하고 안전관리에 최선을 다합니다. 최고의
                기술력으로 고품질 고부가가치를 지향하고 안전관리에 최선을 다합니다. 최고의
                기술력으로 고품질 고부가가치를 지향하고 안전관리에 최선을 다합니다. 최고의
                기술력으로 고품질 고부가가치를 지향하고 안전관리에 최선을 다합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
