'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const ok = await isAuthenticated();
      if (cancelled) return;

      if (ok) {
        setIsAuth(true);
        setIsLoading(false);
        return;
      }

      // Clear any cached sensitive data and redirect
      await logout();
      if (cancelled) return;
      setIsAuth(false);
      setIsLoading(false);
      router.replace('/login');
    };

    // Initial check
    checkAuth();

    // Re-check periodically so the session expires even if the app stays open
    const intervalId = window.setInterval(checkAuth, 30_000);

    // Re-check when returning to the tab/app
    const onFocus = () => checkAuth();
    const onVisibility = () => {
      if (!document.hidden) checkAuth();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuth) {
    return null;
  }

  return <>{children}</>;
}
