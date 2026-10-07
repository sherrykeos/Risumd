'use client';

import React from 'react';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F3F4F6]">{title}</h1>
        {description && (
          <p className="mt-1 text-xs md:text-sm text-[#9CA3AF]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center space-x-2.5">{actions}</div>}
    </div>
  );
}
