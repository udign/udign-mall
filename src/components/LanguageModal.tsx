'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageSelect: (language: string) => void;
}

export default function LanguageModal({ isOpen, onClose, onLanguageSelect }: LanguageModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ko');

  const { t, i18n } = useTranslation();

  useEffect(() => {
    setSelectedLanguage(i18n.language || 'ko');
  }, [i18n.language]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleConfirm = () => {
    onLanguageSelect(selectedLanguage);
    onClose();
  };

  const languages = [
    { code: 'ko', name: t('language.korean'), flag: '🇰🇷' },
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>{t('language.select')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {languages.map((language) => (
            <div
              key={language.code}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                selectedLanguage === language.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <div className='flex items-center space-x-3'>
                <span className='text-2xl'>{language.flag}</span>
                <span className='font-medium'>{language.name}</span>
              </div>
              {selectedLanguage === language.code && (
                <div className='flex h-5 w-5 items-center justify-center rounded-full bg-blue-500'>
                  <div className='h-2 w-2 rounded-full bg-white'></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className='flex justify-end space-x-2'>
          <Button variant='outline' onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
