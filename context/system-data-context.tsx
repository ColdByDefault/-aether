'use client';

import { createContext, useContext } from 'react';
import { useSystemData } from '@/hooks/use-system-data';

type SystemDataContextType = ReturnType<typeof useSystemData>;

const SystemDataContext = createContext<SystemDataContextType | null>(null);

export function SystemDataProvider({ children }: { children: React.ReactNode }) {
  const data = useSystemData();
  return <SystemDataContext.Provider value={data}>{children}</SystemDataContext.Provider>;
}

export function useSystemDataContext(): SystemDataContextType {
  const ctx = useContext(SystemDataContext);
  if (!ctx) throw new Error('useSystemDataContext must be used inside SystemDataProvider');
  return ctx;
}
