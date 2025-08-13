'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSION_CHECKS } from '@/lib/constants';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import MessageDialog from '@/components/ui/MessageDialog';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Textarea } from '@/components/ui/primitives/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Badge } from '@/components/ui/primitives/badge';
import { Separator } from '@/components/ui/primitives/separator';
import { ArrowLeft, Package, User, CreditCard, Truck, Edit2, Save, X } from 'lucide-react';
import { formatOrderId, formatDateOnly } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

// 배송회사 목록
const DELIVERY_COMPANIES = [
  'CJ대한통운',
  '한진택배',
  '롯데택배',
  '우체국택배',
  '로젠택배',
  'CU편의점택배',
  'GS편의점택배',
  '경동택배',
  '대신택배',
  '일양로지스',
  '합동택배',
  'DHL',
  'FedEx',
  'UPS',
  '기타',
];

interface OrderDetail {
  // 주문 정보
  od_id: string;
  od_tno: string;
  od_time: string;
  od_status: string;
  od_settle_case: string;
  od_test: number;
  od_mobile: number;
  od_pg: string;
  
  // 주문자 정보
  od_name: string;
  od_email: string;
  od_tel: string;
  od_hp: string;
  od_zip: string;
  od_addr1: string;
  od_addr2: string;
  od_addr3: string;
  
  // 받는분 정보
  od_b_name: string;
  od_b_tel: string;
  od_b_hp: string;
  od_b_zip: string;
  od_b_addr1: string;
  od_b_addr2: string;
  od_b_addr3: string;
  
  // 배송 정보
  od_delivery_company: string;
  od_invoice: string;
  od_invoice_time: string;
  od_memo: string;
  od_shop_memo: string;
  
  // 금액 정보
  od_cart_price: number;
  od_send_cost: number;
  od_send_cost2: number;
  od_receipt_price: number;
  od_receipt_point: number;
  od_refund_price: number;
  od_cancel_price: number;
  od_coupon: number;
  od_misu: number;
  
