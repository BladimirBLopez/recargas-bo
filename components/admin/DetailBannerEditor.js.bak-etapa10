'use client';

import { useEffect, useState } from 'react';
import { MdImage } from 'react-icons/md';
import Link from 'next/link';

const DEFAULTS = {
  title: '',
  subtitle: '',
  chip1: '',
  chip2: '',
  chip3: '',
};

const input =
  'w-full rounded-xl border border-white/20 bg-[#081A2F] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400';

const button =
  'rounded-xl border border-cyan-400/30 bg-[#163554] px-4 py-3 text-sm font-bold text-white disabled:opacity-40';

export default function DetailBannerEditor() {
  const [games, setGames] = useState([]);
  const [banners, setBanners] = useState([]);
  const [slug, setSlug] = useState('');
  const [form, setForm] = useState(DEFAULTS);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const [gr, br] = await Promise.all([
      fetch('/api/admin/juegos', { cache: 'no-store' }),
      fetch('/api/admin/detalle-banners', { cache: 'no-store' }),
    ]);

    const gd = await gr.json().catch(() => ({}));
    const bd = await br.json().catch(() => ({}));

    if (!gr.ok || !br.ok) {
      throw new Error(
        br.status === 500
          ? 'No se pudo leer la configuración. Comprueba la tabla en Neon.'
          : 'No se pudo cargar el administrador.'
      );
    }

    setGames(gd.games || []);
    setBanners(bd.banners || []);
    setSlug((current) => current || gd.games?.[0]?.slug || '');
  }

  useEffect(() => {
    load()
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selected = games.find((g) => g.slug === slug);
  const saved = banners.find((b) => b.slug === slug);

  useEffect(() => {
    setForm({
      title: saved?.title || '',
      subtitle: saved?.subtitle || '',
      chip1: saved?.chip1 || '',
      chip2: saved?.chip2 || '',
      chip3: saved?.chip3 || '',
    });
    setImage(null);
    setMsg('');
  }, [slug, banners]);

  function change(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function upload(file) {
    const r = await fetch('/api/admin/subir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'games' }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      throw new Error('No se pudo autorizar la subida a Cloudinary.');
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', data.apiKey);
    fd.append('timestamp', String(data.timestamp));
    fd.append('asset_folder', data.folder);
    fd.append('public_id_prefix', data.folder);
    fd.append('signature', data.signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
      { method: 'POST', body: fd }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error?.message || 'Error al subir la imagen.');
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  }

  async function save() {
    if (!slug || busy) return;

    setBusy(true);
    setMsg('Guardando…');

    try {
      const payload = { slug, ...form };

      if (image) {
        payload.image = await upload(image);
      }

      const r = await fetch('/api/admin/detalle-banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(result.error || 'No se pudo guardar.');
      }

      await load();
      setMsg('Banner guardado correctamente.');
    } catch (e) {
      setMsg(e.message || 'Error al guardar.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!slug || busy) return;

    if (!window.confirm('¿Restablecer el banner de este juego?')) {
      return;
    }

    setBusy(true);

    try {
      const r = await fetch('/api/admin/detalle-banners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      if (!r.ok) throw new Error('No se pudo restablecer.');

      await load();
      setMsg('Configuración restablecida.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-300">Cargando editor…</p>;
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white">
            Banners de detalle
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Personaliza el fondo de cada juego o servicio.
          </p>
        </div>

        <Link href="/admin/juegos" className={button}>
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border border-cyan-400/20 bg-[#102B49] p-4">
        <label className="mb-2 block text-sm font-bold text-cyan-200">
          Selecciona un juego o servicio
        </label>

        <select
          className={input}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={busy}
        >
          {games.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          <div className="space-y-3 rounded-2xl border border-cyan-400/20 bg-[#102B49] p-4">
            <h2 className="flex items-center gap-2 font-bold text-white">
              <MdImage className="text-cyan-300" />
              Vista previa
            </h2>

            <div
              className="relative min-h-52 overflow-hidden rounded-2xl bg-gradient-to-br from-[#13466B] to-[#061326] bg-cover bg-center"
              style={{
                backgroundImage: (previewUrl || saved?.url)
                  ? `linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.25)),url("${previewUrl || saved.url}")`
                  : undefined,
              }}
            >
              <div className="relative flex min-h-52 flex-col justify-end p-5">
                <span className="mb-3 w-fit rounded-full bg-orange-500 px-3 py-1 text-[10px] font-extrabold text-white">
                  {selected.kind === 'tarjeta' ? 'TARJETAS DIGITALES' : 'RECARGA DIRECTA AL ID'}
                </span>

                <div className="flex items-center gap-3">
                  {selected.image ? (
                    <img
                      src={selected.image}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <span className="text-4xl">{selected.emoji || '🎮'}</span>
                  )}

                  <h2 className="text-2xl font-black uppercase italic text-white">
                    {form.title || selected.name}
                  </h2>
                </div>

                <p className="mt-2 text-xs text-slate-200">
                  {form.subtitle || 'Servicio para Bolivia'}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    form.chip1 || 'Pago con QR',
                    form.chip2 || 'Sin contraseña',
                    form.chip3 || 'Soporte WhatsApp',
                  ].map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {saved?.url && (
              <p className="text-xs text-emerald-300">
                Este juego tiene un fondo personalizado.
              </p>
            )}

            <label className="block text-sm font-bold text-white">
              Imagen panorámica
            </label>

            <input
              type="file"
              accept="image/*"
              disabled={busy}
              className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';

                if (!file) return;

                if (!file.type.startsWith('image/')) {
                  setMsg('Selecciona una imagen válida.');
                  return;
                }

                if (file.size > 5 * 1024 * 1024) {
                  setMsg('La imagen debe pesar máximo 5 MB.');
                  return;
                }

                setImage(file);
                setMsg(`Imagen seleccionada: ${file.name}`);
              }}
            />

            <p className="text-xs text-slate-400">
              Recomendado: 1600 × 600 píxeles. Máximo 5 MB.
              La nueva imagen aparecerá después de guardar.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-cyan-400/20 bg-[#102B49] p-4">
            <h2 className="font-bold text-white">Textos del banner</h2>

            {[
              ['title', 'Título', 100, selected.name],
              ['subtitle', 'Subtítulo', 140, 'Servicio para Bolivia'],
              ['chip1', 'Etiqueta 1', 45, 'Pago con QR'],
              ['chip2', 'Etiqueta 2', 45, 'Sin contraseña'],
              ['chip3', 'Etiqueta 3', 45, 'Soporte WhatsApp'],
            ].map(([key, label, max, placeholder]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-bold text-slate-300">
                  {label}
                </span>

                <input
                  className={input}
                  value={form[key]}
                  maxLength={max}
                  placeholder={placeholder}
                  disabled={busy}
                  onChange={(e) => change(key, e.target.value)}
                />
              </label>
            ))}
          </div>

          {msg && (
            <p className="rounded-xl border border-cyan-400/20 bg-[#102B49] p-3 text-sm text-white">
              {msg}
            </p>
          )}

          <button
            disabled={busy}
            onClick={save}
            className="w-full rounded-2xl bg-gradient-to-r from-[#00D9FF] to-[#007BFF] py-3.5 font-extrabold text-slate-950 disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar banner'}
          </button>

          <button
            disabled={busy}
            onClick={reset}
            className="w-full rounded-2xl border border-red-400/30 bg-red-400/10 py-3 font-bold text-red-200 disabled:opacity-50"
          >
            Restablecer banner
          </button>
        </>
      )}
    </div>
  );
}
