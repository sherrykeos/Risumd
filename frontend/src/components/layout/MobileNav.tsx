'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Briefcase,
  FileText,
  Send,
  FolderKanban,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Career Vault', href: '/career-vault', icon: FolderKanban },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Applications', href: '/applications', icon: Send },
  { name: 'Preferences', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden border-b border-slate-200 bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link href="/" className="flex items-center space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-bold text-lg">Risumd</span>
      </Link>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 shadow-xl flex flex-col space-y-2">
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
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
