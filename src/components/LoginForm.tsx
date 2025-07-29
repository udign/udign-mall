'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/primitives/switch';
import { Button } from '@/components/ui/primitives/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

interface LoginFormProps {
  dictionary: Dictionary;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

interface LoginFormData {
  mb_id: string;
  password: string;
}

export default function LoginForm({ dictionary, onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    mb_id: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [autoLogin, setAutoLogin] = useState<boolean>(false);
  const [showAutoLoginDialog, setShowAutoLoginDialog] = useState<boolean>(false);

  const { login } = useAuth();

  const isAllFieldsFilled = useMemo(() => {
    return formData.mb_id.trim() !== '' && formData.password.trim() !== '';
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAutoLoginToggle = (checked: boolean) => {
    if (checked) {
      setShowAutoLoginDialog(true);
    } else {
      setAutoLogin(false);
    }
  };

  const handleAutoLoginConfirm = () => {
    setAutoLogin(true);
    setShowAutoLoginDialog(false);
  };

  const handleAutoLoginCancel = () => {
    setAutoLogin(false);
    setShowAutoLoginDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.mb_id, formData.password, autoLogin);

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch {
      setError(dictionary.auth.login.errors.general);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6'>
          <h2 className='mb-2 text-2xl font-semibold text-white'>{dictionary.auth.login.title}</h2>
          <p className='text-base text-gray-300'>{dictionary.auth.login.subtitle}</p>
        </div>

        {error && (
          <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_id'>
              {dictionary.auth.login.fields.id}{' '}
              <span className='text-red-400'>{dictionary.auth.login.fields.required}</span>
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_id'
              name='mb_id'
              type='text'
              placeholder={dictionary.auth.login.fields.idPlaceholder}
              value={formData.mb_id}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='password'>
              {dictionary.auth.login.fields.password}{' '}
              <span className='text-red-400'>{dictionary.auth.login.fields.required}</span>
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='password'
              name='password'
              type='password'
              placeholder={dictionary.auth.login.fields.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <Button
            className='mt-2 w-full'
            type='submit'
            disabled={isLoading}
            variant={isAllFieldsFilled ? 'default' : 'secondary'}
          >
            {isLoading
              ? dictionary.auth.login.buttons.loggingIn
              : dictionary.auth.login.buttons.login}
          </Button>

          <div className='flex items-center justify-between text-sm'>
            <div className='flex cursor-pointer items-center text-gray-300'>
              <Switch
                checked={autoLogin}
                onCheckedChange={handleAutoLoginToggle}
                className='mr-2'
              />
              <span>{dictionary.auth.login.autoLogin.label}</span>
            </div>
            <div className='text-gray-300'>
              <Link href={ROUTES.FORGOT_PASSWORD} className='cursor-pointer hover:text-white'>
                {dictionary.auth.login.links.forgotPassword}
              </Link>
              <span className='mx-2'>|</span>
              {onSwitchToRegister && (
                <Button
                  type='button'
                  onClick={onSwitchToRegister}
                  variant='link'
                  className='h-auto p-0 text-gray-300 hover:text-white'
                >
                  {dictionary.auth.login.buttons.register}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={showAutoLoginDialog}
        onOpenChange={setShowAutoLoginDialog}
        title={dictionary.auth.login.autoLogin.confirmTitle}
        description={dictionary.auth.login.autoLogin.confirmMessage}
        confirmText={dictionary.common.confirm}
        cancelText={dictionary.common.cancel}
        onConfirm={handleAutoLoginConfirm}
        onCancel={handleAutoLoginCancel}
      />
    </div>
  );
}
