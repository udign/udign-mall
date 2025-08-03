'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import CommonPagination from '@/components/CommonPagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/primitives/dialog';
import { getImageUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FileText, Search, Eye } from 'lucide-react';

interface CopyrightReport {
  id: number;
  reporter_id: string;
  reporter_name: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  creator_id: string;
  creator_name: string;
  content: string;
  evidence_urls: string[];
  reported_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CopyrightReportPage() {
  const pathname = usePathname();
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // 필터 상태
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  
  // 파일 보기 모달
  const [selectedReport, setSelectedReport] = useState<CopyrightReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/copyright-report?${params}`);
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    fetchReports(1);
  };

  const handlePageChange = (page: number) => {
    fetchReports(page);
  };

  const openModal = (report: CopyrightReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy.MM.dd HH:mm', { locale: ko });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className='p-6'>
      <h1 className='mb-6 text-2xl font-bold'>저작권 신고 조회</h1>

      {/* 필터 영역 */}
      <Card className='mb-6 p-4'>
        <div className='flex flex-wrap gap-4 items-end'>
          <div>
            <label className='block text-sm font-medium mb-1'>시작일</label>
            <Input
              type='date'
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className='w-40'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>종료일</label>
            <Input
              type='date'
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className='w-40'
            />
          </div>
          <div className='flex-1'>
            <label className='block text-sm font-medium mb-1'>검색</label>
            <div className='flex gap-2'>
              <Input
                placeholder='신고자명, 제품명, 제작자명'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className='h-4 w-4 mr-1' />
                조회
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 테이블 */}
      {loading ? (
        <LoadingState message='신고 목록을 불러오는 중...' />
      ) : reports.length === 0 ? (
        <EmptyState message='신고 내역이 없습니다.' />
      ) : (
        <>
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse bg-white'>
              <thead>
                <tr className='border-b bg-gray-50'>
                  <th className='p-3 text-left font-medium'>No</th>
                  <th className='p-3 text-left font-medium'>신고일시</th>
                  <th className='p-3 text-left font-medium'>제품명</th>
                  <th className='p-3 text-left font-medium'>신고내용</th>
                  <th className='p-3 text-center font-medium'>파일</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={report.id} className='border-b hover:bg-gray-50'>
                    <td className='p-3 text-sm'>{index + 1}</td>
                    <td className='p-3 text-sm whitespace-nowrap'>
                      {formatDate(report.reported_at)}
                    </td>
                    <td className='p-3'>
                      <div className='flex items-center gap-2'>
                        {report.product_image && (
                          <div className='relative h-10 w-10 flex-shrink-0'>
                            <Image
                              src={getImageUrl(report.product_image) || '/images/logo.png'}
                              alt={report.product_name}
                              fill
                              className='rounded object-cover'
                            />
                          </div>
                        )}
                        <span className='text-sm font-medium'>
                          {truncateText(report.product_name, 30)}
                        </span>
                      </div>
                    </td>
                    <td className='p-3 text-sm'>
                      {truncateText(report.content)}
                    </td>
                    <td className='p-3 text-center'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openModal(report)}
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className='mt-6'>
            <CommonPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              pathname={pathname}
            />
          </div>
        </>
      )}

      {/* 파일 보기 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>신고 상세 내용</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold mb-2'>신고 내용</h3>
                <p className='text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded'>
                  {selectedReport.content}
                </p>
              </div>
              
              {selectedReport.evidence_urls.length > 0 && (
                <div>
                  <h3 className='font-semibold mb-2'>증거 파일 ({selectedReport.evidence_urls.length}개)</h3>
                  <div className='space-y-2'>
                    {selectedReport.evidence_urls.map((url, index) => {
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={index} className='border rounded p-2'>
                          {isPdf ? (
                            <a
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:underline flex items-center gap-2'
                            >
                              <FileText className='h-4 w-4' />
                              증거파일 {index + 1} (PDF)
                            </a>
                          ) : (
                            <a
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:underline flex items-center gap-2'
                            >
                              <Image
                                src={url}
                                alt={`증거 ${index + 1}`}
                                width={200}
                                height={150}
                                className='max-w-full h-auto rounded cursor-pointer hover:opacity-90'
                              />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 