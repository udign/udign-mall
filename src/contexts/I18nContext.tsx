'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import LanguageModal from '@/components/LanguageModal';

interface I18nContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  showLanguageModal: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasShownModal, setHasShownModal] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const pathname = usePathname();
  const { i18n } = useTranslation();

  // 클라이언트에서 저장된 언어 설정 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage && savedLanguage !== i18n.language) {
        i18n.changeLanguage(savedLanguage);
      }
      setIsInitialized(true);
    }
  }, [i18n]);

  // /shop 경로에 처음 접속했을 때 모달 띄우기
  useEffect(() => {
    if (pathname?.startsWith('/shop') && !hasShownModal && isInitialized) {
      const hasVisitedShop = localStorage.getItem('hasVisitedShop');
      if (!hasVisitedShop) {
        setIsModalOpen(true);
        setHasShownModal(true);
        localStorage.setItem('hasVisitedShop', 'true');
      }
    }
  }, [pathname, hasShownModal, isInitialized]);

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('selectedLanguage', language);
  };

  const showLanguageModal = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleLanguageSelect = (language: string) => {
    changeLanguage(language);
  };

  const contextValue: I18nContextType = {
    currentLanguage: i18n.language || 'ko',
    changeLanguage,
    showLanguageModal,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
      <LanguageModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onLanguageSelect={handleLanguageSelect}
      />
    </I18nContext.Provider>
  );
}
