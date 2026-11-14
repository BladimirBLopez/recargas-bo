'use client';

import { useEffect, useState } from 'react';

const btn = 'rounded-xl border border-cyan-400/25 bg-[#163554] px-3 py-2 text-xs font-bold text-white disabled:opacity-40';
const inp = 'w-full min-w-0 rounded-xl border border-white/15 bg-[#081A2F] px-3 py-2.5 text-sm text-white';

export default function PackageSectionsEditor({
  game, onChanged, renderPackage
}) {
  const [sections, setSections] = useState([]);
  const [links, setLinks] = useState({});
  const [name, setName] = useState('');
  const [form, setForm] = useState(null);
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
    setSections([]);
    setLinks({});
    load().catch(() => setMsg('Error cargando secciones'));
  }, [game.slug]);

  async function send(method, body, path = '') {
    if (busy) return false;
    setBusy(true);
    setMsg('');

    try {
      const r = await fetch('/api/admin/secciones' + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: game.slug,
          ...body
        })
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Error');

      if (path === '/paquetes') await onChanged?.();
      await load();

      if (method === 'POST' && !path) setName('');
      setMsg('Guardado correctamente');
      return true;
    } catch (e) {
      setMsg('Error: ' + e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const custom = sections
    .filter(s => s.id !== 'rec' && s.id !== 'pass')
    .sort((a, b) => Number(a.sort) - Number(b.sort));

  const groups = [
    { id: 'rec', name: 'Recargas', active: true, fixed: true },
    { id: 'pass', name: 'Pases', active: true, fixed: true },
    ...custom
  ];

  function groupOf(p) {
    const id = links[p.id];

    if (id === 'rec' || id === 'pass') return id;
    if (custom.some(s => s.id === id)) return id;

    return /pase/i.test(p.label) ? 'pass' : 'rec';
  }

  async function createPackage(s) {
    if (!form || form.sectionId !== s.id) return;

    const label = form.label.trim();
    const price = Number(form.price);

    if (!label || label.length > 40 ||
        !form.price.trim() ||
        !Number.isFinite(price) ||
        price <= 0 || price > 100000) {
      setMsg('Revisa el nombre y el precio');
      return;
    }

    const ok = await send('POST', {
      sectionId: s.id,
      label,
      price
    }, '/paquetes');

    if (ok) setForm(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/20 bg-[#102B49] p-4">
        <h3 className="mb-3 font-bold">
          Crear nueva sección
        </h3>
        <div className="flex gap-2">
          <input
            className={inp}
            value={name}
            maxLength={40}
            placeholder="Ej. Tarjetas"
            onChange={e => setName(e.target.value)}
          />
          <button
            className={btn}
            disabled={busy || !name.trim()}
            onClick={() => send('POST', {
              name: name.trim()
            })}
          >
            + Crear
          </button>
        </div>
      </div>

      {groups.map(s => {
        const items = game.packages.filter(
          p => groupOf(p) === s.id
        );

        return (
          <div
            key={s.id}
            className="space-y-3 rounded-2xl border border-cyan-400/20 bg-[#102B49] p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white">
                  {s.name}
                  {!s.active && ' (Oculta)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {items.length} paquetes
                </p>
              </div>

              {!s.fixed && (
                <div className="flex flex-wrap gap-1">
                  <button className={btn} disabled={busy}
                    onClick={() => {
                      const n = prompt('Nuevo nombre', s.name);
                      if (n && n.trim())
                        send('PATCH', {
                          id: s.id, name: n.trim()
                        });
                    }}>
                    Editar
                  </button>
                  <button className={btn} disabled={busy}
                    onClick={() => send('PATCH', {
                      id: s.id, active: !s.active
                    })}>
                    {s.active ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button className={btn} disabled={busy}
                    onClick={() => {
                      const n = prompt('Orden', String(s.sort));
                      if (n !== null && /^\d{1,4}$/.test(n))
                        send('PATCH', {
                          id: s.id, sort: Number(n)
                        });
                    }}>
                    Orden
                  </button>
                  <button className={btn + ' text-red-300'} disabled={busy}
                    onClick={() => {
                      if (confirm('¿Eliminar sección? Los paquetes se conservan.'))
                        send('DELETE', { id: s.id });
                    }}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            {items.length === 0 && (
              <p className="text-xs text-slate-400">
                Esta sección todavía no tiene paquetes.
              </p>
            )}

            {items.map(p => (
              <div key={p.id} className="space-y-2">
                {renderPackage?.(p)}

                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-slate-400">
                    Mover a:
                  </span>
                  <select
                    className={inp + ' !w-auto max-w-[65%]'}
                    disabled={busy}
                    value={links[p.id] || ''}
                    onChange={e => send('PATCH', {
                      packageId: p.id,
                      sectionId: e.target.value || null
                    }, '/asignar')}
                  >
                    <option value="">Automático</option>
                    <option value="rec">Recargas</option>
                    <option value="pass">Pases</option>
                    {custom.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {form?.sectionId === s.id ? (
              <div className="space-y-2 rounded-xl border border-cyan-400/20 p-3">
                <input
                  className={inp}
                  maxLength={40}
                  placeholder="Nombre del paquete"
                  value={form.label}
                  onChange={e => setForm({
                    ...form, label: e.target.value
                  })}
                />
                <input
                  className={inp}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  placeholder="Precio Bs"
                  value={form.price}
                  onChange={e => setForm({
                    ...form, price: e.target.value
                  })}
                />
                <div className="flex gap-2">
                  <button
                    className={btn}
                    disabled={busy}
                    onClick={() => createPackage(s)}
                  >
                    Guardar paquete
                  </button>
                  <button
                    className={btn}
                    disabled={busy}
                    onClick={() => setForm(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={btn + ' w-full'}
                disabled={busy}
                onClick={() => setForm({
                  sectionId: s.id,
                  label: '',
                  price: ''
                })}
              >
                + Agregar paquete a {s.name}
              </button>
            )}
          </div>
        );
      })}

      {msg && (
        <p className="text-xs text-cyan-200">{msg}</p>
      )}
    </div>
  );
}
