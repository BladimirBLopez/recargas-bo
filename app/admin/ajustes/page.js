'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const card = 'rounded-2xl border border-white/10 bg-zinc-950/80 p-5';
const input = 'mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-yellow-300/60';
const btn = 'w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-3 font-bold text-black shadow-lg shadow-orange-500/20 transition active:scale-95 disabled:opacity-50';

export default function Ajustes() {
  const [wa, setWa] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/ajustes', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setWa(d.whatsapp || '');
        setNotice(d.notice || '');
      })
      .catch(() => setMsg('No se pudo cargar'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const r = await fetch('/api/admin/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: wa, notice }),
      });
      const d = await r.json();
      if (r.ok) {
        setWa(d.whatsapp);
        setNotice(d.notice);
        setMsg('Guardado ✔');
      } else {
        setMsg(d.error === 'whatsapp_invalido' ? 'Número inválido (con código de país, solo dígitos)' : 'Error al guardar');
      }
    } catch (e) {
      setMsg('Error de red');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5 pb-24">
      <h1 className="font-display text-3xl font-extrabold uppercase italic">Ajustes</h1>
      <div className={card}>
        <label className="block text-sm font-semibold text-white/70">
          WhatsApp (con código de país, sin +)
          <input className={input} inputMode="numeric" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="59169356292" disabled={loading} />
        </label>
        <label className="mt-4 block text-sm font-semibold text-white/70">
          Aviso global en la tienda (vacío = sin aviso)
          <textarea className={input} rows={3} maxLength={160} value={notice} onChange={(e) => setNotice(e.target.value)} placeholder="Ej: Hoy atendemos hasta las 22:00" disabled={loading} />
          <span className="text-xs text-white/40">{notice.length}/160</span>
        </label>
        <button className={btn + ' mt-4'} onClick={save} disabled={saving || loading}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        {msg && <p className="mt-3 text-center text-sm text-white/70">{msg}</p>}
      </div>
      <Link href="/admin/banners" className={card + ' flex items-center justify-between font-bold'}>
        <span>Banners de la tienda</span>
        <span className="text-yellow-300">›</span>
      </Link>
      <Link href="/admin/servicios" className={card + ' flex items-center justify-between font-bold'}>
        <span>Servicios y portadas</span>
        <span className="text-yellow-300">›</span>
      </Link>
    </div>
  );
}
