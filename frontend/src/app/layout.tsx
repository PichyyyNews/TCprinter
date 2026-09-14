import React from 'react';
import { IconProvider } from '../components/ui/IconProvider';
import './globals.css';

export const metadata = {
  title: 'TCprinter - Automated Print Kiosk',
  description: 'Self-service cloud printing kiosk powered by PromptPay and Kumo UI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-kumo-canvas text-kumo-default antialiased">
        <IconProvider>
          {children}
        </IconProvider>
      </body>
    </html>
  );
}
