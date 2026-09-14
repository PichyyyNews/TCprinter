import React from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col md:flex-row border border-kumo-line rounded-lg overflow-hidden bg-kumo-base shadow-sm">
      <AdminSidebar />
      <div className="flex-1 min-w-0 bg-kumo-canvas p-4 sm:p-6 md:p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