  // 주문 상품
  items: {
    it_id: string;
    it_name: string;
    it_img1: string;
    ct_option: string;
    ct_qty: number;
    ct_price: number;
    ct_point: number;
    ct_status: string;
    io_price: number;
  }[];
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [editingMemo, setEditingMemo] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    company: '',
    invoice: '',
  });
  const [shopMemo, setShopMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    title: '',
    description: '',
  });

  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      router.push(ROUTES.SHOP);
      return;
    }

    fetchOrderDetail();
  }, [user, authLoading, router, orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();

      if (result.success) {
        setOrder(result.data);
        setDeliveryData({
          company: result.data.od_delivery_company || '',
          invoice: result.data.od_invoice || '',
        });
        setShopMemo(result.data.od_shop_memo || '');
      } else {
        setError(result.message || '주문 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('주문 정보 조회 오류:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliverySave = async () => {
    if (!deliveryData.company || !deliveryData.invoice) {
      setMessageDialog({
        open: true,
        title: '입력 오류',
        description: '배송회사와 송장번호를 모두 입력해주세요.',
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/orders/${orderId}/delivery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryCompany: deliveryData.company,
          invoice: deliveryData.invoice,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOrder(prev => prev ? {
          ...prev,
          od_delivery_company: deliveryData.company,
          od_invoice: deliveryData.invoice,
          od_status: result.data.newStatus || prev.od_status,
        } : null);
        setEditingDelivery(false);
        setMessageDialog({
          open: true,
          title: '배송 정보 등록',
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMessageDialog({
        open: true,
        title: '오류',
        description: error instanceof Error ? error.message : '배송 정보 저장에 실패했습니다.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMemoSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/orders/${orderId}/memo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopMemo,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOrder(prev => prev ? {
          ...prev,
          od_shop_memo: shopMemo,
        } : null);
        setEditingMemo(false);
        setMessageDialog({
          open: true,
          title: '메모 저장',
          description: '관리자 메모가 저장되었습니다.',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMessageDialog({
        open: true,
        title: '오류',
        description: error instanceof Error ? error.message : '메모 저장에 실패했습니다.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      '주문': { label: '주문', className: 'bg-gray-100 text-gray-800' },
      '입금': { label: '결제완료', className: 'bg-green-100 text-green-800' },
      '준비': { label: '상품제작', className: 'bg-yellow-100 text-yellow-800' },
      '배송': { label: '배송진행', className: 'bg-blue-100 text-blue-800' },
      '완료': { label: '배송완료', className: 'bg-green-100 text-green-800' },
      '취소': { label: '주문취소', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" message="주문 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || '주문 정보를 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.push(ROUTES.ADMIN_ORDERLIST)}>
            주문 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={ROUTES.ADMIN_ORDERLIST}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">주문 상세</h1>
            <p className="text-sm text-gray-600">
              주문번호: {formatOrderId(order.od_id)} | {formatDateOnly(order.od_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(order.od_status)}
          {order.od_test === 1 && <Badge variant="outline">테스트</Badge>}
          {order.od_mobile === 1 && <Badge variant="outline">모바일</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* 주문 상품 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                주문 상품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 pb-4 last:pb-0 last:border-0 border-b">
                    {item.it_img1 && (
                      <Image
                        src={item.it_img1}
                        alt={item.it_name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                        unoptimized
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.it_name}</p>
                      {item.ct_option && (
                        <p className="text-sm text-gray-600">{item.ct_option}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {(item.ct_price + item.io_price).toLocaleString()}원 × {item.ct_qty}개
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {((item.ct_price + item.io_price) * item.ct_qty).toLocaleString()}원
                      </p>
                      {getStatusBadge(item.ct_status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 배송 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  배송 정보
                </div>
                {!editingDelivery && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingDelivery(true)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingDelivery ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">배송회사</label>
                    <Select
                      value={deliveryData.company}
                      onValueChange={(value) =>
                        setDeliveryData((prev) => ({ ...prev, company: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="배송회사 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_COMPANIES.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">송장번호</label>
                    <Input
                      value={deliveryData.invoice}
                      onChange={(e) =>
                        setDeliveryData((prev) => ({ ...prev, invoice: e.target.value }))
                      }
                      placeholder="송장번호 입력"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleDeliverySave}
                      disabled={saving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      저장
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingDelivery(false);
                        setDeliveryData({
                          company: order.od_delivery_company || '',
                          invoice: order.od_invoice || '',
                        });
                      }}
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">배송회사</span>
                    <span className="font-medium">{order.od_delivery_company || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">송장번호</span>
                    <span className="font-medium">{order.od_invoice || '-'}</span>
                  </div>
                  {order.od_invoice_time && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">등록일시</span>
                      <span className="font-medium">{formatDateOnly(order.od_invoice_time)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 관리자 메모 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>관리자 메모</span>
                {!editingMemo && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMemo(true)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingMemo ? (
                <div className="space-y-4">
                  <Textarea
                    value={shopMemo}
                    onChange={(e) => setShopMemo(e.target.value)}
                    placeholder="관리자 메모 입력"
                    rows={4}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleMemoSave}
                      disabled={saving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      저장
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingMemo(false);
                        setShopMemo(order.od_shop_memo || '');
                      }}
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {order.od_shop_memo || '메모가 없습니다.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 결제 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">상품금액</span>
                  <span>{order.od_cart_price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">배송비</span>
                  <span>{(order.od_send_cost + order.od_send_cost2).toLocaleString()}원</span>
                </div>
                {order.od_coupon > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">쿠폰할인</span>
                    <span className="text-red-600">-{order.od_coupon.toLocaleString()}원</span>
                  </div>
                )}
                {order.od_receipt_point > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">포인트사용</span>
                    <span className="text-red-600">-{order.od_receipt_point.toLocaleString()}원</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>총 결제금액</span>
                  <span>{order.od_receipt_price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">결제수단</span>
                  <span className="text-sm">{order.od_settle_case}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주문자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                주문자 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">이름: </span>
                  <span className="font-medium">{order.od_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">연락처: </span>
                  <span className="font-medium">{order.od_hp || order.od_tel || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">이메일: </span>
                  <span className="font-medium">{order.od_email}</span>
                </div>
                <div>
                  <span className="text-gray-600">주소: </span>
                  <span className="font-medium">
                    {order.od_zip} {order.od_addr1} {order.od_addr2} {order.od_addr3}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 받는분 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>받는분 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">이름: </span>
                  <span className="font-medium">{order.od_b_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">연락처: </span>
                  <span className="font-medium">{order.od_b_hp || order.od_b_tel || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">주소: </span>
                  <span className="font-medium">
                    {order.od_b_zip} {order.od_b_addr1} {order.od_b_addr2} {order.od_b_addr3}
                  </span>
                </div>
                {order.od_memo && (
                  <div>
                    <span className="text-gray-600">배송메모: </span>
                    <span className="font-medium">{order.od_memo}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}
        title={messageDialog.title}
        description={messageDialog.description}
      />
    </div>
  );
}