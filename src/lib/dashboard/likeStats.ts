import { executeQuery } from '@/lib/database';
import { getImageUrl } from '@/lib/utils';

export interface ArtworkLikeInfo {
  it_id: string;
  it_name: string;
  it_img1: string;
  current_likes: number;
  target_likes: number;
  achievement_rate: number;
  is_goal_achieved: boolean;
}

export interface LikeStats {
  artworks: ArtworkLikeInfo[];
  total_artworks: number;
  achieved_count: number;
  total_likes: number;
}

// 좋아요 통계를 가져오는 함수
export const getLikeStats = async (): Promise<LikeStats> => {
  try {
    // 현재 노출 중인 모든 작품과 좋아요 정보 조회
    const artworksQuery = `
      SELECT 
        i.it_id,
        i.it_name,
        i.it_img1,
        i.it_4 as target_likes,
        COALESCE(like_count.cnt, 0) as current_likes
      FROM g5_shop_item i
      LEFT JOIN (
        SELECT it_id, COUNT(*) as cnt 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) like_count ON i.it_id = like_count.it_id
      WHERE i.it_use = '1'
        AND i.it_name != ''
      ORDER BY i.it_id DESC
      LIMIT 20
    `;

    const artworkResults = (await executeQuery(artworksQuery)) as Array<{
      it_id: string;
      it_name: string;
      it_img1: string;
      target_likes: number;
      current_likes: number;
    }>;

    // 데이터 가공
    const artworks: ArtworkLikeInfo[] = artworkResults.map((artwork) => {
      const targetLikes = artwork.target_likes || 1; // 0 방지
      const currentLikes = artwork.current_likes || 0;
      const achievementRate = Math.min((currentLikes / targetLikes) * 100, 100);
      const isGoalAchieved = currentLikes >= targetLikes;

      return {
        it_id: artwork.it_id,
        it_name: artwork.it_name,
        it_img1: getImageUrl(artwork.it_img1) || '',
        current_likes: currentLikes,
        target_likes: targetLikes,
        achievement_rate: Math.round(achievementRate * 100) / 100, // 소수점 2자리까지
        is_goal_achieved: isGoalAchieved,
      };
    });

    // 전체 통계
    const totalArtworks = artworks.length;
    const achievedCount = artworks.filter((artwork) => artwork.is_goal_achieved).length;
    const totalLikes = artworks.reduce((sum, artwork) => sum + artwork.current_likes, 0);

    return {
      artworks,
      total_artworks: totalArtworks,
      achieved_count: achievedCount,
      total_likes: totalLikes,
    };
  } catch (error) {
    console.error('Like stats error:', error);
    return {
      artworks: [],
      total_artworks: 0,
      achieved_count: 0,
      total_likes: 0,
    };
  }
};
