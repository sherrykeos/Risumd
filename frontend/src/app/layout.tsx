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
    <html lang="en" className="h-full bg-[#0B0F12] text-[#F3F4F6] antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#0B0F12] text-[#F3F4F6]`}>
        <Providers>
          <MobileNav />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 lg:pl-[230px] flex flex-col min-h-screen">
              <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
