import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';

interface TodayViewedProduct {
  it_id: string;
  it_name: string;
  it_img1: string | null;
  it_price: number;
  creator_name: string;
  viewedAt: number;
}

const STORAGE_KEY = 'udign_today_viewed_products';
const MAX_VIEWED_PRODUCTS = 10;
const STORAGE_CHANGE_EVENT = 'todayViewedProducts:change';

const isBrowser = typeof window !== 'undefined';

export const useTodayViewedProducts = () => {
  const [viewedProducts, setViewedProducts] = useState<TodayViewedProduct[]>([]);
  const [isLoadingTodayViewed, setIsLoadingTodayViewed] = useState<boolean>(true);

  // 로컬스토리지에서 오늘 본 디자인 불러오기
  const loadViewedProducts = useCallback(() => {
    try {
      if (isBrowser) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TodayViewedProduct[];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayTimestamp = today.getTime();
          // 오늘 날짜가 아닌 데이터는 제거
          const todayProducts = parsed.filter((product) => product.viewedAt >= todayTimestamp);

          todayProducts.sort((a, b) => b.viewedAt - a.viewedAt);

          setViewedProducts(todayProducts);
        } else {
          setViewedProducts([]);
        }
      }
    } catch (error) {
      console.error('Failed to load viewed products:', error);
      setViewedProducts([]);
    }
  }, []);

  // 초기 로드 및 이벤트 리스너 설정
  useEffect(() => {
    loadViewedProducts();
    setIsLoadingTodayViewed(false);

    // 로컬스토리지 변경 감지 커스텀 이벤트 리스너 등록
    const handleStorageChange = () => {
      loadViewedProducts();
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
    };
  }, [loadViewedProducts]);

  // 오늘 본 디자인 리스트 갱신
  const saveViewedProducts = useCallback((products: TodayViewedProduct[]) => {
    try {
      if (isBrowser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        // 커스텀 이벤트를 다음 이벤트 루프에서 비동기적으로 발생
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
        }, 0);
      }
    } catch (error) {
      console.error('Failed to save viewed products:', error);
    }
  }, []);

  // 디자인을 오늘 본 디자인 리스트에 추가
  const addViewedProduct = useCallback(
    (product: Product) => {
      const newViewedProduct: TodayViewedProduct = {
        it_id: product.it_id,
        it_name: product.it_name,
        it_img1: product.it_img1,
        it_price: product.it_price,
        creator_name: product.creator_name,
        viewedAt: Date.now(),
      };

      setViewedProducts((prev) => {
        // 기존에 본 디자인이면 제거하고 맨 앞에 추가
        const filtered = prev.filter((item) => item.it_id !== product.it_id);
        const updated = [newViewedProduct, ...filtered];
        // 최대 개수 제한
        const limited = updated.slice(0, MAX_VIEWED_PRODUCTS);

        saveViewedProducts(limited);
        return limited;
      });
    },
    [saveViewedProducts],
  );

  // 특정 디자인을 목록에서 제거
  const removeViewedProduct = useCallback(
    (productId: string) => {
      setViewedProducts((prev) => {
        const updated = prev.filter((item) => item.it_id !== productId);
        saveViewedProducts(updated);
        return updated;
      });
    },
    [saveViewedProducts],
  );

  // 모든 본 디자인 리스트 지우기
  const clearViewedProducts = useCallback(() => {
    setViewedProducts([]);
    if (isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
      // 커스텀 이벤트를 다음 이벤트 루프에서 비동기적으로 발생
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
      }, 0);
    }
  }, []);

  return {
    viewedProducts,
    isLoadingTodayViewed,
    addViewedProduct,
    removeViewedProduct,
    clearViewedProducts,
    count: viewedProducts.length,
  };
};
