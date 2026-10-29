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
    <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</span>
        <span className={'grid h-8 w-8 place-items-center rounded-xl ' + accent}>
          <Icon className="text-lg" />
        </span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold leading-none text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/40">{hint}</div>}
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
