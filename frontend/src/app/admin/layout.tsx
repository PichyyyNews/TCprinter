'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, ArrowSquareOut } from '@phosphor-icons/react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

const routeTitles: Record<string, string> = {
  '/admin': 'Overview & telemetry',
  '/admin/jobs': 'Live print queue',
  '/admin/printers': 'Printers & paper management',
  '/admin/trays': 'Paper trays & pricing rules',
  '/admin/agent': 'Print agent monitor & drivers',
  '/admin/payments': 'Payment gateway & transactions',
  '/admin/notifications': 'Mobile bank notifications',
  '/admin/settings': 'System settings & environment',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const currentTitle = routeTitles[pathname] || 'Admin Console';

  return (
    <div className="min-h-screen bg-kumo-canvas text-kumo-default">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Fixed Left Sidebar Navigation */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Viewport — pushed right by sidebar width on md+ */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Admin Top Bar */}
        <header className="sticky top-0 z-20 h-14 bg-kumo-base/95 backdrop-blur-sm border-b border-kumo-line px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint rounded-md md:hidden border border-kumo-line"
              aria-label="Open sidebar menu"
            >
              <List size={18} weight="thin" />
            </button>

            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="text-kumo-subtle hidden sm:inline">Admin</span>
              <span className="text-kumo-hairline hidden sm:inline">/</span>
              <span className="text-kumo-strong font-medium truncate">{currentTitle}</span>
            </div>
          </div>

          {/* Top Bar Quick Action */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-kumo-line text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint transition-colors"
            >
              <span>Customer kiosk portal</span>
              <ArrowSquareOut size={14} weight="thin" />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
