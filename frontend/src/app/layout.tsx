import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Risumd — Personal Career Management & Tailored Resumes',
  description: 'One career. Every application, tailored.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <Providers>
          <MobileNav />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
              <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
