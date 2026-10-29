'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MdTrendingUp, MdReceiptLong, MdSell, MdSavings, MdFileDownload } from 'react-icons/md';
import { Kpi, bs, pretty } from '@/components/admin/ui';

function boDate(back = 0) {
  return new Date(Date.now() - 4 * 3600 * 1000 - back * 86400 * 1000).toISOString().slice(0, 10);
}
function prevMonth() {
  const t = boDate(0);
  const y = Number(t.slice(0, 4));
  const m = Number(t.slice(5, 7));
  const a = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
  const b = new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);
  return [a, b];
}
function monthLabel(k) {
  try {
    return new Date(k + '-15T12:00:00').toLocaleDateString('es-BO', { month: 'short', year: '2-digit' }).replace('.', '');
  } catch (e) {
    return k;
  }
}

export default function Reportes() {
  const [from, setFrom] = useState(boDate(29));
  const [to, setTo] = useState(boDate(0));
  const [game, setGame] = useState('');
  const [group, setGroup] = useState('day');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ from, to });
    if (game) p.set('game', game);
    try {
      const r = await fetch('/api/admin/reportes?' + p.toString(), { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setRes(d);
        setErr('');
      } else setErr('Error al cargar el reporte (' + r.status + ')');
    } catch (e) {
      setErr('Sin conexión');
    }
    setLoading(false);
  }, [from, to, game]);

  useEffect(() => {
    load();
  }, [load]);

  const series = useMemo(() => {
    if (!res) return [];
    if (group === 'day') return res.dias.map((d) => ({ key: d.day, label: d.day.slice(8) + '/' + d.day.slice(5, 7), total: d.total, n: d.n }));
    const m = new Map();
    res.dias.forEach((d) => {
      const k = d.day.slice(0, 7);
      const c = m.get(k) || { key: k, label: monthLabel(k), total: 0, n: 0 };
      c.total += d.total;
      c.n += d.n;
      m.set(k, c);
    });
    return Array.from(m.values());
  }, [res, group]);

  const [pa, pb] = prevMonth();
  const chips = [
    ['7 días', boDate(6), boDate(0)],
    ['30 dias', boDate(29), boDate(0)],
    ['Este mes', boDate(0).slice(0, 8) + '01', boDate(0)],
    ['Mes anterior', pa, pb],
  ];

  const csvHref = '/api/admin/reportes?format=csv&from=' + from + '&to=' + to + (game ? '&game=' + game : '');
  const max = Math.max(1, ...series.map((s) => s.total));
  const step = Math.ceil(series.length / 6);
  const topMax = Math.max(1, ...(res?.juegos || []).map((t) => t.total));

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
        <div className="flex flex-wrap gap-2">
          {chips.map(([label, f, t]) => {
            const on = from === f && to === t;
            return (
              <button
                key={label}
                onClick={() => {
                  setFrom(f);
                  setTo(t);
                }}
                className={'rounded-full border px-3 py-1 text-xs font-bold ' + (on ? 'border-transparent bg-yellow-300 text-black' : 'border-white/10 bg-white/5 text-white/70')}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-white/50">
            Desde
            <input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" />
          </label>
          <label className="text-xs text-white/50">
            Hasta
            <input type="date" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-white/50">
            Juego
            <select value={game} onChange={(e) => setGame(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none">
              <option value="">Todos</option>
              {(res?.games || []).map((s) => (
                <option key={s} value={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
          </label>
          <div className="text-xs text-white/50">
            Ver por
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {[['day', 'Dia'], ['month', 'Mes']].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setGroup(k)}
                  className={'rounded-lg py-1.5 text-sm font-bold ' + (group === k ? 'bg-gradient-to-r from-yellow-300 to-orange-400 text-black' : 'text-white/70')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <a
          href={csvHref}
          className="flex items-center justify-center gap-2 rounded-2xl border border-green-400/30 bg-green-400/10 py-3 text-sm font-bold text-green-300 active:scale-[0.99]"
        >
          <MdFileDownload className="text-xl" /> Exportar CSV (pedidos del rango)
        </a>
      </section>

      {err && <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>}
      {!res && loading && <div className="skeleton h-40 rounded-3xl" />}

      {res && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={MdTrendingUp} label="Vendido" value={bs(res.total)} hint="Pagados + entregados" accent="bg-emerald-400/15 text-emerald-300" />
            <Kpi icon={MdReceiptLong} label="Pedidos" value={res.n} hint="Con pago confirmado" accent="bg-sky-400/15 text-sky-300" />
            <Kpi icon={MdSell} label="Ticket promedio" value={bs(Math.round(res.ticket))} hint="Por pedido" accent="bg-orange-400/15 text-orange-300" />
            <Kpi icon={MdSavings} label="Ganancia" value={res.conCosto ? bs(Math.round(res.ganancia)) : '-'} hint={res.conCosto ? res.conCosto + ' pedidos con costo · cancelados: ' + (res.estados.CANCELADO || 0) : 'Pon costos en Juegos'} accent="bg-emerald-400/15 text-emerald-300" />
          </div>

          <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/60">Ventas por {group === 'day' ? 'dia' : 'mes'}</h2>
            <div className="flex h-44 items-end gap-[3px]">
              {series.map((s, i) => (
                <div key={s.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={s.label + ': ' + bs(s.total) + ' · ' + s.n + ' pedidos'}>
                  <div className="w-full rounded-t bg-gradient-to-t from-orange-500 to-yellow-300" style={{ height: Math.max(s.total ? 3 : 1, (s.total / max) * 100) + '%', opacity: s.total ? 1 : 0.25 }} />
                  <span className="h-3 w-full overflow-visible whitespace-nowrap text-center text-[9px] text-white/50">
                    {series.length <= 8 || i % step === 0 || i === series.length - 1 ? s.label : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/60">Detalle por {group === 'day' ? 'dia' : 'mes'}</h2>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-3 border-b border-white/10 pb-2 text-[11px] font-bold uppercase text-white/40">
                  <span>Periodo</span>
                  <span className="text-right">Pedidos</span>
                  <span className="text-right">Total</span>
                </div>
                {series.slice().reverse().map((s) => (
                  <div key={s.key} className="grid grid-cols-3 border-b border-white/5 py-2 text-sm">
                    <span className="text-white/70">{group === 'day' ? s.key.slice(8) + '/' + s.key.slice(5, 7) : s.label}</span>
                    <span className="text-right text-white/70">{s.n}</span>
                    <span className={'text-right font-semibold ' + (s.total ? 'text-white' : 'text-white/30')}>{bs(s.total)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/60">Ventas por juego</h2>
              {res.juegos.length === 0 && <p className="py-6 text-center text-sm text-white/40">Sin ventas en este rango</p>}
              <div className="space-y-3">
                {res.juegos.map((t) => (
                  <div key={t.game_slug}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold">{pretty(t.game_slug)}</span>
                      <span className="text-white/60">{bs(t.total)} · {t.n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400" style={{ width: (t.total / topMax) * 100 + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
