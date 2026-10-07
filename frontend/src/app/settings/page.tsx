'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Cpu, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#F3F4F6] tracking-tight">Settings</h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">Workspace configuration and system engine integrations.</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm font-medium text-[#F3F4F6]">
              <Server className="mr-2 h-4 w-4 text-[#4D9FFF]" /> API & Backend Configuration
            </CardTitle>
            <CardDescription className="text-xs text-[#9CA3AF]">
              Target server connection properties and AI backend status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06]">
              <div>
                <span className="font-medium text-[#F3F4F6]">Backend Base URL</span>
                <p className="text-[11px] text-[#6B7280]">Configured via NEXT_PUBLIC_API_URL</p>
              </div>
              <Badge variant="outline" className="font-mono text-[11px] text-[#9CA3AF] bg-white/[0.02]">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06]">
              <div>
                <span className="font-medium text-[#F3F4F6]">AI JD Analysis Engine</span>
                <p className="text-[11px] text-[#6B7280]">Backend Gemini Flash service pipeline</p>
              </div>
              <Badge variant="default" className="text-[11px] flex items-center">
                <Cpu className="mr-1.5 h-3 w-3 text-[#4D9FFF]" /> Gemini Flash
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div>
                <span className="font-medium text-[#F3F4F6]">PDF Compilation Engine</span>
                <p className="text-[11px] text-[#6B7280]">Local Tectonic LaTeX compiler</p>
              </div>
              <Badge variant="outline" className="text-[11px] flex items-center font-mono text-[#9CA3AF]">
                <Database className="mr-1.5 h-3 w-3 text-[#9CA3AF]" /> Tectonic CLI
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
