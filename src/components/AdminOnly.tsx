import React from 'react';

export default function AdminOnly({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return <>{children}</>;
}
