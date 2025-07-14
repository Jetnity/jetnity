import React from 'react';

export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside
      className="w-64 p-4 bg-background border-r border-border h-full"
      aria-label="Seitenleiste"
    >
      {children}
    </aside>
  );
}