'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CatalogTabs from '@/components/admin/CatalogTabs';

const card = 'rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-[#122B49] to-[#09192E] p-5 shadow-lg shadow-black/15';
const btn = 'w-full rounded-2xl bg-gradient-to-r from-[#00D9FF] to-[#007BFF] py-3 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition active:scale-95 disabled:opacity-50';
const mini = 'rounded-xl border border-cyan-400/20 bg-[#163554]/70 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-400/50 hover:bg-[#1B4265] active:scale-95 disabled:opacity-40';

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const r = await fetch('/api/admin/banners', { cache: 'no-store' });
      const d = await r.json();
      setList(d.banners || []);
    } catch (e) {
      setMsg('No se pudo cargar');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const call = async (method, body) => {
    const r = await fetch('/api/admin/banners', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.ok;
  };

  const act = async (method, body) => {
    setBusy(true);
    setMsg('');
    const ok = await call(method, body);
    if (!ok) setMsg('Error al guardar');
    await load();
    setBusy(false);
  };

  const upload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMsg('Elige una imagen');
    if (file.size > 5 * 1024 * 1024) return setMsg('Máximo 5 MB');
    setBusy(true);
    setMsg('Subiendo…');
    try {
      const s = await fetch('/api/admin/subir', { method: 'POST' });
      const sd = await s.json();
      if (!s.ok) throw new Error(sd.error === 'cloudinary_no_configurado' ? 'Faltan las variables de Cloudinary en Vercel' : 'No autorizado');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sd.apiKey);
      fd.append('timestamp', sd.timestamp);
      fd.append('asset_folder', sd.folder);
      fd.append('public_id_prefix', sd.folder);
      fd.append('signature', sd.signature);
      const u = await fetch('https://api.cloudinary.com/v1_1/' + sd.cloudName + '/image/upload', { method: 'POST', body: fd });
      const ud = await u.json();
      if (!u.ok) throw new Error((ud && ud.error && ud.error.message) || 'Cloudinary rechazó la imagen');
      const ok = await call('POST', { url: ud.secure_url, public_id: ud.public_id });
      if (!ok) throw new Error('No se pudo guardar el banner');
      setMsg('Banner agregado ✔');
      await load();
    } catch (err) {
      setMsg(err.message || 'Error');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-5 pb-24">
      <CatalogTabs />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Banners</h1>
      </div>
      <div className={card}>
        <p className="text-sm text-white/60">
          Imagen horizontal, ideal 1600×600 (proporción 8:3), máx. 5 MB. Se muestran en el orden de la lista.
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
        <button className={btn + ' mt-4'} onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
          {busy ? 'Un momento…' : 'Agregar banner'}
        </button>
        {msg && <p className="mt-3 text-center text-sm text-white/70">{msg}</p>}
      </div>
      {loading ? (
        <p className="text-center text-sm text-white/50">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="text-center text-sm text-white/50">Sin banners: la tienda usa los de ejemplo.</p>
      ) : (
        list.map((b, i) => (
          <div key={b.id} className={card + ' space-y-3'}>
            <img src={b.thumb} alt="" className={'aspect-[8/3] w-full rounded-2xl object-cover ' + (b.active ? '' : 'opacity-40')} />
            <div className="flex flex-wrap gap-2">
              <button className={mini} disabled={busy || i === 0} onClick={() => act('PATCH', { id: b.id, dir: 'up' })}>↑ Subir</button>
              <button className={mini} disabled={busy || i === list.length - 1} onClick={() => act('PATCH', { id: b.id, dir: 'down' })}>↓ Bajar</button>
              <button className={mini} disabled={busy} onClick={() => act('PATCH', { id: b.id, active: !b.active })}>{b.active ? 'Ocultar' : 'Mostrar'}</button>
              <button className={mini + ' text-red-300'} disabled={busy} onClick={() => confirm('¿Borrar este banner?') && act('DELETE', { id: b.id })}>Borrar</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
