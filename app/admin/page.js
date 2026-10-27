'use client';
import Link from 'next/link';
import { MdPendingActions, MdPaid, MdTrendingUp, MdDoneAll, MdArrowForward } from 'react-icons/md';
import { useAdmin } from '@/components/admin/AdminShell';
import { Kpi, bs, ago, pretty } from '@/components/admin/ui';

function dayLabel(day) {
  try {
    return new Date(day + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', '');
  } catch (e) {
    return day.slice(5);
  }
}

export default function Resumen() {
  const { data } = useAdmin();
  if (!data) return <div className="skeleton h-40 rounded-3xl" />;

  const max = Math.max(1, ...data.dias.map((d) => d.total));
  const total7 = data.dias.reduce((a, d) => a + d.total, 0);
  const topMax = Math.max(1, ...data.top.map((t) => t.total));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={MdPendingActions} label="Pendientes" value={data.counts.PENDIENTE} hint="Esperando pago" accent="bg-yellow-300/15 text-yellow-300" />
        <Kpi icon={MdPaid} label="Por entregar" value={data.counts.PAGADO} hint="Pagados sin entregar" accent="bg-sky-400/15 text-sky-300" />
        <Kpi icon={MdTrendingUp} label="Ventas hoy" value={bs(data.hoy.total)} hint={data.hoy.n + ' pedidos'} accent="bg-emerald-400/15 text-emerald-300" />
        <Kpi icon={MdDoneAll} label="Ventas del mes" value={bs(data.mes.total)} hint={data.mes.n + ' pedidos'} accent="bg-orange-400/15 text-orange-300" />
      </div>

      <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Ventas ultimos 7 dias</h2>
          <span className="font-display text-xl font-bold">{bs(total7)}</span>
        </div>
        <div className="flex h-40 items-end gap-2">
          {data.dias.map((d, i) => {
            const last = i === data.dias.length - 1;
            return (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-white/50">{d.total ? Math.round(d.total) : ''}</span>
                <div
                  className={'w-full rounded-t-lg ' + (last ? 'bg-gradient-to-t from-orange-500 to-yellow-300' : 'bg-white/20')}
                  style={{ height: Math.max(4, (d.total / max) * 100) + '%' }}
                />
                <span className={'text-[11px] font-semibold ' + (last ? 'text-yellow-300' : 'text-white/50')}>{dayLabel(d.day)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Pendientes mas viejos</h2>
            <Link href="/admin/pedidos" className="flex items-center gap-1 text-xs font-bold text-yellow-300">
              Ver todos <MdArrowForward />
            </Link>
          </div>
          {data.pendientes.length === 0 && <p className="py-6 text-center text-sm text-white/40">Sin pendientes</p>}
          <div className="space-y-2">
            {data.pendientes.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-bold text-yellow-300">{o.code}</div>
                  <div className="truncate text-xs text-white/60">{pretty(o.game_slug)} · {o.package_label}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold">{bs(o.price)}</div>
                  <div className="text-[11px] text-white/40">{ago(o.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/60">Mas vendidos (30 dias)</h2>
          {data.top.length === 0 && <p className="py-6 text-center text-sm text-white/40">Aun no hay ventas</p>}
          <div className="space-y-3">
            {data.top.map((t) => (
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
    </div>
  );
}
