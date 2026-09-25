'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Cpu, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <Header
        title="Preferences & Settings"
        description="Configuration and system connection properties for Risumd."
      />

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Server className="mr-2 h-4 w-4 text-indigo-600" /> API & Backend Configuration
            </CardTitle>
            <CardDescription>Target server connection details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="font-semibold text-slate-800">Backend Base URL</span>
                <p className="text-xs text-slate-500">Configured via NEXT_PUBLIC_API_URL</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="font-semibold text-slate-800">AI JD Analysis Engine</span>
                <p className="text-xs text-slate-500">Backend Gemini 2.5 Flash service</p>
              </div>
              <Badge variant="default" className="text-xs">
                <Cpu className="mr-1 h-3 w-3" /> Gemini 2.5 Flash
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-slate-800">PDF Compilation Engine</span>
                <p className="text-xs text-slate-500">Local Tectonic LaTeX compiler</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Database className="mr-1 h-3 w-3" /> Tectonic CLI
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
