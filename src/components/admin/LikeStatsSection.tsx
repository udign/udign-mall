'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { LikeStats } from '@/lib/dashboard/likeStats';
import { Button } from '@/components/ui/primitives/button';
import { Progress } from '@/components/ui/primitives/progress';
import Image from 'next/image';

interface LikeStatsSectionProps {
  initialStats: LikeStats;
}

export default function LikeStatsSection({ initialStats }: LikeStatsSectionProps) {
  const [stats, setStats] = useState<LikeStats>(initialStats);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/admin/like-stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        console.error('좋아요 통계 조회 실패:', result.message);
      }
    } catch (error) {
      console.error('좋아요 통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>좋아요 현황</h2>
        <Button
          onClick={fetchStats}
          disabled={isLoading}
          variant='ghost'
          size='sm'
          className='text-sm text-gray-500 hover:text-gray-700'
        >
          <RefreshCw className={`h-4 w-4 ${isLoading && 'animate-spin'}`} />
          {lastUpdated ? `최근 ${lastUpdated}` : '새로고침'}
        </Button>
      </div>

      <div className='mb-4 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-3'>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>총 작품</div>
          <div className='text-xl font-bold text-blue-600'>
            {stats.total_artworks.toLocaleString()}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>목표 달성</div>
          <div className='text-xl font-bold text-green-600'>
            {stats.achieved_count.toLocaleString()}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>총 좋아요</div>
          <div className='text-xl font-bold text-purple-600'>
            {stats.total_likes.toLocaleString()}
          </div>
        </div>
      </div>

      <div className='max-h-80 space-y-3 overflow-y-auto'>
        {stats.artworks.length === 0 ? (
          <div className='flex h-24 items-center justify-center text-gray-400'>
            <div className='text-center'>
              <div className='text-sm'>작품이 없습니다</div>
            </div>
          </div>
        ) : (
          stats.artworks.map((artwork) => (
            <div key={artwork.it_id} className='flex items-center space-x-3 rounded-lg border p-3'>
              <div className='flex-shrink-0'>
                {artwork.it_img1 ? (
                  <Image
                    src={artwork.it_img1}
                    alt={artwork.it_name}
                    width={48}
                    height={48}
                    className='h-12 w-12 rounded-lg object-cover'
                  />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200'>
                    <span className='text-xs text-gray-400'>이미지 없음</span>
                  </div>
                )}
              </div>

              <div className='min-w-0 flex-1'>
                <div className='truncate text-sm font-medium text-gray-900'>{artwork.it_name}</div>
                <div className='text-xs text-gray-500'>ID: {artwork.it_id}</div>

                <div className='mt-2'>
                  <div className='mb-1 flex items-center justify-between text-xs text-gray-600'>
                    <span>
                      {artwork.current_likes} / {artwork.target_likes}
                    </span>
                    <span>{artwork.achievement_rate}%</span>
                  </div>
                  <Progress value={artwork.achievement_rate} className='h-2 bg-gray-100' />
                </div>
              </div>

              <div className='flex-shrink-0'>
                {artwork.is_goal_achieved ? (
                  <div className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>
                    달성
                  </div>
                ) : (
                  <div className='rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800'>
                    진행중
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
