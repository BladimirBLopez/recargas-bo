'use client';
import { createContext, useContext } from 'react';
import { WHATSAPP } from '@/data/games';

const Ctx = createContext({ whatsapp: WHATSAPP, notice: '', payment_qr: '/qr-pago.png' });

export function SettingsProvider({ value, children }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
