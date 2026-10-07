'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#10161B] rounded-[8px] border border-white/[0.08] p-8 text-center shadow-lg shadow-black/20">
        <h1 className="text-xl font-medium tracking-tight text-[#F3F4F6]">
          Risumd
        </h1>
        <p className="mt-1.5 text-xs text-[#9CA3AF]">
          Personal career and resume workspace
        </p>

        <div className="mt-8">
          <button
            type="button"
            onClick={login}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-[6px] border border-white/[0.1] bg-[#131A20] text-[#F3F4F6] text-xs font-medium hover:bg-white/[0.04] hover:border-white/[0.16] transition-colors cursor-pointer"
          >
            {/* Google G SVG */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-6 text-[11px] text-[#6B7280]">
          Secure OAuth authentication
        </p>
      </div>
    </div>
  );
}
