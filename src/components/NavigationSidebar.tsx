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

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationSidebar({ isOpen, onClose }: NavigationSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();

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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side='right' className='h-full w-80 p-0 [&>button]:hidden'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='flex-shrink-0 flex-row items-center justify-end p-6 pb-0'>
            <SheetTitle className='hidden text-xl font-bold'>메뉴</SheetTitle>
            <SheetDescription className='hidden'>사이트 네비게이션 메뉴</SheetDescription>
            <Button variant='ghost' size='icon' onClick={onClose} className='h-8 w-8'>
              <X className='h-4 w-4' />
            </Button>
          </SheetHeader>

          <div className='min-h-0 flex-1 overflow-y-auto p-6 pt-4'>
            <div className='mb-6'>
              <h3 className='mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase'>
                CATEGORY
              </h3>
              <Accordion type='multiple' className='w-full'>
                {NAV_MENU_ITEMS.filter((item) => item.subCategories).map((item) => (
                  <div key={item.href} className='mb-2'>
                    <AccordionItem value={item.href} className='border-0'>
                      <AccordionTrigger className='hover:text-primary-hover py-3 pl-4 text-lg font-semibold text-gray-700 hover:no-underline'>
                        {item.label}
                      </AccordionTrigger>
                      <AccordionContent className='pb-2'>
                        <div className='space-y-1'>
                          <Button
                            variant='ghost'
                            className='hover:text-primary-hover w-full justify-start pl-8 text-left text-base font-medium text-gray-600 hover:bg-gray-50'
                            onClick={() => handleNavigation(item.href)}
                          >
                            전체
                          </Button>
                          {item.subCategories!.map((subCategory) => (
                            <div key={subCategory.id}>
                              {subCategory.thirdCategories ? (
                                <Accordion type='multiple' className='w-full'>
                                  <AccordionItem value={subCategory.id} className='border-0'>
                                    <AccordionTrigger className='hover:text-primary-hover py-2 pl-8 text-base font-medium text-gray-600 hover:no-underline'>
                                      {subCategory.label}
                                    </AccordionTrigger>
                                    <AccordionContent className='pb-1'>
                                      <div className='space-y-1'>
                                        <Button
                                          variant='ghost'
                                          className='hover:text-primary-hover w-full justify-start pl-12 text-left text-sm text-gray-500 hover:bg-gray-50'
                                          onClick={() => handleNavigation(subCategory.href)}
                                        >
                                          전체
                                        </Button>
                                        {subCategory.thirdCategories.map((thirdCategory) => (
                                          <Button
                                            key={thirdCategory.id}
                                            variant='ghost'
                                            className='hover:text-primary-hover w-full justify-start pl-12 text-left text-sm text-gray-500 hover:bg-gray-50'
                                            onClick={() => handleNavigation(thirdCategory.href)}
                                          >
                                            {thirdCategory.label}
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
                                  {subCategory.label}
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
                SITE MENU
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
                        {item.label}
                      </Button>
                    ) : (
                      <Button
                        variant='ghost'
                        className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                        onClick={() => handleNavigation(item.href)}
                      >
                        {item.label}
                      </Button>
                    )}
                  </div>
                ))}
                <div className='py-2'>
                  <Button
                    variant='ghost'
                    className='hover:text-primary-hover w-full justify-start pl-4 text-left text-lg font-semibold text-gray-700 hover:bg-gray-50'
                    onClick={(e) => handleAuthRequiredClick(e, ROUTES.MY_UDIGN)}
                  >
                    My UDIGN
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
