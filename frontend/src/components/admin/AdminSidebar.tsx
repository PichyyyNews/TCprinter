'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gauge,
  Printer,
  Tray,
  ClockCountdown,
  CreditCard,
  BellSimpleRinging,
  Cpu,
  GearSix,
  ArrowLeft,
  Circle,
  X,
} from '@phosphor-icons/react';
import { getAgentStatus } from '../../services/adminService';
import { AgentStatusInfo } from '../../types/admin.types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview & telemetry',
    items: [
      { name: 'Overview', href: '/admin', icon: Gauge },
      { name: 'Live queue', href: '/admin/jobs', icon: ClockCountdown },
    ],
  },
  {
    label: 'Hardware & paper',
    items: [
      { name: 'Printers & paper', href: '/admin/printers', icon: Printer },
      { name: 'Paper trays & pricing', href: '/admin/trays', icon: Tray },
      { name: 'Print agent', href: '/admin/agent', icon: Cpu },
    ],
  },
  {
    label: 'Financials & webhooks',
    items: [
      { name: 'Payment gateway', href: '/admin/payments', icon: CreditCard },
      { name: 'Mobile notification', href: '/admin/notifications', icon: BellSimpleRinging },
    ],
  },
  {
    label: 'System & configuration',
    items: [
      { name: 'System settings & env', href: '/admin/settings', icon: GearSix },
    ],
  },
];

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ isMobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const [agentStatus, setAgentStatus] = useState<AgentStatusInfo | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getAgentStatus();
        setAgentStatus(data);
      } catch {
        // fail silently in sidebar
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={`
        w-64 shrink-0 bg-kumo-base border-r border-kumo-line flex flex-col justify-between h-screen sticky top-0 z-30 transition-transform duration-200
        md:translate-x-0
        ${isMobileOpen ? 'fixed inset-y-0 left-0 translate-x-0 shadow-xl z-50' : 'fixed -translate-x-full md:static'}
      `}
    >
      {/* Top Brand Header */}
      <div className="p-4 border-b border-kumo-line flex items-center justify-between shrink-0">
        <Link
          href="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 text-kumo-strong font-semibold text-sm"
        >
          <div className="p-1.5 bg-orange-50 text-kumo-brand rounded-md border border-orange-200">
            <Printer size={18} weight="thin" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight">TCprinter</span>
            <span className="text-[10px] font-mono text-kumo-subtle uppercase tracking-wider">
              Admin Console
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 text-kumo-subtle hover:text-kumo-default rounded md:hidden"
            aria-label="Close menu"
          >
            <X size={18} weight="thin" />
          </button>
        )}
      </div>

      {/* Middle Scrollable Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Quick Link back to Kiosk */}
        <div>
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2 text-xs text-kumo-subtle hover:text-kumo-default px-3 py-2 rounded-md hover:bg-kumo-tint transition-colors w-full border border-kumo-hairline"
          >
            <ArrowLeft size={14} weight="thin" />
            <span>Return to kiosk portal</span>
          </Link>
        </div>

        {/* Sidebar Nav Groups */}
        <div className="grid gap-6">
          {navGroups.map((group) => (
            <div key={group.label} className="grid gap-1">
              <div className="px-3 text-[11px] uppercase tracking-wider text-kumo-subtle font-medium">
                {group.label}
              </div>
              <nav className="grid gap-0.5 mt-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-kumo-tint text-kumo-brand font-semibold'
                          : 'text-kumo-default hover:bg-kumo-tint hover:text-kumo-strong'
                      }`}
                    >
                      <span className="h-lh flex items-center">
                        <Icon size={16} weight="thin" />
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Status Widget */}
      <div className="p-4 border-t border-kumo-line bg-kumo-canvas/60 shrink-0">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-kumo-subtle flex items-center gap-1.5">
              <Circle
                size={8}
                weight="fill"
                className={agentStatus?.isConnected ? 'text-emerald-500' : 'text-amber-500'}
              />
              <span>Print agent</span>
            </span>
            <span className="font-mono text-[0.9em] text-kumo-strong">
              {agentStatus?.isConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-kumo-subtle flex items-center gap-1.5">
              <Circle
                size={8}
                weight="fill"
                className={agentStatus?.driverMode === 'SUMATRA' ? 'text-blue-500' : 'text-purple-500'}
              />
              <span>Driver mode</span>
            </span>
            <span className="font-mono text-[0.9em] text-kumo-strong">
              {agentStatus?.driverMode === 'SUMATRA' ? 'SumatraPDF' : 'Simulation'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
