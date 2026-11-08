'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import FFDiscountConfig from '@/components/admin/FFDiscountConfig';

const card =
  'rounded-2xl border border-white/10 bg-zinc-950/80 p-4';

const btn =
  'rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 px-4 py-3 text-sm font-bold text-black disabled:opacity-40';

const mini =
  'rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40';

const LABEL = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobada',
  rechazado: 'No califica',
  vencida: 'Vencida',
};

const COLOR = {
  pendiente: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-300',
  aprobado: 'border-green-400/30 bg-green-400/10 text-green-300',
  rechazado: 'border-red-400/30 bg-red-400/10 text-red-300',
  vencida: 'border-white/20 bg-white/5 text-white/50',
};

function dinero(valor) {
  if (valor === null || valor === undefined) {
    return 'Sin precio';
  }

  return 'Bs ' + Number(valor).toLocaleString(
    'es-BO',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function fecha(valor) {
  if (!valor) return '—';

  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';

  return d.toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DescuentoFreeFire() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        '/api/admin/ff-descuento',
        { cache: 'no-store' }
      );

      const json = await res.json()
        .catch(() => ({}));

      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Sesión administrativa vencida.'
            : 'Error al cargar solicitudes.'
        );
        return;
      }

      setData(json);
      setError('');
    } catch {
      setError('Sin conexión. Reintenta.');
    }
  }, []);

  useEffect(() => {
    load();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [load]);

  async function decidir(solicitud, action) {
    const aprobar = action === 'aprobar';

    const pregunta = aprobar
      ? '¿Aprobar solicitud #' + solicitud.id +
        '? Esto NO crea un pedido ni confirma un pago.'
      : '¿Marcar solicitud #' + solicitud.id +
        ' como NO CALIFICA?';

    if (!window.confirm(pregunta)) return;

    setBusy(solicitud.id);
    setMsg('');
    setError('');

    try {
      const res = await fetch(
        '/api/admin/ff-descuento',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: solicitud.id,
            action,
          }),
        }
      );

      const json = await res.json()
        .catch(() => ({}));

      if (res.ok && json.ok) {
        setMsg(
          aprobar
            ? 'Solicitud aprobada. Aún no se generó pedido.'
            : 'Solicitud marcada como no califica.'
        );
      } else {
        setError(
          json.error === 'solicitud_no_disponible'
            ? 'La solicitud venció, cambió o ya fue procesada.'
            : 'No se pudo guardar la decisión.'
        );
      }
    } catch {
      setError('Sin conexión al guardar.');
    } finally {
      setBusy('');
      await load();
    }
  }

  async function crearPedido(solicitud) {
    if (
      !window.confirm(
        '¿Crear pedido manual para solicitud #' +
        solicitud.id +
        '? No confirma ningún pago.'
      )
    ) return;

    setBusy(solicitud.id);
    setMsg('');
    setError('');

    try {
      const res = await fetch(
        '/api/admin/ff-descuento/crear-pedido',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: solicitud.id,
          }),
        }
      );

      const json = await res.json()
        .catch(() => ({}));

      if (res.ok && json.ok) {
        setMsg(
          'Pedido ' + json.code +
          ' creado por ' + dinero(json.price) +
          '. PAGO MANUAL PENDIENTE. No usar QR de Takenos.'
        );
      } else {
        const errores = {
          cobro_manual_no_configurado:
            'El cobro manual independiente no está habilitado.',
          solicitud_no_disponible:
            'La solicitud venció o ya tiene un pedido.',
          codigo_repetido:
            'No se pudo generar el código. Reintenta.',
        };

        setError(
          errores[json.error] ||
          'No se pudo crear el pedido.'
        );
      }
    } catch {
      setError('Sin conexión al crear el pedido.');
    } finally {
      setBusy('');
      await load();
    }
  }

  async function copiar(id) {
    try {
      await navigator.clipboard.writeText(id);
      setMsg('ID copiado: ' + id);
    } catch {
      setMsg('Mantén pulsado el ID para copiarlo.');
    }
  }

  const counts = data?.counts || {};
  const activa = data?.config?.enabled === true;
  const manualReady =
    data?.config?.manualPaymentsReady === true;

  const solicitudes = [
    ...(data?.requests || []),
  ].sort((a, b) => {
    const x = a.estado_visible === 'pendiente' ? 0 : 1;
    const y = b.estado_visible === 'pendiente' ? 0 : 1;
    return x - y;
  });

  return (
    <div className="space-y-4 pb-24">
      <div className={card + ' space-y-2'}>
        <h1 className="font-display text-2xl font-bold">
          Descuento Free Fire
        </h1>

        <p className="text-sm text-white/60">
          Revisa las solicitudes y decide quién califica.
          Los pedidos y pagos se gestionarán por separado.
        </p>

        <p className={
          activa
            ? 'text-sm font-semibold text-green-300'
            : 'text-sm font-semibold text-yellow-300'
        }>
          {activa
            ? 'Promoción activada'
            : 'Promoción desactivada'}
        </p>
      </div>

      <FFDiscountConfig />

      <div className="grid grid-cols-2 gap-2">
        {[
          ['Pendientes', counts.pendientes],
          ['Aprobadas', counts.aprobadas],
          ['No califican', counts.rechazadas],
          ['Vencidas', counts.vencidas],
        ].map(([nombre, valor]) => (
          <div key={nombre} className={card}>
            <p className="text-xs text-white/50">
              {nombre}
            </p>
            <p className="font-display text-3xl font-bold">
              {valor ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {!activa && (
        <p className="rounded-xl border border-yellow-300/20 bg-yellow-300/5 p-3 text-xs text-yellow-200">
          Las aprobaciones están bloqueadas mientras
          la promoción permanezca apagada.
        </p>
      )}

      {!manualReady && (
        <p className="rounded-xl border border-yellow-300/20 bg-yellow-300/5 p-3 text-xs text-yellow-200">
          Creación de pedidos manuales bloqueada.
          Falta habilitar un medio de cobro separado de Takenos.
        </p>
      )}

      <button
        type="button"
        className={mini + ' w-full'}
        onClick={load}
      >
        Actualizar solicitudes
      </button>

      {msg && (
        <p className="rounded-xl bg-green-400/10 p-3 text-sm text-green-200">
          {msg}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {!data && !error && (
        <div className="skeleton h-32 rounded-2xl" />
      )}

      {data && solicitudes.length === 0 && (
        <div className={card + ' text-center text-sm text-white/50'}>
          Todavía no hay solicitudes.
        </div>
      )}

      {solicitudes.map((r) => {
        const estado = r.estado_visible || r.status;
        const pendiente = estado === 'pendiente';

        const aprobar =
          pendiente &&
          activa &&
          r.package_active === true &&
          Number(r.price) > 0;

        return (
          <div
            key={r.id}
            className={card + ' space-y-3'}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-white/50">
                Solicitud #{r.id}
              </p>

              <span className={
                'rounded-full border px-3 py-1 text-xs font-bold ' +
                (COLOR[estado] || COLOR.vencida)
              }>
                {LABEL[estado] || estado}
              </span>
            </div>

            <div>
              <p className="text-xs text-white/50">
                ID del jugador
              </p>

              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 select-all break-all font-mono text-lg font-bold">
                  {r.player_id}
                </p>

                <button
                  type="button"
                  className={mini}
                  onClick={() => copiar(r.player_id)}
                >
                  Copiar
                </button>
              </div>

              <p className="text-xs text-white/50">
                Nombre indicado (sin verificar):{' '}
                {r.nickname || 'No indicado'}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <p className="font-semibold">
                {r.package_label || r.discount_price_id}
              </p>

              <p className="font-display text-2xl font-bold text-yellow-300">
                {dinero(r.price)}
              </p>

              {r.approved_price !== null &&
                r.approved_price !== undefined && (
                <p className="text-xs text-green-300">
                  Precio autorizado: {dinero(r.approved_price)}
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs text-white/50">
              <p>Solicitada: {fecha(r.created_at)}</p>
              <p>Vence: {fecha(r.expires_at)}</p>

              {r.decided_at && (
                <p>Decisión: {fecha(r.decided_at)}</p>
              )}

              {r.order_id && (
                <p>
                  Pedido: {r.order_code || '#' + r.order_id}
                  {' · '}
                  {r.order_status || 'Estado no disponible'}
                  {' · '}
                  {r.order_payment_mode === 'MANUAL'
                    ? 'Pago manual'
                    : 'Verificar tipo de pago'}
                </p>
              )}
            </div>

            {estado === 'aprobado' &&
              !r.order_id &&
              manualReady && (
              <button
                type="button"
                className={btn + ' w-full'}
                disabled={
                  !activa ||
                  busy !== '' ||
                  !(Number(r.approved_price) > 0) ||
                  !r.expires_at ||
                  !(new Date(r.expires_at).getTime() > Date.now())
                }
                onClick={() => crearPedido(r)}
              >
                {busy === r.id
                  ? 'Creando pedido...'
                  : 'Crear pedido manual'}
              </button>
            )}

            {pendiente && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={btn}
                  disabled={!aprobar || busy !== ''}
                  onClick={() => decidir(r, 'aprobar')}
                >
                  {busy === r.id
                    ? 'Guardando...'
                    : 'Aprobar'}
                </button>

                <button
                  type="button"
                  className={mini}
                  disabled={busy !== ''}
                  onClick={() => decidir(r, 'rechazar')}
                >
                  No califica
                </button>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-center text-xs text-white/40">
        Atención manual · Horario Bolivia
        {' · '}La aprobación no confirma pagos.
      </p>
    </div>
  );
}
