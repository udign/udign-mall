'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';

interface SizeGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sizeData = [
  {
    area: 'A - 가슴 둘레',
    s: '56.5',
    m: '59.0',
  },
  {
    area: 'B - 암핏 길이',
    s: '65.0',
    m: '66.0',
  },
  {
    area: 'C - 소매 길이',
    s: '21.5',
    m: '22.0',
  },
  {
    area: 'D - 등 너비',
    s: '54.5',
    m: '56.5',
  },
  {
    area: 'E - 밑 너비',
    s: '19.0',
    m: '20.0',
  },
];

export default function SizeGuideDialog({ open, onOpenChange }: SizeGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>사이즈 가이드</DialogTitle>
          <DialogDescription className='text-center text-sm text-gray-600'>
            정확한 사이즈 선택을 위한 측정 가이드입니다
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className='overflow-hidden rounded-lg border border-gray-200'>
            <table className='w-full'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>구역</th>
                  <th className='px-4 py-3 text-center text-sm font-medium text-gray-700'>
                    S (KR 90)
                  </th>
                  <th className='px-4 py-3 text-center text-sm font-medium text-gray-700'>
                    M (KR 95-100)
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {sizeData.map((row, index) => (
                  <tr key={index} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-900'>{row.area}</td>
                    <td className='px-4 py-3 text-center text-sm text-gray-700'>{row.s}</td>
                    <td className='px-4 py-3 text-center text-sm text-gray-700'>{row.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='mt-6 rounded-lg bg-blue-50 p-4'>
            <h4 className='mb-2 text-sm font-medium text-blue-900'>📏 측정 방법</h4>
            <ul className='space-y-1 text-xs text-blue-800'>
              <li>• 평평한 곳에 옷을 펼쳐놓고 측정해주세요</li>
              <li>• 신축성이 있는 원단의 경우 자연스럽게 놓인 상태에서 측정</li>
              <li>• 모든 수치는 cm 단위입니다</li>
            </ul>
          </div>

          <div className='mt-4 rounded-lg bg-yellow-50 p-4'>
            <h4 className='mb-2 text-sm font-medium text-yellow-900'>⚠️ 주의사항</h4>
            <ul className='space-y-1 text-xs text-yellow-800'>
              <li>• 측정 방법에 따라 1-3cm 차이가 날 수 있습니다</li>
              <li>• 모니터 환경에 따라 색상이 다르게 보일 수 있습니다</li>
              <li>• 세탁 후 약간의 수축이 있을 수 있습니다</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
