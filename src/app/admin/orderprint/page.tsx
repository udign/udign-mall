'use client';

import { useState, useCallback } from 'react';
import { FileText, Calendar as CalendarIcon, Download, Printer, Search } from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Separator } from '@/components/ui/primitives/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
import { Calendar } from '@/components/ui/primitives/calendar';
import { OrderFilter, OrderPrintData, ORDER_STATUS_OPTIONS, OrderStatus } from '@/types/order';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import MessageDialog from '@/components/ui/MessageDialog';

interface MessageDialogState {
  open: boolean;
  title: string;
  description: string;
}
export default function OrderPrintPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<OrderPrintData[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [filter, setFilter] = useState<OrderFilter>({
    case: 1,
    ct_status: 'all',
    fr_date: '',
    to_date: '',
    fr_od_id: '',
    to_od_id: '',
  });
  const [messageDialog, setMessageDialog] = useState<MessageDialogState>({
    open: false,
    title: '',
    description: '',
  });

  const fetchOrderData = useCallback(async (searchFilter: OrderFilter) => {
    try {
      setLoading(true);

      const searchParams = new URLSearchParams({
        case: searchFilter.case.toString(),
        ct_status: searchFilter.ct_status,
        csv: 'xlsx', // 기본값으로 설정 (실제로는 다운로드 시점에 결정)
        ...(searchFilter.case === 1 && {
          fr_date: searchFilter.fr_date,
          to_date: searchFilter.to_date,
        }),
        ...(searchFilter.case === 2 && {
          fr_od_id: searchFilter.fr_od_id,
          to_od_id: searchFilter.to_od_id,
        }),
      });

      const response = await fetch(`/api/admin/orders?${searchParams}`);
      const result = await response.json();

      if (result.success) {
        setOrderData(result.data);
        setShowPreview(true);
      } else {
        setMessageDialog({
          open: true,
          title: '조회 실패',
          description: result.error || '주문내역 조회에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('주문내역 조회 오류:', error);
      setMessageDialog({
        open: true,
        title: '오류 발생',
        description: '주문내역 조회 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownload = useCallback(
    async (format: 'xlsx' | 'csv') => {
      try {
        if (orderData.length === 0) {
          setMessageDialog({
            open: true,
            title: '데이터 없음',
            description: '다운로드할 주문내역이 없습니다.',
          });
          return;
        }

        const response = await fetch('/api/admin/orders/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format,
            data: orderData,
          }),
        });

        if (response.ok) {
          // 서버 응답을 Blob(Binary Large Object) 형태로 변환
          // Blob은 파일의 바이너리 데이터를 메모리에 저장하는 객체
          const blob = await response.blob();

          // Blob을 브라우저가 접근할 수 있는 임시 URL로 변환
          // 예: blob:http://localhost:3000/12345678-1234-1234-1234-123456789abc
          const url = window.URL.createObjectURL(blob);

          // 가상의 다운로드 링크(<a> 태그)를 동적으로 생성
          const a = document.createElement('a');
          a.href = url; // 다운로드할 파일의 URL 설정

          // 다운로드될 파일명 설정 (현재 날짜 + 파일 형식)
          // 예: orderlist-2024-01-15.xlsx 또는 orderlist-2024-01-15.csv
          a.download = `orderlist-${dayjs().format('YYYY-MM-DD')}.${format}`;

          // DOM에 <a> 태그 추가 (화면에는 보이지 않음)
          document.body.appendChild(a);

          // 프로그래밍 방식으로 클릭 이벤트 발생시켜 다운로드 시작
          a.click();

          // 메모리 누수 방지를 위해 생성된 Object URL 해제
          window.URL.revokeObjectURL(url);

          // DOM에서 임시로 추가했던 <a> 태그 제거
          document.body.removeChild(a);
        } else {
          setMessageDialog({
            open: true,
            title: '다운로드 실패',
            description: '파일 다운로드에 실패했습니다.',
          });
        }
      } catch (error) {
        console.error('다운로드 오류:', error);
        setMessageDialog({
          open: true,
          title: '오류 발생',
          description: '다운로드 중 오류가 발생했습니다.',
        });
      }
    },
    [orderData],
  );

  const handlePrint = useCallback(() => {
    if (orderData.length === 0) {
      setMessageDialog({
        open: true,
        title: '데이터 없음',
        description: '출력할 주문내역이 없습니다.',
      });
      return;
    }

    const printContent = generatePrintHTML(orderData, filter);

    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const printWindow = window.open(url, '_blank', 'width=800,height=600');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return;
    }

    // 창이 로드된 후 URL 정리
    printWindow.onload = () => {
      URL.revokeObjectURL(url);
    };
  }, [orderData, filter]);

  const validateForm = (searchFilter: OrderFilter): boolean => {
    if (searchFilter.case === 1) {
      if (!searchFilter.fr_date || !searchFilter.to_date) {
        setMessageDialog({
          open: true,
          title: '입력 오류',
          description: '날짜 범위를 입력해주세요.',
        });
        return false;
      }
    } else {
      if (!searchFilter.fr_od_id || !searchFilter.to_od_id) {
        setMessageDialog({
          open: true,
          title: '입력 오류',
          description: '주문번호 범위를 입력해주세요.',
        });
        return false;
      }
    }
    return true;
  };

  const handleDateSearch = () => {
    // 기간별 조회 시 이전 결과 초기화 및 case 설정
    const dateFilter = { ...filter, case: 1 as const };
    if (!validateForm(dateFilter)) return;

    // 이전 조회 결과 초기화
    setShowPreview(false);
    setOrderData([]);

    setFilter(dateFilter);
    fetchOrderData(dateFilter);
  };

  const handleOrderIdSearch = () => {
    // 주문번호 구간별 조회 시 이전 결과 초기화 및 case 설정
    const orderIdFilter = { ...filter, case: 2 as const };
    if (!validateForm(orderIdFilter)) return;

    // 이전 조회 결과 초기화
    setShowPreview(false);
    setOrderData([]);

    setFilter(orderIdFilter);
    fetchOrderData(orderIdFilter);
  };

  // 날짜 문자열을 Date 객체로 변환
  const parseDate = (dateStr: string): Date | undefined => {
    if (dateStr.length === 8) {
      // YYYYMMDD 형식을 Day.js로 파싱하여 Date 객체로 변환
      const parsed = dayjs(dateStr, 'YYYYMMDD');
      return parsed.isValid() ? parsed.toDate() : undefined;
    }
    return undefined;
  };

  // Date 객체를 필터용 문자열로 변환
  const formatDateFromPicker = (date: Date | undefined): string => {
    if (!date) return '';
    return dayjs(date).format('YYYYMMDD');
  };

  return (
    <>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>주문내역 출력</h1>
            <p className='mt-1 text-gray-600'>
              기간별 또는 주문번호구간별 주문내역을 조회하고 출력할 수 있습니다.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <FileText className='h-5 w-5 text-gray-500' />
            <span className='text-sm text-gray-500'>주문내역 관리</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CalendarIcon className='h-5 w-5' />
              기간별 출력
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-wrap items-end gap-4'>
              <div className='space-y-2'>
                <Label>출력 대상</Label>
                <Select
                  value={filter.ct_status}
                  onValueChange={(value) =>
                    setFilter((prev) => ({ ...prev, ct_status: value as OrderStatus | '' | 'all' }))
                  }
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='전체' />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>시작일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='w-40 justify-start text-left font-normal'>
                      <CalendarIcon className='h-4 w-4' />
                      {parseDate(filter.fr_date)
                        ? dayjs(parseDate(filter.fr_date)).format('YYYY년 MM월 DD일')
                        : '시작일을 선택하세요'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={parseDate(filter.fr_date)}
                      onSelect={(date) =>
                        setFilter((prev) => ({ ...prev, fr_date: formatDateFromPicker(date) }))
                      }
                      disabled={(date) => dayjs(date).isAfter(dayjs(), 'day')}
                      captionLayout='dropdown'
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='space-y-2'>
                <Label>종료일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='w-40 justify-start text-left font-normal'>
                      <CalendarIcon className='h-4 w-4' />
                      {parseDate(filter.to_date)
                        ? dayjs(parseDate(filter.to_date)).format('YYYY년 MM월 DD일')
                        : '종료일을 선택하세요'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={parseDate(filter.to_date)}
                      onSelect={(date) =>
                        setFilter((prev) => ({ ...prev, to_date: formatDateFromPicker(date) }))
                      }
                      disabled={(date) => dayjs(date).isAfter(dayjs(), 'day')}
                      captionLayout='dropdown'
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleDateSearch}
                disabled={loading}
                className='flex items-center gap-2'
              >
                <Search className='h-4 w-4' />
                조회
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              주문번호 구간별 출력
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-wrap items-end gap-4'>
              <div className='space-y-2'>
                <Label>출력 대상</Label>
                <Select
                  value={filter.ct_status}
                  onValueChange={(value) =>
                    setFilter((prev) => ({ ...prev, ct_status: value as OrderStatus | '' | 'all' }))
                  }
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='전체' />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>시작 주문번호</Label>
                <Input
                  type='text'
                  value={filter.fr_od_id}
                  onChange={(e) => setFilter((prev) => ({ ...prev, fr_od_id: e.target.value }))}
                  placeholder='예: 202401010001'
                  className='w-40'
                />
              </div>

              <div className='space-y-2'>
                <Label>종료 주문번호</Label>
                <Input
                  type='text'
                  value={filter.to_od_id}
                  onChange={(e) => setFilter((prev) => ({ ...prev, to_od_id: e.target.value }))}
                  placeholder='예: 202401310999'
                  className='w-40'
                />
              </div>

              <Button
                onClick={handleOrderIdSearch}
                disabled={loading}
                className='flex items-center gap-2'
              >
                <Search className='h-4 w-4' />
                조회
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className='flex items-center justify-center py-8'>
              <LoadingSpinner size='lg' message='주문내역을 조회하고 있습니다...' />
            </CardContent>
          </Card>
        )}

        {showPreview && orderData.length > 0 && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>조회 결과</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-600'>
                  총 {orderData.length}건의 주문내역이 조회되었습니다.
                </p>
                <div className='flex gap-2'>
                  <Button
                    onClick={() => handleDownload('xlsx')}
                    className='flex items-center gap-2'
                  >
                    <Download className='h-4 w-4' />
                    Excel 다운로드
                  </Button>
                  <Button
                    onClick={() => handleDownload('csv')}
                    variant='outline'
                    className='flex items-center gap-2'
                  >
                    <Download className='h-4 w-4' />
                    CSV 다운로드
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant='outline'
                    className='flex items-center gap-2'
                  >
                    <Printer className='h-4 w-4' />
                    새창 출력
                  </Button>
                </div>
              </div>

              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        주문번호
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        수령인
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        상품명
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        수량
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        배송비
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        운송장번호
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white'>
                    {orderData.slice(0, 10).map((item, index) => (
                      <tr key={index} className='hover:bg-gray-50'>
                        <td className='px-3 py-2 text-sm whitespace-nowrap text-gray-900'>
                          {item.od_id}
                        </td>
                        <td className='px-3 py-2 text-sm whitespace-nowrap text-gray-900'>
                          {item.od_b_name}
                        </td>
                        <td className='max-w-48 truncate px-3 py-2 text-sm text-gray-900'>
                          {item.it_name}
                        </td>
                        <td className='px-3 py-2 text-sm whitespace-nowrap text-gray-900'>
                          {item.ct_qty}
                        </td>
                        <td className='px-3 py-2 text-sm whitespace-nowrap text-gray-900'>
                          {item.ct_send_cost_text}
                        </td>
                        <td className='px-3 py-2 text-sm whitespace-nowrap text-gray-900'>
                          {item.od_invoice || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {orderData.length > 10 && (
                <p className='text-center text-sm text-gray-500'>
                  ... 외 {orderData.length - 10}건 더 (전체 데이터는 다운로드 시 포함됩니다)
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {showPreview && orderData.length === 0 && !loading && (
          <Card>
            <CardContent className='flex items-center justify-center py-8'>
              <div className='text-center'>
                <FileText className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <p className='text-gray-500'>조회된 주문내역이 없습니다.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}
        title={messageDialog.title}
        description={messageDialog.description}
      />
    </>
  );
}

// 새창 출력용 HTML 생성
function generatePrintHTML(data: OrderPrintData[], filter: OrderFilter): string {
  const title =
    filter.case === 1
      ? `${filter.fr_date} 부터 ${filter.to_date} 까지 ${filter.ct_status || '전체'} 내역`
      : `${filter.fr_od_id} 부터 ${filter.to_od_id} 까지 ${filter.ct_status || '전체'} 내역`;

  const tableRows = data
    .map(
      (item) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.od_id}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.od_b_name}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.full_address}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.formatted_phone1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.formatted_phone2}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.it_name}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.ct_qty}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.ct_send_cost_text}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.od_invoice || '-'}</td>
    </tr>
  `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>주문내역 출력</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .print-info { margin-bottom: 20px; color: #666; }
      </style>
    </head>
    <body>
      <h1>주문내역</h1>
      <div class="print-info">
        <p><strong>조회 조건:</strong> ${title}</p>
        <p><strong>출력 일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        <p><strong>총 건수:</strong> ${data.length}건</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>주문번호</th>
            <th>수령인</th>
            <th>주소</th>
            <th>전화번호1</th>
            <th>전화번호2</th>
            <th>상품명</th>
            <th>수량</th>
            <th>배송비</th>
            <th>운송장번호</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; text-align: center; color: #666;">
        &lt;출력 끝&gt;
      </div>
    </body>
    </html>
  `;
}
