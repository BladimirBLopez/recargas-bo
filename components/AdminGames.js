'use client';
import { useEffect, useState, useCallback } from 'react';

export default function AdminGames() {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/juegos', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr('No se pudo cargar la lista (' + r.status + '). ¿Creaste la tabla en Neon?');
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
      {err && (
        <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((g) => (
          <div key={g.slug} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-2xl">{g.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{g.name}</div>
              <div
                className={
                  'mt-0.5 flex items-center gap-1.5 text-xs font-semibold ' +
                  (g.maintenance ? 'text-red-300' : 'text-emerald-300')
                }
              >
                <span className={'h-1.5 w-1.5 rounded-full ' + (g.maintenance ? 'bg-red-400' : 'bg-emerald-400')} />
                {g.maintenance ? 'En mantenimiento' : 'Activo'}
                {!g.canToggle && ' · sin paquetes'}
              </div>
            </div>
            <button
              disabled={!g.canToggle || busy === g.slug}
              onClick={() => toggle(g)}
              className={
                'rounded-2xl px-4 py-2 text-sm font-bold disabled:opacity-40 ' +
                (g.maintenance ? 'bg-emerald-400 text-black' : 'border border-red-400/30 bg-red-400/10 text-red-300')
              }
            >
              {g.maintenance ? 'Activar' : 'Pausar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
