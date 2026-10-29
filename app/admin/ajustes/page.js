'use client';
import { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { MdCampaign, MdQrCode2, MdVpnKey, MdCheckCircle, MdErrorOutline } from 'react-icons/md';
import CatalogTabs from '@/components/admin/CatalogTabs';

const card = 'rounded-2xl border border-white/10 bg-zinc-950/80 p-4';
const input = 'mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-yellow-300/60';
const btn = 'w-full rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 py-3 font-bold text-black shadow-lg shadow-orange-500/20 transition active:scale-95 disabled:opacity-40 disabled:shadow-none';

function Head({ icon: Icon, title, hint }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-yellow-300/15 text-yellow-300">
        <Icon className="text-xl" />
      </span>
      <div className="min-w-0">
        <div className="font-semibold leading-tight">{title}</div>
        {hint && <div className="text-xs text-white/50">{hint}</div>}
      </div>
    </div>
  );
}

export default function Ajustes() {
  const [wa, setWa] = useState('');
  const [notice, setNotice] = useState('');
  const [orig, setOrig] = useState({ wa: '', notice: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/admin/ajustes', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setWa(d.whatsapp || '');
        setNotice(d.notice || '');
        setOrig({ wa: d.whatsapp || '', notice: d.notice || '' });
      })
      .catch(() => setMsg({ ok: false, t: 'No se pudo cargar' }))
      .finally(() => setLoading(false));
  }, []);

  const dirty = wa !== orig.wa || notice !== orig.notice;
  const waClean = wa.replace(/\D/g, '');
  const waOk = waClean.length >= 8 && waClean.length <= 15;

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: wa, notice }),
      });
      const d = await r.json();
      if (r.ok) {
        setWa(d.whatsapp);
        setNotice(d.notice);
        setOrig({ wa: d.whatsapp, notice: d.notice });
        setMsg({ ok: true, t: 'Cambios guardados' });
      } else {
        setMsg({
          ok: false,
          t: d.error === 'whatsapp_invalido' ? 'Número inválido (con código de país, solo dígitos)' : 'Error al guardar',
        });
      }
    } catch (e) {
      setMsg({ ok: false, t: 'Error de red' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 pb-24">
      <CatalogTabs />

      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <Head icon={FaWhatsapp} title="WhatsApp de atención" hint="Botón flotante, ayuda y comprobantes" />
          <label className="block text-sm font-medium text-white/70">
            Número con código de país, sin +
            <input
              className={input}
              inputMode="numeric"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              placeholder="59169356292"
              disabled={loading}
            />
          </label>
          {waOk && (
            <a
              href={'https://wa.me/' + waClean}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-bold text-yellow-300"
            >
              Probar enlace ›
            </a>
          )}
        </div>

        <div className={card}>
          <Head icon={MdCampaign} title="Aviso global" hint="Franja arriba de la tienda. Vacío = sin aviso" />
          <label className="block text-sm font-medium text-white/70">
            Mensaje
            <textarea
              className={input}
              rows={3}
              maxLength={160}
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="Ej: Hoy atendemos hasta las 22:00"
              disabled={loading}
            />
          </label>
          <div className="mt-1 text-right text-xs text-white/40">{notice.length}/160</div>
          {notice.trim() && (
            <div className="mt-2 rounded-xl border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-center text-sm font-semibold text-yellow-300">
              {notice}
            </div>
          )}
        </div>
      </div>

      <div className={card}>
        <button className={btn} onClick={save} disabled={saving || loading || !dirty}>
          {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Sin cambios'}
        </button>
        {dirty && !saving && <p className="mt-2 text-center text-xs text-yellow-300">Tienes cambios sin guardar</p>}
        {msg && (
          <p className={'mt-2 flex items-center justify-center gap-1.5 text-sm ' + (msg.ok ? 'text-emerald-300' : 'text-red-300')}>
            {msg.ok ? <MdCheckCircle /> : <MdErrorOutline />}
            {msg.t}
          </p>
        )}
      </div>

      <div className={card + ' opacity-70'}>
        <Head icon={MdQrCode2} title="Próximamente" hint="Aún no disponible" />
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <MdQrCode2 className="text-lg" /> Cambiar el QR de pago
          </li>
          <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <MdVpnKey className="text-lg" /> Cambiar la clave del admin
          </li>
        </ul>
      </div>
    </div>
  );
}
