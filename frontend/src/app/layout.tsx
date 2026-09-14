import React from 'react';
import Link from 'next/link';
import { Printer, Gauge } from '@phosphor-icons/react/dist/ssr';
import { IconProvider } from '../components/ui/IconProvider';
import './globals.css';

export const metadata = {
  title: 'TCprinter - Automated Print Kiosk',
  description: 'Self-service cloud printing kiosk powered by PromptPay and Kumo UI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col bg-kumo-canvas text-kumo-default antialiased">
        <IconProvider>
          {/* Header navigation */}
          <header className="sticky top-0 z-40 bg-kumo-base/95 backdrop-blur-sm border-b border-kumo-line px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 text-kumo-strong font-semibold text-sm">
                <div className="p-1.5 bg-orange-50 text-kumo-brand rounded-md border border-orange-200">
                  <Printer size={18} weight="thin" />
                </div>
                <span>TCprinter</span>
                <span className="text-xs font-normal text-kumo-subtle px-1.5 py-0.5 bg-kumo-recessed rounded border border-kumo-line">
                  Kiosk #1
                </span>
              </Link>

              <nav className="flex items-center gap-4 text-xs font-medium">
                <Link
                  href="/"
                  className="text-kumo-subtle hover:text-kumo-default px-2.5 py-1.5 rounded-md hover:bg-kumo-tint"
                >
                  Print document
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-kumo-subtle hover:text-kumo-default px-2.5 py-1.5 rounded-md hover:bg-kumo-tint border border-transparent hover:border-kumo-line"
                >
                  <Gauge size={14} weight="thin" />
                  <span>Admin dashboard</span>
                </Link>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-kumo-line bg-kumo-base py-4 px-6 text-center text-xs text-kumo-subtle">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>TCprinter • Cloudflare Kumo Design System • Thai PromptPay Standard</span>
              <span className="font-mono text-[0.9em]">v1.0.0</span>
            </div>
          </footer>
        </IconProvider>
      </body>
    </html>
  );
}
