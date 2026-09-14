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

export function AdminSidebar() {
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
    <aside className="w-64 shrink-0 bg-kumo-base border-r border-kumo-line flex flex-col justify-between min-h-[calc(100vh-65px)]">
      <div className="py-4">
        {/* Back to kiosk quick link */}
        <div className="px-4 mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-kumo-subtle hover:text-kumo-default px-2.5 py-1.5 rounded-md hover:bg-kumo-tint w-full"
          >
            <ArrowLeft size={14} weight="thin" />
            <span>Return to kiosk customer view</span>
          </Link>
        </div>

        {/* Sidebar Nav Groups */}
        <div className="grid gap-6 px-3">
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-kumo-tint text-kumo-brand'
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

      {/* Footer status summary widget */}
      <div className="p-4 border-t border-kumo-hairline bg-kumo-canvas/50">
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
