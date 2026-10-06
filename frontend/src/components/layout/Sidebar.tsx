'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Send,
  FolderKanban,
  Settings,
  Sparkles,
  LogOut,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  {
    group: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Career Vault', href: '/career-vault', icon: FolderKanban },
      { name: 'Jobs', href: '/jobs', icon: Briefcase },
      { name: 'Resumes', href: '/resumes', icon: FileText },
      { name: 'Applications', href: '/applications', icon: Send },
    ],
  },
  {
    group: 'Settings',
    items: [
      { name: 'Preferences', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, login } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-500 transition-colors">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">Risumd</span>
            <span className="block text-[10px] font-medium text-indigo-400 uppercase tracking-wider">Career Hub</span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navItems.map((group) => (
          <div key={group.group}>
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
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
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600/90 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Info / Logout Section */}
      <div className="p-4 border-t border-slate-800">
        {isAuthenticated && user ? (
          <div className="rounded-lg bg-slate-800/60 p-3 text-xs border border-slate-700/60 space-y-2.5">
            <div className="flex items-center space-x-2.5">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover border border-slate-600"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-200 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        ) : !isLoading ? (
          <button
            type="button"
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign in with Google</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
