'use client';
import { useCallback, useEffect, useState } from 'react';

const ERR = {
  cobro_manual_no_configurado: 'Falta activar el cobro manual en el servidor.',
  sin_precios_activos: 'Debe quedar al menos un precio activo.',
  horario_invalido: 'Horario no válido: la apertura va antes del cierre (de 0 a 23).',
  vigencia_invalida: 'La vigencia debe ser de 1 a 168 horas.',
  precio_invalido_activo: 'Un precio activo debe ser un número entero mayor que 0. Guarda el precio antes de activarlo.',
  precio_invalido: 'Precio no válido.',
  costo_invalido: 'Costo no válido.',
  etiqueta_invalida: 'El nombre debe tener de 2 a 40 caracteres.',
  paquete_normal_ambiguo: 'Hay dos paquetes normales con esa cantidad; revisa el catálogo.',
  no_autorizado: 'Sesión vencida: vuelve a entrar al panel.',
  paquete_duplicado: 'Ya existe un paquete con ese nombre.',
  paquete_activo: 'Primero desactiva el paquete.',
  paquete_en_uso: 'Este paquete tiene solicitudes o pedidos. No se puede eliminar; dejalo inactivo.',
  no_existe: 'El paquete ya no existe.',
};

const input =
  'w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-yellow-300';
const btn =
  'rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 px-4 py-2.5 font-bold text-black disabled:opacity-50';
const ghost = 'rounded-xl border border-white/20 px-4 py-2.5 font-bold text-white disabled:opacity-50';

async function call(method, body) {
  const r = await fetch('/api/admin/ff-descuento/config', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, d };
}

const draftOf = (p) => ({
  label: p.label,
  price: p.price === null ? '' : String(p.price),
  cost: p.cost === null ? '' : String(p.cost),
});

