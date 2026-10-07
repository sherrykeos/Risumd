'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
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

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Career Vault', href: '/career-vault', icon: FolderKanban },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Applications', href: '/applications', icon: Send },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, login } = useAuth();

  return (
    <div className="lg:hidden border-b border-white/[0.08] bg-[#090D10] text-[#F3F4F6] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link href="/" className="flex items-center space-x-2">
        <span className="font-semibold text-[15px] tracking-tight text-white">Risumd</span>
      </Link>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-[6px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] transition-colors cursor-pointer"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#090D10] border-b border-white/[0.08] p-3 shadow-2xl flex flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center space-x-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.06]'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-[#F3F4F6]' : 'text-[#9CA3AF]')} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 mt-1 border-t border-white/[0.06]">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-[#131A20] rounded-[6px] border border-white/[0.06]">
                <div className="flex items-center space-x-2.5 min-w-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-6 w-6 rounded-[5px] object-cover border border-white/10"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-[5px] bg-[#16202A] text-[#F3F4F6] border border-white/10 flex items-center justify-center text-[10px] font-semibold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#F3F4F6] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#6B7280] truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="p-1 rounded text-[#6B7280] hover:text-[#9CA3AF] cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : !isLoading ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  login();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign in with Google</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
