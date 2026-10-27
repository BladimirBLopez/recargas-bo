'use client';
import { createContext, useContext } from 'react';
import { WHATSAPP } from '@/data/games';

const Ctx = createContext({ whatsapp: WHATSAPP, notice: '' });

export function SettingsProvider({ value, children }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
