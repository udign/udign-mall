import { emailStyles, formatPrice, formatPoint } from './styles';
import { OrderCompleteEmailData } from './types';

export const OrderCompleteAdminTemplate = (data: OrderCompleteEmailData): string => {
  const {
    siteName,
    siteUrl,
    orderId,
    orderDate,
    orderItems,
    sendCost,
    additionalSendCost,
    totalPrice,
    totalPoint,
    paymentInfo,
    ordererInfo,
    deliveryInfo,
  } = data;

  // 주소 포맷팅
  const formatAddress = (zipcode?: string, addr1?: string, addr2?: string, addr3?: string) => {
    let address = '';
    if (zipcode) address += `(${zipcode}) `;
    if (addr1) address += addr1;
    if (addr2) address += ` ${addr2}`;
    if (addr3) address += ` ${addr3}`;
    return address || '정보 없음';
  };

  return `
    <!doctype html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <title>${siteName} - 새 주문 알림</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="inner">
          <h1 class="header">${siteName} - 새 주문이 접수되었습니다.</h1>
          
          <div class="order-info">
            <strong>주문번호 ${orderId}</strong><br>
            주문자: ${ordererInfo.name}<br>
            본 메일은 ${orderDate}을 기준으로 작성되었습니다.
          </div>

          <!-- 주문 내역 -->
          <table class="order-table">
            <caption class="table-caption">주문 내역</caption>
            <colgroup>
              <col style="width:130px">
              <col>
            </colgroup>
            <tbody>
              ${orderItems
                .map(
                  (item) => `
                <tr>
                  <th class="table-th">상품명</th>
                  <td class="table-td">
                    ${
                      item.product_url
                        ? `<a href="${item.product_url}" target="_blank" class="product-link">${item.it_name}</a>`
                        : item.it_name
                    }
                  </td>
                </tr>
                <tr>
                  <th class="table-th">판매가격</th>
                  <td class="table-td price">${formatPrice(item.it_price)}</td>
                </tr>
                ${
                  item.it_option
                    ? `
                <tr>
                  <th class="table-th">선택옵션</th>
                  <td class="table-td">${item.it_option}</td>
                </tr>
                `
                    : ''
                }
                <tr>
                  <th class="table-th">수량</th>
                  <td class="table-td">${item.quantity}개</td>
                </tr>
                <tr>
                  <th class="table-th">소계</th>
                  <td class="table-td price">${formatPrice(item.subtotal_price)}</td>
                </tr>
                <tr>
                  <th class="table-th">포인트</th>
                  <td class="table-td">${formatPoint(item.subtotal_point)}</td>
                </tr>
              `,
                )
                .join('')}
              
              ${
                sendCost > 0
                  ? `
              <tr>
                <th class="table-th">배송비</th>
                <td class="table-td price">${formatPrice(sendCost)}</td>
              </tr>
              `
                  : ''
              }
              
              ${
                additionalSendCost > 0
                  ? `
              <tr>
                <th class="table-th">추가배송비</th>
                <td class="table-td price">${formatPrice(additionalSendCost)}</td>
              </tr>
              `
                  : ''
              }
              
              <tr>
                <th class="table-th">주문합계</th>
                <td class="table-td total-price">${formatPrice(totalPrice)}</td>
              </tr>
              <tr>
                <th class="table-th">포인트합계</th>
                <td class="table-td">${formatPoint(totalPoint)}</td>
              </tr>
            </tbody>
          </table>

          <!-- 결제정보 -->
          <table class="order-table">
            <caption class="table-caption">결제정보</caption>
            <colgroup>
              <col style="width:130px">
              <col>
            </colgroup>
            <tbody>
              ${
                paymentInfo.receipt_point > 0
                  ? `
              <tr>
                <th class="table-th">포인트 사용액</th>
                <td class="table-td">${formatPoint(paymentInfo.receipt_point)}</td>
              </tr>
              `
                  : ''
              }
              
              ${
                paymentInfo.receipt_price > 0 && paymentInfo.settle_case === '신용카드'
                  ? `
              <tr>
                <th class="table-th">신용카드 결제액</th>
                <td class="table-td price">${formatPrice(paymentInfo.receipt_price)}</td>
              </tr>
              `
                  : ''
              }
              
              ${
                paymentInfo.receipt_price > 0 && paymentInfo.settle_case === '계좌이체'
                  ? `
              <tr>
                <th class="table-th">계좌이체 결제액</th>
                <td class="table-td price">${formatPrice(paymentInfo.receipt_price)}</td>
              </tr>
              ${
                paymentInfo.bank_account
                  ? `
              <tr>
                <th class="table-th">계좌번호</th>
                <td class="table-td">${paymentInfo.bank_account}</td>
              </tr>
              `
                  : ''
              }
              ${
                paymentInfo.deposit_name
                  ? `
              <tr>
                <th class="table-th">입금자명</th>
                <td class="table-td">${paymentInfo.deposit_name}</td>
              </tr>
              `
                  : ''
              }
              `
                  : ''
              }
              
              ${
                !paymentInfo.receipt_point && !paymentInfo.receipt_price
                  ? `
              <tr>
                <td colspan="2" class="table-empty">결제정보가 없습니다.</td>
              </tr>
              `
                  : ''
              }
            </tbody>
          </table>

          <!-- 주문하신 분 정보 -->
          <table class="order-table">
            <caption class="table-caption">주문하신 분 정보</caption>
            <colgroup>
              <col style="width:130px">
              <col>
            </colgroup>
            <tbody>
              <tr>
                <th class="table-th">이름</th>
                <td class="table-td">${ordererInfo.name}</td>
              </tr>
              ${
                ordererInfo.tel
                  ? `
              <tr>
                <th class="table-th">전화번호</th>
                <td class="table-td">${ordererInfo.tel}</td>
              </tr>
              `
                  : ''
              }
              ${
                ordererInfo.hp
                  ? `
              <tr>
                <th class="table-th">핸드폰</th>
                <td class="table-td">${ordererInfo.hp}</td>
              </tr>
              `
                  : ''
              }
              <tr>
                <th class="table-th">주소</th>
                <td class="table-td">${formatAddress(ordererInfo.zipcode, ordererInfo.address1, ordererInfo.address2, ordererInfo.address3)}</td>
              </tr>
              ${
                ordererInfo.hope_date
                  ? `
              <tr>
                <th class="table-th">희망배송일</th>
                <td class="table-td">${ordererInfo.hope_date}</td>
              </tr>
              `
                  : ''
              }
            </tbody>
          </table>

          <!-- 배송지 정보 -->
          <table class="order-table">
            <caption class="table-caption">배송지 정보</caption>
            <colgroup>
              <col style="width:130px">
              <col>
            </colgroup>
            <tbody>
              <tr>
                <th class="table-th">이름</th>
                <td class="table-td">${deliveryInfo.name}</td>
              </tr>
              ${
                deliveryInfo.tel
                  ? `
              <tr>
                <th class="table-th">전화번호</th>
                <td class="table-td">${deliveryInfo.tel}</td>
              </tr>
              `
                  : ''
              }
              ${
                deliveryInfo.hp
                  ? `
              <tr>
                <th class="table-th">핸드폰</th>
                <td class="table-td">${deliveryInfo.hp}</td>
              </tr>
              `
                  : ''
              }
              <tr>
                <th class="table-th">주소</th>
                <td class="table-td">${formatAddress(deliveryInfo.zipcode, deliveryInfo.address1, deliveryInfo.address2, deliveryInfo.address3)}</td>
              </tr>
              ${
                deliveryInfo.memo
                  ? `
              <tr>
                <th class="table-th">전하실 말씀</th>
                <td class="table-td">${deliveryInfo.memo}</td>
              </tr>
              `
                  : ''
              }
            </tbody>
          </table>

          <a href="${siteUrl}/admin/orders" target="_blank" class="cta-button">관리자에서 주문 확인</a>
        </div>
      </div>
    </body>
    </html>
  `;
};
