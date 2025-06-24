'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    mb_id: string,
    password: string,
    auto_login?: boolean,
  ) => Promise<{ success: boolean; message: string }>;
  register: (userData: {
    mb_id: string;
    mb_password: string;
    mb_name: string;
    mb_nick: string;
    mb_email: string;
    mb_hp?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAutoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 페이지 로드 시 사용자 정보 확인 및 자동 로그인 체크
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 먼저 현재 세션 확인
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            setIsLoading(false);
            return;
          }
        }

        // 세션이 없으면 자동 로그인 쿠키 확인
        const autoLoginResponse = await fetch('/api/auth/auto-login', {
          method: 'POST',
        });

        if (autoLoginResponse.ok) {
          const autoLoginData = await autoLoginResponse.json();
          if (autoLoginData.success) {
            setUser(autoLoginData.user);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = async (mb_id: string, password: string, auto_login?: boolean) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mb_id, password, auto_login }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const register = async (userData: {
    mb_id: string;
    mb_password: string;
    mb_name: string;
    mb_nick: string;
    mb_email: string;
    mb_hp?: string;
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAutoLogin = async () => {
    try {
      const response = await fetch('/api/auth/auto-login', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Auto login check error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        checkAutoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
