export default function GuidePage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <div className='mx-auto'>
          <h1 className='mb-8 text-center text-2xl font-bold text-gray-900'>이용안내</h1>

          <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
            <p className='text-center text-gray-700'>
              유다인의 모든 진행상황은 <span className='font-semibold text-red-500'>MY UDIGN</span>{' '}
              에서 확인하실 수 있습니다.
            </p>
          </div>

          <div className='mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6'>
            <div className='flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600'>
              <span className='font-semibold'>디자인 좋아요</span>
              <span>→</span>
              <span className='font-semibold'>제작 검토</span>
              <span>→</span>
              <span className='font-semibold'>구매진행</span>
              <span>→</span>
              <span className='font-semibold'>주문확정</span>
              <span>→</span>
              <span className='font-semibold'>상품제작</span>
              <span>→</span>
              <span className='font-semibold'>배송진행</span>
              <span>→</span>
              <span className='font-semibold'>수령완료</span>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                1. 맘에 드는 디자인에는 &quot;좋아요♥&quot;를 꼭 눌러주세요~
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>
                  선택하신 디자인의 &quot;좋아요♥&quot; 가 정해진 수량만큼 모아지면 제작 검토를
                  통하여 상품으로 제작될 기회가 주어집니다. (한정 수량 제작)
                </p>
                <p>
                  &quot;좋아요♥&quot;를 한 순서에 따라 한정된 수량의 고유번호를 받게 되며, 이
                  번호는 차후 제작되는 상품 고유번호로 이어집니다.
                </p>
                <p className='text-sm text-gray-500'>
                  ( 제작검토 단계 전까지 좋아요 취소도 가능해요. )
                </p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                2. 제작검토 단계의 디자인은 UDIGN 에서 상품 제작 여부 검토 및 전반적인 상품화 준비를
                합니다.
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>
                  상품화 준비 과정으로 내부 검토가 진행됩니다. 그러나, 디자인의 내ㆍ외부 요건에 따라
                  제작 진행이 어려울 수 있으며, 불가 사유는 개별 안내 드립니다.
                </p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                3. 제작 확정 및 상품화 준비가 완료되면 디자인 상세페이지가 상품 구매페이지로
                변경되어 결제가 가능합니다.
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>
                  구매 안내 메시지와 함께 MY UDIGN에서 구매버튼이 활성화됩니다. 구매버튼을 누르면
                  구매페이지로 이동하며 상품설명 및 배송관련 내용을 확인하시고 결제진행 하시면
                  주문확정!!
                </p>
                <p className='font-semibold'>여러분은 상품의 N번째 주인!!</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                4. 결제가 모두 모여지고 있는 주문확정 단계.
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>
                  구매 결제가 모두 진행되는 일정 기간 동안 주문확정 단계에서 주문취소를 할 수
                  있습니다. (※ 제작 중에는 취소 불가합니다.)
                </p>
                <p>
                  주문 취소 시 재구매는 불가하며 상품 고유번호도 삭제되므로 신중한 선택 부탁드려요.
                </p>
                <p>
                  차후 발견되는 디자인의 문제를 포함한 일부 요인에 의해 제작 진행이 어려워질 경우
                  개별 안내와 함께 즉시 환불해 드립니다.
                </p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                5. 모두 결제 OK! 좋아요♥ 해 주신 회원들만의 상품이 제작됩니다. UDIGN let&apos;s go!
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>
                  한정 수량 , 최고의 품질을 추구하는 UDIGN 이기에 제작 기간이 오래 걸릴 수 있는 점
                  양해 부탁드려요. 열정을 다해 보답하겠습니다!!
                </p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                6. 제작 완료되면 검수, 포장 후 신속하게 고객님의 집 앞으로 출발합니다.
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>
                  기다려주셔서 정말 감사드립니다. 제작이 완료되면 전문 물류팀을 통해 포장되어 출고,
                  택배로 배송됩니다.
                </p>
                <p>
                  기본 배송 소요기간은 해당 택배사의 배송소요기간 기준에 준하며 지역 및 날씨,
                  택배사의 사정에 따라 차이가 있을 수 있으니 꼭 참고해주세요~
                </p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                7. 배송완료 및 상품을 확인하시고 구매확정을 하시면 MY UDIGN의 모든 과정이 끝!!
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>
                  상품을 수령하시면 바로 상태 확인 부탁드리며 구매확정{' '}
                  <span className='font-semibold'>꼭!</span> 부탁드립니다.
                </p>
                <p>
                  만약 교환/반품을 진행하실 경우 사유와 함께 신청해주시면 빠른 진행 도와드릴께요.
                </p>
                <p>
                  다만, 한정된 주문 제작과 최고의 품질을 추구하는 유다인 상품의 특성상 일정 기간이
                  지나면 반품, 교환처리가 불가할 수 있습니다.
                </p>
                <p className='font-semibold'>다음 안내사항을 꼭 참고해 주세요.</p>
                <div className='ml-4 space-y-1 text-gray-600'>
                  <p>• 모든 교환 반품비는 부담없이 무료입니다.</p>
                  <p>• 반품이 확정되면 회원님의 해당 상품 시리얼번호(고유번호)는 삭제됩니다.</p>
                  <p>• 교환 진행할 경우 상품 시리얼번호(고유번호)는 그대로 유지됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
