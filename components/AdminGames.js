'use client';
import { useEffect, useState, useCallback } from 'react';
import { MdExpandMore, MdSave, MdRestartAlt, MdImage, MdSettings, MdInventory2 } from 'react-icons/md';
import Link from 'next/link';

function PackageRow({ p, onChanged, onError }) {
  const [price, setPrice] = useState(String(p.price));
  const [cost, setCost] = useState(p.cost === null ? '' : String(p.cost));
  const [active, setActive] = useState(p.active);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrice(String(p.price));
    setCost(p.cost === null ? '' : String(p.cost));
    setActive(p.active);
  }, [p.price, p.cost, p.active]);

  const dirty =
    Number(price) !== p.price ||
    (cost === '' ? p.cost !== null : Number(cost) !== p.cost) ||
    active !== p.active;
  const modified = p.price !== p.basePrice || p.cost !== null || !p.active;
  const gan = price !== '' && cost !== '' ? Number(price) - Number(cost) : null;

  async function send(payload) {
    setBusy(true);
    onError('');
    try {
      const r = await fetch('/api/admin/paquetes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, ...payload }),
      });
      if (!r.ok) onError('No se pudo guardar (' + r.status + '). ¿Creaste la tabla en Neon?');
      else await onChanged();
    } catch (e) {
      onError('Sin conexión');
    }
    setBusy(false);
  }

  const inp =
    'mt-1 w-full rounded-xl border border-white/15 bg-[#081A2F]/80 px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20';

  return (
    <div className={'rounded-2xl border p-3.5 transition-colors ' + (active ? 'border-cyan-400/15 bg-[#102B49]/80' : 'border-red-400/25 bg-red-400/5')}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-white">{p.label}</div>
          <div className="text-[11px] text-slate-400">Base: Bs {p.basePrice}</div>
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          className={'rounded-full border px-3 py-1 text-xs font-bold ' + (active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-red-400/30 bg-red-400/10 text-red-300')}
        >
          {active ? 'Activo' : 'Pausado'}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-[11px] text-white/50">
          Precio (Bs)
          <input type="number" inputMode="decimal" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} />
        </label>
        <label className="text-[11px] text-white/50">
          Costo (Bs)
          <input type="number" inputMode="decimal" min="0" step="0.5" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Sin costo" className={inp} />
        </label>
      </div>
      {gan !== null && (
        <div className={'mt-2 text-xs font-semibold ' + (gan >= 0 ? 'text-emerald-300' : 'text-red-300')}>
          Ganancia: Bs {Math.round(gan * 100) / 100}
          {Number(price) > 0 ? ' (' + Math.round((gan / Number(price)) * 100) + '%)' : ''}
        </div>
      )}
      {(dirty || modified) && (
        <div className="mt-2 flex gap-2">
          {dirty && (
            <button
              disabled={busy}
              onClick={() => send({ price: price === '' ? null : Number(price), cost: cost === '' ? null : Number(cost), active })}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#007BFF] py-2.5 text-sm font-extrabold text-slate-950 shadow-md shadow-cyan-500/15 transition active:scale-95 disabled:opacity-50"
            >
              <MdSave className="text-lg" /> Guardar
            </button>
          )}
          {modified && (
            <button
              disabled={busy}
              onClick={() => send({ reset: true })}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/20 bg-[#163554] px-3 py-2 text-xs font-bold text-slate-200 transition active:scale-95 disabled:opacity-50"
            >
              <MdRestartAlt className="text-lg" /> Restablecer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminGames() {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState('');
  const [section, setSection] = useState('paquetes');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/juegos', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr('No se pudo cargar la lista (' + r.status + ').');
        return;
      }
      setList(d.games || []);
      setErr('');
    } catch (e) {
      setErr('Sin conexión');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(g) {
    setBusy(g.slug);
    setErr('');
    try {
      const r = await fetch('/api/admin/juegos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: g.slug, maintenance: !g.maintenance }),
      });
      if (!r.ok) setErr('No se pudo cambiar (' + r.status + ')');
      await load();
    } catch (e) {
      setErr('Sin conexión');
    }
    setBusy('');
  }

  if (!list) {
    return err ? (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>
    ) : (
      <div className="skeleton h-20 rounded-2xl" />
    );
  }

  const activos = list.filter((g) => !g.maintenance).length;

  return (
    <div>
      <div className="mb-4 rounded-xl border border-cyan-400/15 bg-[#102B49]/70 px-4 py-3 text-sm font-semibold text-slate-300">
        {activos} activos · {list.length - activos} en mantenimiento
      </div>
      {err && <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {list.map((g) => {
          const isOpen = open === g.slug;
          return (
            <div key={g.slug} className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-[#122B49] to-[#09192E] p-4 shadow-lg shadow-black/15 transition-colors hover:border-cyan-400/30">
              <div className="flex items-center gap-3">
                {g.image ? (
                  <img src={g.image} alt="" className="h-14 w-11 shrink-0 rounded-xl border border-white/10 object-cover" />
                ) : (
                  <span className="grid h-14 w-11 shrink-0 place-items-center rounded-xl border border-cyan-400/15 bg-[#163554] text-2xl">{g.emoji}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold text-white">{g.name}</div>
                  <div className={'mt-0.5 flex items-center gap-1.5 text-xs font-semibold ' + (g.maintenance ? 'text-red-300' : 'text-emerald-300')}>
                    <span className={'h-1.5 w-1.5 rounded-full ' + (g.maintenance ? 'bg-red-400' : 'bg-emerald-400')} />
                    {g.maintenance ? 'En mantenimiento' : 'Activo'}
                    {!g.canToggle && ' · sin paquetes'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(isOpen ? '' : g.slug);
                  setSection('paquetes');
                }}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-cyan-400/20 bg-[#163554]/70 px-3 py-3 text-sm font-bold text-cyan-100"
              >
                <span>Administrar juego</span>
                <MdExpandMore className={'text-xl transition ' + (isOpen ? 'rotate-180' : '')} />
              </button>

              {isOpen && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['paquetes', 'Paquetes', MdInventory2],
                      ['estado', 'Estado', MdSettings],
                      ['banner', 'Banner', MdImage],
                    ].map(([id, label, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSection(id)}
                        className={
                          'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold ' +
                          (section === id
                            ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200'
                            : 'border-white/10 bg-[#102B49] text-slate-400')
                        }
                      >
                        <Icon className="text-xl" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {section === 'paquetes' && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400">
                        {g.packages.length} paquetes disponibles
                      </div>
                      {g.packages.map((p) => (
                        <PackageRow key={p.id} p={p} onChanged={load} onError={setErr} />
                      ))}
                    </div>
                  )}

                  {section === 'estado' && (
                    <div className="rounded-xl border border-white/10 bg-[#102B49] p-4">
                      <div className="text-sm font-bold text-white">Estado del juego</div>
                      <p className="mt-2 text-xs text-slate-400">
                        {g.maintenance
                          ? 'El juego está en mantenimiento.'
                          : 'El juego está disponible para recibir pedidos.'}
                      </p>
                      <button
                        type="button"
                        disabled={!g.canToggle || busy === g.slug}
                        onClick={() => toggle(g)}
                        className="mt-3 rounded-xl border border-cyan-400/30 bg-[#163554] px-4 py-2.5 text-sm font-bold text-cyan-200 disabled:opacity-40"
                      >
                        {g.maintenance ? 'Activar juego' : 'Pausar juego'}
                      </button>
                    </div>
                  )}

                  {section === 'banner' && (
                    <div className="rounded-xl border border-white/10 bg-[#102B49] p-4">
                      <div className="text-sm font-bold text-white">Banner personalizado</div>
                      <p className="mt-2 text-xs text-slate-400">
                        Personaliza la imagen y los textos de este juego.
                      </p>
                      <Link
                        href="/admin/detalle-banners"
                        className="mt-3 inline-flex rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-extrabold text-slate-950"
                      >
                        Editar banner
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
