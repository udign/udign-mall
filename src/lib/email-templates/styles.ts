// 이메일 템플릿 공통 스타일
export const emailStyles = `
  body { 
    margin: 0; 
    padding: 0; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  }
  .container { 
    margin: 30px auto; 
    width: 600px; 
    border: 10px solid #f7f7f7; 
  }
  .inner { 
    border: 1px solid #dedede; 
  }
  .header { 
    padding: 30px 30px 0; 
    background: #f7f7f7; 
    color: #555; 
    font-size: 1.4em; 
    font-weight: bold; 
  }
  .site-link { 
    display: block; 
    padding: 10px 30px 30px; 
    background: #f7f7f7; 
    text-align: right; 
  }
  .site-link a { 
    color: #555; 
    text-decoration: none; 
  }
  .content { 
    margin: 20px 0 0; 
    padding: 30px 30px 50px; 
    min-height: 200px; 
    border-bottom: 1px solid #eee; 
    line-height: 1.6; 
  }
  .member-info { 
    background: #f9f9f9; 
    padding: 15px; 
    margin: 15px 0; 
    border-left: 4px solid #007bff; 
  }
  .cta-button { 
    display: inline-block; 
    padding: 15px 30px; 
    background: #ff3061 !important; 
    color: #fff !important; 
    text-decoration: none !important; 
    text-align: center; 
    font-weight: bold;
    font-size: 1.1em;
    border-radius: 8px;
    margin: 30px auto;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(255, 48, 97, 0.3);
    transition: all 0.3s ease;
  }
  .cta-button:hover {
    background: #e02851 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 48, 97, 0.4);
  }
  .cta-container {
    text-align: center;
    padding: 20px 30px 30px;
    background: #f9f9f9;
  }
  
  /* 주문 메일용 추가 스타일 */
  .order-info { 
    margin: 0 auto 20px; 
    width: 94%; 
    padding: 15px; 
    background: #f9f9f9; 
    border-left: 4px solid #007bff; 
  }
  .order-table { 
    margin: 0 auto 20px; 
    width: 94%; 
    border: 0; 
    border-collapse: collapse; 
  }
  .table-caption { 
    padding: 0 0 5px; 
    font-weight: bold; 
    text-align: left; 
  }
  .table-th { 
    padding: 8px; 
    border-top: 1px solid #e9e9e9; 
    border-bottom: 1px solid #e9e9e9; 
    background: #f5f6fa; 
    text-align: left; 
    font-weight: bold; 
  }
  .table-td { 
    padding: 8px; 
    border-top: 1px solid #e9e9e9; 
    border-bottom: 1px solid #e9e9e9; 
  }
  .table-empty { 
    padding: 30px; 
    border-top: 1px solid #e9e9e9; 
    border-bottom: 1px solid #e9e9e9; 
    text-align: center; 
    color: #999; 
  }
  .product-link { 
    text-decoration: none; 
    color: #333; 
  }
  .product-link:hover { 
    text-decoration: underline; 
  }
  .price { 
    font-weight: bold; 
    color: #007bff; 
  }
  .total-price { 
    font-weight: bold; 
    color: #dc3545; 
    font-size: 1.1em; 
  }
`;

// 가격 포맷팅 함수
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
};

// 포인트 포맷팅 함수
export const formatPoint = (point: number): string => {
  return new Intl.NumberFormat('ko-KR').format(point) + 'P';
};
