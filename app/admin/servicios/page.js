'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CatalogTabs from '@/components/admin/CatalogTabs';

const card = 'rounded-2xl border border-white/10 bg-zinc-950/80 p-5';
const btn = 'w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-3 font-bold text-black shadow-lg shadow-orange-500/20 transition active:scale-95 disabled:opacity-50';
const mini = 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 transition active:scale-95 disabled:opacity-40';
const input = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-yellow-300/60 disabled:opacity-50';
const ERR = {
  nombre_invalido: 'Escribe un nombre',
  existe: 'Ya existe un servicio con ese nombre',
  paquetes_invalidos: 'Revisa los paquetes: cada uno necesita nombre y precio mayor a 0',
};
const NEW = { slug: '', name: '', kind: 'directa', idLabel: 'ID de jugador', badge: '', packages: [{ label: '', price: '' }] };

export default function AdminServicios() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(null);
  const fileRef = useRef(null);
  const target = useRef('');

  const load = async () => {
    try {
      const r = await fetch('/api/admin/servicios', { cache: 'no-store' });
      const d = await r.json();
      setList(d.games || []);
    } catch (e) {
      setMsg('No se pudo cargar');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const call = async (method, body) => {
    const r = await fetch('/api/admin/servicios', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    return { ok: r.ok, error: d.error };
  };

  const upload = async (file) => {
    const s = await fetch('/api/admin/subir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'games' }),
    });
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
    return { url: ud.secure_url, public_id: ud.public_id };
  };

  const pickPhoto = (slug) => {
    target.current = slug;
    if (fileRef.current) fileRef.current.click();
  };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMsg('Elige una imagen');
    if (file.size > 5 * 1024 * 1024) return setMsg('Máximo 5 MB');
    setBusy(true);
    setMsg('Subiendo…');
    try {
      const img = await upload(file);
      const r = await call('PATCH', { slug: target.current, image: img });
      if (!r.ok) throw new Error('No se pudo guardar la foto');
      setMsg('Foto guardada ✔');
      await load();
    } catch (err) {
      setMsg(err.message || 'Error');
    }
    setBusy(false);
  };

  const act = async (method, body, okMsg) => {
    setBusy(true);
    setMsg('');
    const r = await call(method, body);
    setMsg(r.ok ? okMsg : 'Error al guardar');
    await load();
    setBusy(false);
  };

  const save = async () => {
    const f = form;
    const packages = f.packages
      .filter((p) => p.label.trim() || String(p.price).trim())
      .map((p) => ({ id: p.id, label: p.label, price: Number(p.price) }));
    setBusy(true);
    setMsg('');
    const r = f.slug
      ? await call('PATCH', { slug: f.slug, edit: { kind: f.kind, idLabel: f.idLabel, badge: f.badge, packages } })
      : await call('POST', { name: f.name, kind: f.kind, idLabel: f.idLabel, badge: f.badge, packages });
    if (r.ok) {
      setMsg('Guardado ✔');
      setForm(null);
    } else {
      setMsg(ERR[r.error] || 'Error al guardar');
    }
    await load();
    setBusy(false);
  };

  const setPk = (i, key, val) =>
    setForm({ ...form, packages: form.packages.map((p, j) => (j === i ? { ...p, [key]: val } : p)) });

  const edit = (g) =>
    setForm({
      slug: g.slug,
      name: g.name,
      kind: g.kind || 'directa',
      idLabel: g.idLabel || '',
      badge: g.badge || '',
      packages: g.packages.length
        ? g.packages.map((p) => ({ id: p.id, label: p.label, price: String(p.price) }))
        : [{ label: '', price: '' }],
    });

  return (
    <div className="space-y-5 pb-24">
      <CatalogTabs />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Servicios</h1>
        <Link href="/admin/ajustes" className="text-sm font-bold text-white/60">‹ Ajustes</Link>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {!form && (
        <div className={card}>
          <p className="text-sm text-white/60">
            Foto vertical 4:5 (ideal 800×1000), máx. 5 MB, sin texto: el nombre lo pone la tienda. Mantenimiento y precios de los juegos actuales: en Juegos.
          </p>
          <button className={btn + ' mt-4'} disabled={busy} onClick={() => setForm({ ...NEW })}>
            Nuevo servicio
          </button>
        </div>
      )}

      {form && (
        <div className={card + ' space-y-3'}>
          <h2 className="text-base font-semibold">{form.slug ? 'Editar servicio' : 'Nuevo servicio'}</h2>
          <input className={input} placeholder="Nombre (ej. Honor of Kings)" value={form.name} disabled={Boolean(form.slug)} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="directa">Recarga directa</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
          <input className={input} placeholder="Texto del campo (ej. ID de jugador)" value={form.idLabel} onChange={(e) => setForm({ ...form, idLabel: e.target.value })} />
          <select className={input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}>
            <option value="">Sin etiqueta</option>
            <option value="promo">PROMO</option>
            <option value="nuevo">NUEVO</option>
          </select>
          <p className="pt-1 text-sm font-bold text-white/70">Paquetes</p>
          {form.packages.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className={input} placeholder="Ej. 100 💎" value={p.label} onChange={(e) => setPk(i, 'label', e.target.value)} />
              <input className={input + ' !w-28'} placeholder="Bs" inputMode="decimal" value={p.price} onChange={(e) => setPk(i, 'price', e.target.value)} />
              <button className={mini + ' text-red-300'} onClick={() => setForm({ ...form, packages: form.packages.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button className={mini} onClick={() => setForm({ ...form, packages: [...form.packages, { label: '', price: '' }] })}>+ Paquete</button>
          <div className="flex gap-2 pt-2">
            <button className={mini + ' flex-1 !py-3'} disabled={busy} onClick={() => setForm(null)}>Cancelar</button>
            <button className={btn + ' flex-[2]'} disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      )}

      {msg && <p className="text-center text-sm text-white/70">{msg}</p>}

      {loading ? (
        <p className="text-center text-sm text-white/50">Cargando…</p>
      ) : (
        list.map((g) => (
          <div key={g.slug} className={card + ' space-y-3'}>
            <div className="flex items-center gap-3">
              {g.image ? (
                <img src={g.image} alt="" className="h-20 w-16 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-16 items-center justify-center rounded-xl bg-white/5 text-3xl">{g.emoji}</div>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold">{g.name}</p>
                <p className="text-xs text-white/50">
                  {g.custom ? 'Creado en el panel' : 'Catálogo base'} · {g.packages.length} paquetes
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={mini} disabled={busy} onClick={() => pickPhoto(g.slug)}>{g.image ? 'Cambiar foto' : 'Subir foto'}</button>
              {g.image && (
                <button className={mini} disabled={busy} onClick={() => confirm('¿Quitar la foto?') && act('DELETE', { slug: g.slug, imageOnly: true }, 'Foto quitada ✔')}>Quitar foto</button>
              )}
              {g.custom && (
                <>
                  <button className={mini} disabled={busy} onClick={() => edit(g)}>Editar</button>
                  <button className={mini + ' text-red-300'} disabled={busy} onClick={() => confirm('¿Borrar este servicio?') && act('DELETE', { slug: g.slug }, 'Servicio borrado ✔')}>Borrar</button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