export default function FFDiscountConfig() {
  const [data, setData] = useState(null);
  const [cfg, setCfg] = useState({ open: '', close: '', valid: '' });
  const [rows, setRows] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({});
  const [loadErr, setLoadErr] = useState('');
  const [newPack, setNewPack] = useState({
    label: '', price: '', cost: ''
  });
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState(null);

  const apply = useCallback((d, mode) => {
    setData(d);
    if (mode === 'all' || mode === 'cfg') {
      setCfg({
        open: String(d.config?.open_hour ?? ''),
        close: String(d.config?.close_hour ?? ''),
        valid: String(d.config?.valid_hours ?? ''),
      });
    }
    setRows((old) => {
      const next = { ...old };
      for (const p of d.prices) {
        if (mode === 'all' || mode === p.id || !next[p.id]) next[p.id] = draftOf(p);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { ok, d } = await call('GET');
        if (!on) return;
        if (ok && d.config) apply(d, 'all');
        else setLoadErr(ERR[d.error] || 'No se pudo cargar la configuración.');
      } catch (e) {
        if (on) setLoadErr('Sin conexión.');
      }
    })();
    return () => {
      on = false;
    };
  }, [apply]);

  async function send(key, body, mode) {
    setBusy(key);
    setMsg((m) => ({ ...m, [key]: null }));
    try {
      const { ok, d } = await call('PATCH', body);
      if (ok && d.config) {
        apply(d, mode);
        setMsg((m) => ({ ...m, [key]: { ok: true, t: 'Guardado' } }));
      } else {
        setMsg((m) => ({ ...m, [key]: { ok: false, t: d.mensaje || ERR[d.error] || 'No se pudo guardar.' } }));
      }
    } catch (e) {
      setMsg((m) => ({ ...m, [key]: { ok: false, t: 'Sin conexión.' } }));
    }
    setBusy('');
  }


  async function addPackage() {
    if (adding) return;
    setAdding(true);
    setAddMsg(null);
    try {
      const { ok, d } = await call('POST', newPack);
      if (ok && d.config) {
        apply(d, 'all');
        setNewPack({ label: '', price: '', cost: '' });
        setAddMsg({
          ok: true,
          t: 'Paquete agregado como inactivo. Revisa y activa cuando quieras.'
        });
      } else {
        setAddMsg({
          ok: false,
          t: d.mensaje || ERR[d.error] || 'No se pudo agregar el paquete.'
        });
      }
    } catch {
      setAddMsg({ ok: false, t: 'Sin conexión.' });
    } finally {
      setAdding(false);
    }
  }


  async function removePackage(p) {
    if (busy) return;

    const confirmed = window.confirm(
      '¿Eliminar definitivamente "' + p.label + '"?\n\n' +
      'Solo se eliminara si no tiene solicitudes ni pedidos.'
    );

    if (!confirmed) return;

    const key = 'p-' + p.id;

    setBusy(key);
    setMsg((m) => ({
      ...m,
      [key]: null,
      removed: null
    }));

    try {
      const { ok, d } = await call('DELETE', {
        id: p.id
      });

      if (ok && d.config) {
        apply(d, 'all');
        setMsg((m) => ({
          ...m,
          removed: {
            ok: true,
            t: 'Paquete eliminado correctamente.'
          }
        }));
      } else {
        setMsg((m) => ({
          ...m,
          [key]: {
            ok: false,
            t: ERR[d.error] || 'No se pudo eliminar.'
          }
        }));
      }
    } catch {
      setMsg((m) => ({
        ...m,
        [key]: {
          ok: false,
          t: 'Sin conexion.'
        }
      }));
    } finally {
      setBusy('');
    }
  }

  if (loadErr) {
    return <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{loadErr}</div>;
  }
  if (!data) return <div className="skeleton h-40 rounded-2xl" />;

  const on = data.config.enabled === true;
  const note = (k) =>
    msg[k] ? <p className={'mt-2 text-sm ' + (msg[k].ok ? 'text-green-400' : 'text-red-400')}>{msg[k].t}</p> : null;
  const num2 = (e) => e.target.value.replace(/\D/g, '');

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
      <div>
        <h2 className="text-lg font-bold text-white">Configuración del descuento</h2>
        <p className="mt-1 text-sm text-white/60">
          Precios, horario y vigencia. Los precios activos tienen que ser enteros en Bs.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div>
          <div className={'font-bold ' + (on ? 'text-emerald-300' : 'text-amber-300')}>
            {on ? 'Promoción encendida' : 'Promoción apagada'}
          </div>
          {!data.manualReady && (
            <p className="mt-1 text-xs text-amber-300">Para encenderla falta activar el cobro manual en el servidor.</p>
          )}
        </div>
        <button
          type="button"
          className={on ? ghost : btn}
          disabled={busy === 'promo'}
          onClick={() => send('promo', { action: 'config', enabled: !on }, 'cfg')}
        >
          {busy === 'promo' ? 'Un momento...' : on ? 'Apagar' : 'Encender'}
        </button>
      </div>
      {note('promo')}

      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs font-medium text-white/70">
          Apertura (hora)
          <input
            className={input + ' mt-1'}
            inputMode="numeric"
            value={cfg.open}
            onChange={(e) => setCfg((c) => ({ ...c, open: num2(e).slice(0, 2) }))}
          />
        </label>
        <label className="text-xs font-medium text-white/70">
          Cierre (hora)
          <input
            className={input + ' mt-1'}
            inputMode="numeric"
            value={cfg.close}
            onChange={(e) => setCfg((c) => ({ ...c, close: num2(e).slice(0, 2) }))}
          />
        </label>
        <label className="text-xs font-medium text-white/70">
          Vigencia (horas)
          <input
            className={input + ' mt-1'}
            inputMode="numeric"
            value={cfg.valid}
            onChange={(e) => setCfg((c) => ({ ...c, valid: num2(e).slice(0, 3) }))}
          />
        </label>
      </div>
      <p className="text-xs text-white/40">Horario en hora de Bolivia.</p>
      <button
        type="button"
        className={btn}
        disabled={busy === 'cfg'}
        onClick={() =>
          send(
            'cfg',
            { action: 'config', open_hour: Number(cfg.open), close_hour: Number(cfg.close), valid_hours: Number(cfg.valid) },
            'cfg'
          )
        }
      >
        {busy === 'cfg' ? 'Guardando...' : 'Guardar horario'}
      </button>
      {note('cfg')}


      <div className="space-y-3 rounded-xl border border-yellow-300/30 bg-zinc-900 p-4">
        <h3 className="font-bold text-yellow-300">
          Agregar nuevo paquete de descuento
        </h3>
        <p className="text-xs text-white/60">
          Se crea inactivo. Precio entero en Bs.
          No modifica los paquetes existentes.
        </p>

        <input
          className={input}
          placeholder="Ejemplo: 100+10 💎"
          aria-label="Nombre del nuevo paquete"
          maxLength={40}
          value={newPack.label}
          onChange={(e) => setNewPack((p) => ({
            ...p, label: e.target.value
          }))}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            className={input}
            inputMode="numeric"
            placeholder="Precio Bs"
            aria-label="Precio del nuevo paquete"
            value={newPack.price}
            onChange={(e) => setNewPack((p) => ({
              ...p, price: e.target.value
            }))}
          />
          <input
            className={input}
            inputMode="decimal"
            placeholder="Costo Bs (opcional)"
            aria-label="Costo del nuevo paquete"
            value={newPack.cost}
            onChange={(e) => setNewPack((p) => ({
              ...p, cost: e.target.value
            }))}
          />
        </div>

        <button
          type="button"
          className={btn}
          disabled={adding || !newPack.label.trim() || !newPack.price.trim()}
          onClick={addPackage}
        >
          {adding ? 'Agregando...' : 'Agregar paquete'}
        </button>

        {addMsg && (
          <p className={
            'text-sm ' +
            (addMsg.ok ? 'text-green-400' : 'text-red-400')
          }>
            {addMsg.t}
          </p>
        )}
      </div>

      {note('removed')}
      <div className="space-y-3">
        {data.prices.map((p) => {
          const d = rows[p.id] || draftOf(p);
          const k = 'p-' + p.id;
          const set = (f, v) => setRows((r) => ({ ...r, [p.id]: { ...d, [f]: v } }));
          return (
            <div key={p.id} className="rounded-xl border border-white/10 bg-zinc-900 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/40">{p.id}</span>
                <button
                  type="button"
                  disabled={busy === k}
                  onClick={() => send(k, { action: 'precio', id: p.id, active: !p.active }, p.id)}
                  className={
                    'rounded-full border px-3 py-1 text-xs font-bold ' +
                    (p.active ? 'border-emerald-400/50 text-emerald-300' : 'border-white/20 text-white/60')
                  }
                >
                  {p.active ? 'Activo' : 'Inactivo'}
                </button>
              </div>
              <input
                className={input + ' mt-2'}
                aria-label="Nombre del paquete"
                value={d.label}
                onChange={(e) => set('label', e.target.value)}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  className={input}
                  inputMode="decimal"
                  placeholder="Precio Bs"
                  aria-label="Precio en Bs"
                  value={d.price}
                  onChange={(e) => set('price', e.target.value)}
                />
                <input
                  className={input}
                  inputMode="decimal"
                  placeholder="Costo Bs"
                  aria-label="Costo en Bs"
                  value={d.cost}
                  onChange={(e) => set('cost', e.target.value)}
                />
              </div>
              <button
                type="button"
                className={btn + ' mt-3'}
                disabled={busy === k}
                onClick={() => send(k, { action: 'precio', id: p.id, label: d.label, price: d.price, cost: d.cost }, p.id)}
              >
                {busy === k ? 'Guardando...' : 'Guardar cambios'}
              </button>

              <button
                type="button"
                disabled={p.active || busy !== ''}
                onClick={() => removePackage(p)}
                className="mt-2 rounded-xl border border-red-400/40 px-4 py-2.5 text-sm font-bold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === k ? 'Procesando...' : 'Eliminar paquete'}
              </button>
              {p.active && (
                <p className="mt-2 text-xs text-white/50">
                  Desactiva el paquete antes de eliminarlo.
                </p>
              )}
              {note(k)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
