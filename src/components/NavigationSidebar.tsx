'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_MENU_ITEMS } from '@/lib/navigation';
import { ROUTES } from '@/lib/routes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/primitives/accordion';
import {
  Sheet,
  SheetTitle,
  SheetContent,
  SheetHeader,
  SheetDescription,
} from '@/components/ui/primitives/sheet';
import { Button } from '@/components/ui/primitives/button';
import { X } from 'lucide-react';
import { Dictionary } from '@/lib/dictionaries';

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  dictionary: Dictionary;
}

export default function NavigationSidebar({ isOpen, onClose, dictionary }: NavigationSidebarProps) {
  const router = useRouter();

  const { user } = useAuth();

  const handleAuthRequiredClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    onClose();

    if (!user) {
      router.push(ROUTES.LOGIN);
    } else {
      router.push(href);
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  // 라벨 번역 함수
  const getTranslatedLabel = (label: string) => {
    switch (label) {
      // 메인 메뉴
      case '디자인 업로드':
        return dictionary.sidebar.navigation.designUpload;
      case '이용안내':
        return dictionary.sidebar.navigation.userGuide;

      // 메인 카테고리
      case 'fashion':
        return dictionary.sidebar.navigation.categories.fashion;
      case 'shoes':
        return dictionary.sidebar.navigation.categories.shoes;
      case 'others':
        return dictionary.sidebar.navigation.categories.others;

      // 서브 카테고리
      case 'men':
        return dictionary.sidebar.navigation.categories.men;
      case 'women':
        return dictionary.sidebar.navigation.categories.women;

      // 패션 아이템
      case 'top':
        return dictionary.sidebar.navigation.fashionItems.top;
      case 'bottom':
        return dictionary.sidebar.navigation.fashionItems.bottom;
      case 'outer':
        return dictionary.sidebar.navigation.fashionItems.outer;
      case 'product':
        return dictionary.sidebar.navigation.fashionItems.product;
      case 'space':
        return dictionary.sidebar.navigation.fashionItems.space;

      // 신발 아이템
      case '운동화':
        return dictionary.sidebar.navigation.shoeItems.sneakers;
      case '구두/스니커즈':
        return dictionary.sidebar.navigation.shoeItems.dressShoes;
      case '워커':
        return dictionary.sidebar.navigation.shoeItems.walker;
      case '샌들/슬리퍼':
        return dictionary.sidebar.navigation.shoeItems.sandals;
      case '레인부츠':
        return dictionary.sidebar.navigation.shoeItems.rainBoots;
      case '부츠':
        return dictionary.sidebar.navigation.shoeItems.boots;

      // 기타 아이템
      case '상의':
        return dictionary.sidebar.navigation.otherItems.top;
      case '하의':
        return dictionary.sidebar.navigation.otherItems.bottom;
      case 'graphic':
        return dictionary.sidebar.navigation.otherItems.graphic;

      default:
        return label;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side='right' className='h-full w-80 p-0 [&>button]:hidden'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='flex-shrink-0 flex-row items-center justify-end p-6 pb-0'>
            <SheetTitle className='hidden text-xl font-bold'>
              {dictionary.sidebar.navigation.menu}
            </SheetTitle>
            <SheetDescription className='hidden'>
              {dictionary.sidebar.navigation.description}
            </SheetDescription>
            <Button variant='ghost' size='icon' onClick={onClose} className='h-8 w-8'>
              <X className='h-4 w-4' />
            </Button>
          </SheetHeader>

          <div className='min-h-0 flex-1 overflow-y-auto p-6 pt-4'>
            <div className='mb-6'>
              <h3 className='mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase'>
                {dictionary.sidebar.navigation.category}
              </h3>
              <Accordion type='multiple' className='w-full'>
                {NAV_MENU_ITEMS.filter((item) => item.subCategories).map((item) => (
                  <div key={item.href} className='mb-2'>
                    <AccordionItem value={item.href} className='border-0'>
                      <AccordionTrigger className='hover:text-primary-hover py-3 pl-4 text-lg font-semibold text-gray-700 hover:no-underline'>
                        {getTranslatedLabel(item.label)}
                      </AccordionTrigger>
                      <AccordionContent className='pb-2'>
                        <div className='space-y-1'>
                          <Button
                            variant='ghost'
                            className='hover:text-primary-hover w-full justify-start pl-8 text-left text-base font-medium text-gray-600 hover:bg-gray-50'
                            onClick={() => handleNavigation(item.href)}
                          >
                            {dictionary.sidebar.navigation.all}
                          </Button>
                          {item.subCategories!.map((subCategory) => (
                            <div key={subCategory.id}>
                              {subCategory.thirdCategories ? (
                                <Accordion type='multiple' className='w-full'>
                                  <AccordionItem value={subCategory.id} className='border-0'>
                                    <AccordionTrigger className='hover:text-primary-hover py-2 pl-8 text-base font-medium text-gray-600 hover:no-underline'>
                                      {getTranslatedLabel(subCategory.label)}
                                    </AccordionTrigger>
                                    <AccordionContent className='pb-1'>
                                      <div className='space-y-1'>
                                        <Button
                                          variant='ghost'
                                          className='hover:text-primary-hover w-full justify-start pl-12 text-left text-sm text-gray-500 hover:bg-gray-50'
                                          onClick={() => handleNavigation(subCategory.href)}
                                        >
                                          {dictionary.sidebar.navigation.all}
                                        </Button>
                                        {subCategory.thirdCategories.map((thirdCategory) => (
                                          <Button
                                            key={thirdCategory.id}
                                            variant='ghost'
                                            className='hover:text-primary-hover w-full justify-start pl-12 text-left text-sm text-gray-500 hover:bg-gray-50'
                                            onClick={() => handleNavigation(thirdCategory.href)}
                                          >
                                            {getTranslatedLabel(thirdCategory.label)}
                                          </Button>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ) : (
                                <Button
                                  variant='ghost'
                                  className='hover:text-primary-hover w-full justify-start pl-8 text-left text-base font-medium text-gray-600 hover:bg-gray-50'
                                  onClick={() => handleNavigation(subCategory.href)}
                                >
                                  {getTranslatedLabel(subCategory.label)}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                ))}
              </Accordion>
            </div>

            <div className='mb-6'>
              <h3 className='mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase'>
                {dictionary.sidebar.navigation.siteMenu}
              </h3>
              <div className='space-y-1'>
                {NAV_MENU_ITEMS.filter((item) => !item.subCategories).map((item) => (
                  <div key={item.href} className='py-2'>
                    {item.requiresAuth ? (
                      <Button
                        variant='ghost'
                        className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                        onClick={(e) => handleAuthRequiredClick(e, item.href)}
                      >
                        {getTranslatedLabel(item.label)}
                      </Button>
                    ) : (
                      <Button
                        variant='ghost'
                        className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                        onClick={() => handleNavigation(item.href)}
                      >
                        {getTranslatedLabel(item.label)}
                      </Button>
                    )}
                  </div>
                ))}
                <div className='py-2'>
                  <Button
                    variant='ghost'
                    className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                    onClick={() => handleNavigation(ROUTES.VENDOR)}
                  >
                    {dictionary.sidebar.navigation.vendorPage}
                  </Button>
                </div>
                <div className='py-2'>
                  <Button
                    variant='ghost'
                    className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                    onClick={() => handleNavigation(ROUTES.COPYRIGHT_REPORT)}
                  >
                    {dictionary.sidebar.navigation.copyrightReport}
                  </Button>
                </div>
              </div>
            </div>

            <div className='mb-6'>
              <h3 className='mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase'>
                {dictionary.sidebar.navigation.aboutUs}
              </h3>
              <div className='space-y-1'>
                <div className='py-2'>
                  <Button
                    variant='ghost'
                    className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                    onClick={() => handleNavigation(ROUTES.COMPANY)}
                  >
                    {dictionary.sidebar.navigation.siteIntro}
                  </Button>
                </div>
                <div className='py-2'>
                  <Button
                    variant='ghost'
                    className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                    onClick={() => handleNavigation(ROUTES.PROVISION)}
                  >
                    {dictionary.sidebar.navigation.serviceTerms}
                  </Button>
                </div>
                <div className='py-2'>
                  <Button
                    variant='ghost'
                    className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                    onClick={() => handleNavigation(ROUTES.PRIVACY)}
                  >
                    {dictionary.sidebar.navigation.privacyPolicy}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
