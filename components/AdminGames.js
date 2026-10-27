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

  if (!list) return <p className="text-white/60">{err || 'Cargando...'}</p>;

  return (
    <div className="space-y-3">
      {err && <p className="text-sm text-red-300">{err}</p>}
      {list.map((g) => (
        <div key={g.slug} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
          <span className="text-2xl">{g.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{g.name}</div>
            <div className={'text-xs font-semibold ' + (g.maintenance ? 'text-red-300' : 'text-green-300')}>
              {g.maintenance ? 'En mantenimiento' : 'Activo'}
              {!g.canToggle && ' · sin paquetes'}
            </div>
          </div>
          <button
            disabled={!g.canToggle || busy === g.slug}
            onClick={() => toggle(g)}
            className={
              'rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-40 ' +
              (g.maintenance ? 'bg-green-400 text-black' : 'bg-red-400 text-black')
            }
          >
            {g.maintenance ? 'Activar' : 'Pausar'}
          </button>
        </div>
      ))}
    </div>
  );
}
