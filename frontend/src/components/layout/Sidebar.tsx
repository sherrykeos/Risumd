'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  FileText,
  Send,
  Settings,
  LogOut,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const mainNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Career Vault', href: '/career-vault', icon: FolderKanban },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Applications', href: '/applications', icon: Send },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, login } = useAuth();

  return (
    <aside className="hidden lg:flex w-[230px] flex-col fixed inset-y-0 z-30 bg-[#090D10] text-[#F3F4F6] border-r border-white/[0.08]">
      {/* Brand Header */}
      <div className="flex h-14 items-center px-5">
        <Link href="/" className="flex items-center space-x-2 text-white font-semibold text-[15px] tracking-tight hover:opacity-90 transition-opacity">
          <span>Risumd</span>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors',
                isActive
                  ? 'bg-[#131A20] text-[#F3F4F6] font-medium border border-white/[0.06]'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#F3F4F6]' : 'text-[#9CA3AF]')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings & User Profile Section */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center space-x-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.06]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>

        <div className="pt-2">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2 rounded-[6px] hover:bg-white/[0.03] transition-colors group">
              <div className="flex items-center space-x-2.5 min-w-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-7 w-7 rounded-[6px] object-cover border border-white/10"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-[6px] bg-[#16202A] text-[#F3F4F6] border border-white/10 flex items-center justify-center font-semibold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-[#F3F4F6] truncate leading-tight">
                    {user.name || 'Sherry'}
                  </p>
                  <p className="text-[11px] text-[#6B7280] truncate leading-tight mt-0.5">
                    Personal Workspace
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1 rounded text-[#6B7280] hover:text-[#9CA3AF] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-[6px] hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="h-7 w-7 rounded-[6px] bg-[#16202A] text-[#F3F4F6] border border-white/10 flex items-center justify-center font-semibold text-xs">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-[#F3F4F6] truncate leading-tight">
                    Sherry
                  </p>
                  <p className="text-[11px] text-[#6B7280] truncate leading-tight mt-0.5">
                    Personal Workspace
                  </p>
                </div>
              </div>
              {!isLoading && (
                <button
                  type="button"
                  onClick={() => login()}
                  className="p-1 rounded text-[#4D9FFF] hover:text-[#3B8EEA] transition-colors cursor-pointer"
                  title="Sign in with Google"
                >
                  <LogIn className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
