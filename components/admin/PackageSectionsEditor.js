'use client';

import { useEffect, useState } from 'react';

const btn = 'rounded-xl border border-cyan-400/25 bg-[#163554] px-3 py-2 text-xs font-bold text-white disabled:opacity-40';

export default function PackageSectionsEditor({ game, onChanged }) {
  const [sections, setSections] = useState([]);
  const [links, setLinks] = useState({});
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const r = await fetch(
      '/api/admin/secciones?slug=' +
      encodeURIComponent(game.slug),
      { cache: 'no-store' }
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Error');
    setSections(d.sections || []);
    setLinks(d.assignments || {});
  }

  useEffect(() => {
    load().catch(() => setMsg('Error al cargar secciones'));
  }, [game.slug]);

  async function request(method, body, assign = false) {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch(
        assign
          ? '/api/admin/secciones/asignar'
          : '/api/admin/secciones',
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: game.slug, ...body })
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      await load();
      if (method === 'POST') setName('');
      setMsg('Guardado correctamente');
    } catch (e) {
      setMsg('No se pudo guardar: ' + e.message);
    } finally {
      setBusy(false);
    }
  }


  async function addPackage(sectionId) {
    if (busy) return;

    const label = prompt('Nombre del paquete');
    if (label === null) return;

    const name = label.trim();
    if (!name || name.length > 40) {
      setMsg('Nombre inválido (máximo 40 caracteres)');
      return;
    }

    const raw = prompt('Precio en Bs');
    if (raw === null) return;

    const price = Number(raw);
    if (!raw.trim() || !Number.isFinite(price)
        || price <= 0 || price > 100000) {
      setMsg('Precio inválido');
      return;
    }

    setBusy(true);
    setMsg('');

    try {
      const r = await fetch(
        '/api/admin/secciones/paquetes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: game.slug,
            sectionId,
            label: name,
            price
          })
        }
      );

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(d.error || 'Error al guardar');
      }

      await onChanged?.();
      await load();
      setMsg('Paquete creado correctamente');
    } catch (e) {
      setMsg('Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-cyan-400/20 bg-[#102B49] p-4">
      <h3 className="font-bold text-white">
        Secciones de paquetes
      </h3>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={40}
          placeholder="Ej. Diamantes"
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#081A2F] px-3 py-2 text-sm text-white"
        />
        <button
          className={btn}
          disabled={busy || !name.trim()}
          onClick={() => request('POST', { name: name.trim() })}
        >
          + Crear
        </button>
      </div>

      {sections.map(s => (
        <div key={s.id} className="rounded-xl border border-white/10 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex-1 text-sm font-bold">
              {s.name} {!s.active && '(Oculta)'}
            </span>
            <button className={btn} disabled={busy}
              onClick={() => {
                const n = prompt('Nombre de sección', s.name);
                if (n && n.trim() !== s.name)
                  request('PATCH', { id: s.id, name: n.trim() });
              }}>
              Editar
            </button>
            <button className={btn} disabled={busy}
              onClick={() => request('PATCH', {
                id: s.id, active: !s.active
              })}>
              {s.active ? 'Ocultar' : 'Mostrar'}
            </button>
            <button className={btn} disabled={busy}
              onClick={() => {
                const n = prompt('Orden de sección (0 a 9999)', String(s.sort));
                if (n !== null && /^\d{1,4}$/.test(n))
                  request('PATCH', { id: s.id, sort: Number(n) });
              }}>
              Orden
            </button>
            <button className={btn + ' text-red-300'} disabled={busy}
              onClick={() => {
                if (confirm('¿Eliminar esta sección? Los paquetes se conservarán.'))
                  request('DELETE', { id: s.id });
              }}>
              Eliminar
            </button>
          </div>
        <button
          type="button"
          className={btn + ' mt-3'}
          disabled={busy}
          onClick={() => addPackage(s.id)}
        >
          + Agregar paquete
        </button>
        </div>
      ))}

      <p className="text-xs font-semibold text-white/60">
        Asignar paquetes a una sección
      </p>

      {game.packages.map(p => (
        <div key={p.id} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-white">
            {p.label}
          </span>
          <select
            className="max-w-[55%] rounded-lg border border-white/15 bg-[#081A2F] p-2 text-xs text-white"
            value={links[p.id] || ''}
            disabled={busy}
            onChange={e => request('PATCH', {
              packageId: p.id,
              sectionId: e.target.value || null
            }, true)}
          >
            <option value="">
              Automático
            </option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      <p className="text-xs text-white/50">
        Automático conserva la clasificación actual:
        Recargas o Pases.
      </p>

      {msg && (
        <p className="text-xs text-cyan-200">{msg}</p>
      )}
    </div>
  );
}
