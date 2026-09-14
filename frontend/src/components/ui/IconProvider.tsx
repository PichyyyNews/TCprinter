// frontend/src/components/ui/IconProvider.tsx
'use client';

import React from 'react';
import { IconContext } from '@phosphor-icons/react';

interface IconProviderProps {
  children: React.ReactNode;
}

/**
 * Global Icon Provider enforcing Cloudflare Kumo UI standard:
 * strictly Phosphor Icons with weight="thin".
 */
export function IconProvider({ children }: IconProviderProps) {
  return (
    <IconContext.Provider
      value={{
        weight: 'thin',
        mirrored: false,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}
