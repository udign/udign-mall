export default function Footer() {
  return (
    <div className='bg-dark text-center'>
      <h1 className='sr-only'>하단</h1>
      <div className='mx-auto inline-block max-w-6xl px-5 py-10 text-left'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
          <div className='text-left'>
            <h2 className='mb-4 font-bold text-white'>QUICK LINK</h2>
            <div className='space-y-2'>
              <a
                href='/about'
                className='block leading-8 font-bold text-white transition-colors hover:text-gray-300'
              >
                사이트 소개
              </a>
              <a
                href='/terms'
                className='block leading-8 font-bold text-white transition-colors hover:text-gray-300'
              >
                서비스 이용약관
              </a>
              <a
                href='/privacy'
                className='block leading-8 font-bold text-white transition-colors hover:text-gray-300'
              >
                개인정보 처리방침
              </a>
            </div>
          </div>

          <div>
            <h2 className='mb-5 text-lg font-bold text-white'>COMPANY INFO</h2>
            <div className='leading-8 font-normal text-gray-300'>
              <p>(주)유다인</p>
              <p>대표 : 문유성 | 전화 : 1577-4215</p>
              <p>팩스 : 02-356-5889</p>
              <p>사업장주소 : 서울시 은평구 진관3로 32,</p>
              <p>은평뉴타운파크앤타워 B동 6층 618호</p>
              <p>사업자등록번호 : 259-87-03288</p>
              <p>통신판매업신고번호 : 제 2025-서울은평-0219호</p>
              <p>개인정보관리책임자 : 문유성, 한훈희</p>
              <p>E-MAIL : udign0401@naver.com</p>
            </div>
          </div>

          <div>
            <h2 className='mb-5 text-lg font-bold text-white'>CUSTOMER CENTER</h2>
            <div className='leading-8 font-normal text-gray-300'>
              <p>
                <strong className='text-xl font-bold text-white'>1577-4215</strong>
              </p>
              <p>운영시간 : 평일 09:00 ~ 17:00</p>
              <p>점심시간 : 평일 12:00 ~ 13:00</p>
              <p>토,일요일/공휴일 휴무</p>
            </div>
          </div>

          <div>
            <div className='my-5 text-gray-300'>
              <p>
                <strong>내 디자인 업로드하기</strong>
              </p>
              <p>오직 당신만을 위한 디자인을 선택하세요.</p>
              <p>최고의 선물이 완성됩니다.</p>
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto w-full max-w-6xl border-t border-gray-700 py-5 text-center text-sm text-gray-600'>
        Copyright © <strong>udign.com</strong>. All rights reserved.
      </div>
    </div>
  );
}
