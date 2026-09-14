'use client';

import React from 'react';
import { IconContext } from '@phosphor-icons/react';

export function IconProvider({ children }: { children: React.ReactNode }) {
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

export default IconProvider;
