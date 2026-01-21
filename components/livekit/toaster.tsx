'use client';

import { Toaster as Sonner, ToasterProps } from 'sonner';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      icons={{
        warning: <WarningIcon weight="bold" />,
      }}
      toastOptions={{
        style: {
          background: '#1f1f1f',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#ffffff',
        },
      }}
      {...props}
    />
  );
}

