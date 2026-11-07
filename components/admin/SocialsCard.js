'use client';
import { useEffect, useState } from 'react';
import { NETWORKS, cleanUrl } from '@/lib/socials';
import { SOCIAL_ICONS } from '@/components/SocialIcons';

const inputCls =
  'w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-yellow-300';
const dot =
  'grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80';

export default function SocialsCard() {
  const [vals, setVals] = useState({});
  const [orig, setOrig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/ajustes', { cache: 'no-store' });
        const d = await r.json();
        if (on && r.ok) {
          setVals({ ...(d.socials || {}) });
          setOrig({ ...(d.socials || {}) });
        }
      } catch (e) {}
      if (on) setLoading(false);
    })();
    return () => {
      on = false;
    };
  }, []);

  const dirty = NETWORKS.some((n) => (vals[n.key] || '').trim() !== (orig[n.key] || ''));
  const anyBad = NETWORKS.some((n) => cleanUrl(n, vals[n.key]) === null);
  const preview = NETWORKS.filter((n) => cleanUrl(n, vals[n.key]));

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'socials', socials: vals }),
      });
      const d = await r.json();
      if (r.ok) {
        setVals({ ...(d.socials || {}) });
        setOrig({ ...(d.socials || {}) });
        setMsg({ ok: true, t: 'Redes guardadas' });
      } else if (d.error === 'social_invalido') {
        const n = NETWORKS.find((x) => x.key === d.red);
        setMsg({ ok: false, t: 'Revisa el enlace de ' + (n ? n.label : 'una red') });
      } else {
        setMsg({ ok: false, t: 'Error al guardar' });
      }
    } catch (e) {
      setMsg({ ok: false, t: 'Error de red' });
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
      <h2 className="text-lg font-bold text-white">Redes sociales</h2>
      <p className="mt-1 text-sm text-white/60">
        Salen como íconos en el pie de la tienda. Deja vacía la que no uses y no aparecerá.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {NETWORKS.map((n) => {
          const Icon = SOCIAL_ICONS[n.key];
          const url = cleanUrl(n, vals[n.key]);
          return (
            <div key={n.key}>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white/70">
                <Icon size={16} /> {n.label}
              </div>
              <input
                className={inputCls}
                aria-label={n.label}
                value={vals[n.key] || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setMsg(null);
                  setVals((s) => ({ ...s, [n.key]: v }));
                }}
                placeholder={n.ph}
                disabled={loading}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {url === null && (
                <p className="mt-1 text-xs text-red-400">Enlace no válido para {n.label}</p>
              )}
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-bold text-yellow-300"
                >
                  Probar enlace ›
                </a>
              )}
            </div>
          );
        })}
      </div>
      {preview.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="text-xs uppercase text-white/40">Vista previa</span>
          {preview.map((n) => {
            const Icon = SOCIAL_ICONS[n.key];
            return (
              <span key={n.key} className={dot}>
                <Icon size={18} />
              </span>
            );
          })}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || anyBad || saving}
          className="rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-2.5 font-bold text-black disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar redes'}
        </button>
        {msg && <span className={'text-sm ' + (msg.ok ? 'text-green-400' : 'text-red-400')}>{msg.t}</span>}
      </div>
    </div>
  );
}
