'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProductSelector from '@/components/ProductSelector';
import CopyrightReportForm from '@/components/CopyrightReportForm';
import LoadingState from '@/components/states/LoadingState';
import { ProductForReport } from '@/types/copyright-report';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

interface CopyrightReportContentProps {
  dictionary: Dictionary;
}

export default function CopyrightReportContent({ dictionary }: CopyrightReportContentProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductForReport | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, isLoading, router]);

  const handleProductSelect = (product: ProductForReport) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedProduct(null);
    } else {
      router.back();
    }
  };

  const handleSuccess = () => {
    router.push(ROUTES.HOME);
  };

  if (isLoading) {
    return (
      <LoadingState message={dictionary.copyrightReport.loadingMessage} dictionary={dictionary} />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className='flex min-h-screen flex-col bg-cover bg-fixed bg-center bg-no-repeat'
      style={{
        backgroundImage: 'url(/images/auth-bg.png)',
        backgroundColor: '#1a2332',
      }}
    >
      <div className='relative z-10 mt-10 flex flex-1 justify-center p-4'>
        <div className='w-full max-w-6xl'>
          {step === 1 ? (
            <ProductSelector
              onSelect={handleProductSelect}
              onCancel={handleBack}
              currentUserId={user.mb_id}
              dictionary={dictionary}
            />
          ) : (
            <CopyrightReportForm
              product={selectedProduct!}
              onSuccess={handleSuccess}
              onCancel={handleBack}
              dictionary={dictionary}
            />
          )}
        </div>
      </div>
    </div>
  );
}
