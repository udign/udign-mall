'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/primitives/button';
import { Textarea } from '@/components/ui/primitives/textarea';
import { Card } from '@/components/ui/primitives/card';
import { Label } from '@/components/ui/primitives/label';
import { Input } from '@/components/ui/primitives/input';
import LoadingState from '@/components/states/LoadingState';
import {
  ProductForReport,
  FileUploadResponse,
  CopyrightReportResponse,
} from '@/types/copyright-report';
import { XIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { Dictionary } from '@/lib/dictionaries';

interface CopyrightReportFormProps {
  product: ProductForReport;
  onSuccess: () => void;
  onCancel: () => void;
  dictionary: Dictionary;
}

export default function CopyrightReportForm({
  product,
  onSuccess,
  onCancel,
  dictionary,
}: CopyrightReportFormProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // 최대 3개 파일 제한
    if (files.length + selectedFiles.length > 3) {
      setError(dictionary.copyrightReport.reportForm.errors.maxFiles);
      return;
    }

    // 파일 크기 검증
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(dictionary.copyrightReport.reportForm.errors.fileSize);
      return;
    }

    setError('');
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    setFiles(newFiles);
    setUploadedUrls(newUrls);
  };

  const uploadFiles = async () => {
    setUploading(true);
    const urls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/copyright-report/upload', {
          method: 'POST',
          body: formData,
        });

        const data: FileUploadResponse = await response.json();
        if (data.success && data.url) {
          urls.push(data.url);
        } else {
          throw new Error(data.error || dictionary.copyrightReport.reportForm.errors.uploadFailed);
        }
      }

      setUploadedUrls(urls);
      return urls;
    } catch (error) {
      console.error('Error uploading files:', error);
      setError(dictionary.copyrightReport.reportForm.errors.uploadError);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError(dictionary.copyrightReport.reportForm.errors.contentRequired);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 파일 업로드
      let evidenceUrls = uploadedUrls;
      if (files.length > uploadedUrls.length) {
        const urls = await uploadFiles();
        if (!urls) {
          setSubmitting(false);
          return;
        }
        evidenceUrls = urls;
      }

      // 신고 제출
      const response = await fetch('/api/copyright-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sg_id: product.it_id,
          sg_desc: JSON.stringify({
            content: content.trim(),
            evidence_urls: evidenceUrls,
          }),
        }),
      });

      const data: CopyrightReportResponse = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || dictionary.copyrightReport.reportForm.errors.submitFailed);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(dictionary.copyrightReport.reportForm.errors.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const imageUrl = getImageUrl(product.it_img1) || '/images/logo.png';

  return (
    <div className='rounded-lg bg-white p-6 shadow-xl'>
      <h2 className='mb-6 text-2xl font-bold text-gray-900'>
        {dictionary.copyrightReport.reportForm.title}
      </h2>

      {/* 선택한 제품 정보 */}
      <Card className='mb-6 p-4'>
        <div className='flex gap-4'>
          <div className='relative h-24 w-24 flex-shrink-0'>
            <Image src={imageUrl} alt={product.it_name} fill className='rounded object-cover' />
          </div>
          <div>
            <h3 className='font-semibold'>{product.it_name}</h3>
            <p className='text-sm text-gray-600'>{product.creator_name}</p>
            <p className='mt-1 text-sm text-gray-500'>{product.it_basic}</p>
          </div>
        </div>
      </Card>

      {/* 신고 내용 입력 */}
      <div className='space-y-4'>
        <div>
          <Label htmlFor='content'>{dictionary.copyrightReport.reportForm.contentLabel}</Label>
          <Textarea
            id='content'
            placeholder={dictionary.copyrightReport.reportForm.contentPlaceholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className='mt-2'
          />
        </div>

        {/* 증거 파일 업로드 */}
        <div>
          <Label htmlFor='files'>{dictionary.copyrightReport.reportForm.evidenceFiles}</Label>
          <Input
            id='files'
            type='file'
            accept='image/*,.pdf'
            multiple
            onChange={handleFileChange}
            className='mt-2'
            disabled={files.length >= 3}
          />
          <p className='mt-1 text-sm text-gray-500'>
            {dictionary.copyrightReport.reportForm.fileTypesInfo}
          </p>
        </div>

        {/* 선택된 파일 목록 */}
        {files.length > 0 && (
          <div className='space-y-2'>
            {files.map((file, index) => (
              <div key={index} className='flex items-center justify-between rounded bg-gray-50 p-2'>
                <span className='truncate text-sm'>{file.name}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeFile(index)}
                  className='text-red-500 hover:text-red-700'
                >
                  <XIcon className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && <div className='rounded bg-red-50 p-3 text-sm text-red-500'>{error}</div>}
      </div>

      {/* 버튼 영역 */}
      <div className='mt-6 flex justify-end gap-3'>
        <Button variant='outline' onClick={onCancel} disabled={submitting || uploading}>
          {dictionary.copyrightReport.reportForm.backButton}
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || uploading || !content.trim()}>
          {submitting
            ? dictionary.copyrightReport.reportForm.submitting
            : uploading
              ? dictionary.copyrightReport.reportForm.uploading
              : dictionary.copyrightReport.reportForm.submitButton}
        </Button>
      </div>

      {(submitting || uploading) && (
        <div className='mt-4'>
          <LoadingState
            message={
              uploading
                ? dictionary.copyrightReport.reportForm.uploadingFiles
                : dictionary.copyrightReport.reportForm.submittingReport
            }
            dictionary={dictionary}
          />
        </div>
      )}
    </div>
  );
}
