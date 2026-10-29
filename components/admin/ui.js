export const ST = {
  PENDIENTE: { label: 'Pendiente', bar: 'bg-yellow-300', badge: 'bg-yellow-300/15 text-yellow-300 border-yellow-300/30' },
  PAGADO: { label: 'Pagado', bar: 'bg-sky-400', badge: 'bg-sky-400/15 text-sky-300 border-sky-400/30' },
  ENTREGADO: { label: 'Entregado', bar: 'bg-emerald-400', badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30' },
  CANCELADO: { label: 'Cancelado', bar: 'bg-red-400', badge: 'bg-red-400/15 text-red-300 border-red-400/30' },
  EXPIRADO: { label: 'Expirado', bar: 'bg-zinc-500', badge: 'bg-white/5 text-white/50 border-white/10' },
};

export function fmt(d) {
  try {
    return new Date(d).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/La_Paz' });
  } catch (e) {
    return '';
  }
}
export function ago(d) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return 'ahora';
  if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
  return 'hace ' + Math.floor(s / 86400) + ' d';
}
function prettyBase(slug) {
  return String(slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
export function bs(n) {
  return 'Bs ' + Number(n || 0).toLocaleString('es-BO');
}

export function Kpi({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#142F50] to-[#0A192F] p-4 shadow-xl shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/50 md:p-5">
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-cyan-400/5 blur-2xl transition group-hover:bg-cyan-400/25" />
      <div className="relative flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <span className={'grid h-10 w-10 shrink-0 place-items-center rounded-xl ' + accent}>
          <Icon className="text-xl" />
        </span>
      </div>
      <div className="relative mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">{value}</div>
      {hint && <div className="relative mt-2 text-xs leading-relaxed text-slate-400">{hint}</div>}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    </div>
  );
}

let NAMES = {};
export function setNames(n) {
  NAMES = n && typeof n === 'object' ? n : {};
}
export function pretty(slug) {
  return NAMES[slug] || prettyBase(slug);
}
