'use client';
import Link from 'next/link';
import { MdPendingActions, MdPaid, MdTrendingUp, MdDoneAll, MdArrowForward, MdStorefront, MdBolt } from 'react-icons/md';
import { useAdmin } from '@/components/admin/AdminShell';
import { Kpi, ST, bs, ago, pretty } from '@/components/admin/ui';

function dayLabel(day) {
  try {
    return new Date(day + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', '');
  } catch (e) {
    return day.slice(5);
  }
}

export default function Resumen() {
  const { data } = useAdmin();
  if (!data) return <div className="skeleton h-40 rounded-2xl" />;

  const max = Math.max(1, ...data.dias.map((d) => d.total));
  const total7 = data.dias.reduce((a, d) => a + d.total, 0);
  const topMax = Math.max(1, ...data.top.map((t) => t.total));
  const gan = data.ganancia || {};
  const recientes = data.recientes || [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-r from-[#132541] via-[#101c33] to-[#0b1222] p-5 shadow-2xl shadow-black/10 md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              <MdBolt className="text-lg" /> Centro de operaciones
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Resumen de tu negocio</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Controla las ventas, supervisa pedidos y administra tu tienda desde un solo lugar.
            </p>
          </div>
          <Link href="/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20">
            <MdStorefront className="text-xl" /> Ver tienda <MdArrowForward />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={MdTrendingUp} label="Ventas hoy" value={bs(data.hoy.total)} hint={data.hoy.n + ' pedidos' + (gan.hoy == null ? '' : ' · ganancia ' + bs(gan.hoy))} accent="bg-emerald-400/15 text-emerald-300" />
        <Kpi icon={MdDoneAll} label="Ventas del mes" value={bs(data.mes.total)} hint={data.mes.n + ' pedidos' + (gan.mes == null ? '' : ' · ganancia ' + bs(gan.mes))} accent="bg-white/10 text-white/70" />
        <Kpi icon={MdPendingActions} label="Pendientes" value={data.counts.PENDIENTE} hint="Esperando pago" accent="bg-yellow-300/15 text-yellow-300" />
        <Kpi icon={MdPaid} label="Por entregar" value={data.counts.PAGADO} hint="Pagados sin entregar" accent="bg-sky-400/15 text-sky-300" />
      </div>

      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141e32] to-[#0b1222] p-5 shadow-xl shadow-black/10 md:p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/70">Análisis comercial</div>
            <h2 className="text-base font-bold text-white">Ventas últimos 7 días</h2>
          </div>
          <span className="font-display text-xl font-bold">{bs(total7)}</span>
        </div>
        {total7 === 0 && <p className="mb-3 text-xs text-white/40">Aún no hay ventas en estos 7 días.</p>}
        <div className="flex h-44 items-end gap-2 md:h-52">
          {data.dias.map((d, i) => {
            const last = i === data.dias.length - 1;
            return (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-white/50">{d.total ? Math.round(d.total) : ''}</span>
                <div
                  className={'w-full rounded-t-lg ' + (last ? 'bg-gradient-to-t from-blue-600 to-cyan-300 shadow-lg shadow-cyan-500/20' : 'bg-gradient-to-t from-slate-700 to-slate-500/60')}
                  style={{ height: Math.max(4, (d.total / max) * 100) + '%' }}
                />
                <span className={'text-[11px] font-semibold ' + (last ? 'text-yellow-300' : 'text-white/50')}>{dayLabel(d.day)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141e32] to-[#0b1222] p-5 shadow-xl shadow-black/10 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/70">Actividad reciente</div>
            <h2 className="text-base font-bold text-white">Últimos pedidos</h2>
          </div>
          <Link href="/admin/pedidos" className="flex items-center gap-1 text-xs font-bold text-yellow-300">
            Ver todos <MdArrowForward />
          </Link>
        </div>
        {recientes.length === 0 && <p className="py-6 text-center text-sm text-white/40">Aún no hay pedidos</p>}
        <div className="space-y-2">
          {recientes.map((o) => {
            const st = ST[o.status] || ST.EXPIRADO;
            return (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-yellow-300">{o.code}</span>
                    <span className={'rounded-full border px-2 py-0.5 text-[10px] font-bold ' + st.badge}>{st.label}</span>
                  </div>
                  <div className="truncate text-xs text-white/60">{pretty(o.game_slug)} · {o.package_label}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold">{bs(o.price)}</div>
                  <div className="text-[11px] text-white/40">{ago(o.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141e32] to-[#0b1222] p-5 shadow-xl shadow-black/10 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">Pendientes más antiguos</h2>
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

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141e32] to-[#0b1222] p-5 shadow-xl shadow-black/10 md:p-6">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Más vendidos (30 días)</h2>
          {data.top.length === 0 && <p className="py-6 text-center text-sm text-white/40">Aún no hay ventas</p>}
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
