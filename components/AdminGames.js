'use client';
import { useEffect, useState, useCallback } from 'react';
import { MdExpandMore, MdSave, MdRestartAlt } from 'react-icons/md';

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
      onError('Sin conexion');
    }
    setBusy(false);
  }

  const inp =
    'mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-yellow-300/50';

  return (
    <div className={'rounded-2xl border p-3 ' + (active ? 'border-white/10 bg-white/5' : 'border-red-400/20 bg-red-400/5')}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{p.label}</div>
          <div className="text-[11px] text-white/40">Base: Bs {p.basePrice}</div>
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          className={'rounded-full border px-3 py-1 text-xs font-bold ' + (active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-red-400/30 bg-red-400/10 text-red-300')}
        >
          {active ? 'Activo' : 'Pausado'}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
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
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              <MdSave className="text-lg" /> Guardar
            </button>
          )}
          {modified && (
            <button
              disabled={busy}
              onClick={() => send({ reset: true })}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 disabled:opacity-50"
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
      setErr('Sin conexion');
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
      setErr('Sin conexion');
    }
    setBusy('');
  }

  if (!list) {
    return err ? (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>
    ) : (
      <div className="skeleton h-20 rounded-3xl" />
    );
  }

  const activos = list.filter((g) => !g.maintenance).length;

  return (
    <div>
      <div className="mb-3 text-sm text-white/50">
        {activos} activos · {list.length - activos} en mantenimiento
      </div>
      {err && <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>}
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {list.map((g) => {
          const isOpen = open === g.slug;
          return (
            <div key={g.slug} className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-2xl">{g.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{g.name}</div>
                  <div className={'mt-0.5 flex items-center gap-1.5 text-xs font-semibold ' + (g.maintenance ? 'text-red-300' : 'text-emerald-300')}>
                    <span className={'h-1.5 w-1.5 rounded-full ' + (g.maintenance ? 'bg-red-400' : 'bg-emerald-400')} />
                    {g.maintenance ? 'En mantenimiento' : 'Activo'}
                    {!g.canToggle && ' · sin paquetes'}
                  </div>
                </div>
                <button
                  disabled={!g.canToggle || busy === g.slug}
                  onClick={() => toggle(g)}
                  className={'rounded-2xl px-4 py-2 text-sm font-bold disabled:opacity-40 ' + (g.maintenance ? 'bg-emerald-400 text-black' : 'border border-red-400/30 bg-red-400/10 text-red-300')}
                >
                  {g.maintenance ? 'Activar' : 'Pausar'}
                </button>
              </div>
              {g.packages.length > 0 && (
                <button
                  onClick={() => setOpen(isOpen ? '' : g.slug)}
                  className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/80"
                >
                  <span>Paquetes y precios ({g.packages.length})</span>
                  <MdExpandMore className={'text-xl transition ' + (isOpen ? 'rotate-180' : '')} />
                </button>
              )}
              {isOpen && (
                <div className="mt-3 space-y-2">
                  {g.packages.map((p) => (
                    <PackageRow key={p.id} p={p} onChanged={load} onError={setErr} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
