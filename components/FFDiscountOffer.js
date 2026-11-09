'use client';

import { useEffect, useState } from 'react';
import { useSettings } from '@/components/SettingsProvider';

function bs(value) {
  return 'Bs ' + Number(value).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FFDiscountOffer({
  playerId,
  nickname = '',
}) {
  const { whatsapp } = useSettings();

  const [data, setData] = useState(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);

  const digits = String(whatsapp || '').replace(/\D/g, '');
  const waNumber = digits.length === 8
    ? '591' + digits
    : digits;

  const waReady = /^\d{10,15}$/.test(waNumber);

  useEffect(() => {
    setData(null);
    setSelected('');
    setMessage('');

    try {
      const saved = JSON.parse(
        sessionStorage.getItem('rb_ff_discount_refs') || '[]'
      );

      setReceipt(
        Array.isArray(saved)
          ? saved.find((r) => r.playerId === playerId) || null
          : null
      );
    } catch {
      setReceipt(null);
    }

    if (!/^\d{8,12}$/.test(playerId)) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          '/api/ff-descuento/disponibilidad',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId }),
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const result = await response.json()
          .catch(() => ({}));

        if (!controller.signal.aborted && response.ok) {
          setData({
            ...result,
            playerId,
          });
        }
      } catch {
        // La consulta promocional no afecta
        // a las compras normales.
      }
    }, 650);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [playerId]);

  const current = data?.playerId === playerId
    ? data
    : null;

  const packages = current?.packages || [];

  const chosen = packages.find(
    (p) => p.id === selected && p.eligible
  );

  async function solicitar() {
    if (!chosen || busy || !waReady) return;

    setBusy(true);
    setMessage('');

    const selectedPack = chosen;
    const requestedId = playerId;

    try {
      const response = await fetch(
        '/api/ff-descuento/solicitar',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: requestedId,
            discountPriceId: selectedPack.id,
            nickname,
          }),
        }
      );

      const result = await response.json()
        .catch(() => ({}));

      if (!response.ok || !result.ok) {
        const errors = {
          promocion_inactiva:
            'La promoción ya no está disponible.',
          solicitud_existente:
            'Ya existe una solicitud para este ID y paquete.',
          beneficio_no_disponible:
            'Este ID ya utilizó el beneficio para ese paquete.',
          paquete_no_disponible:
            'Este paquete ya no está disponible.',
          limite:
            'Demasiados intentos. Intenta más tarde.',
        };

        setMessage(
          errors[result.error] ||
          'No se pudo registrar la solicitud.'
        );

        return;
      }

      const ref = {
        requestId: String(result.requestId),
        playerId: requestedId,
        priceId: selectedPack.id,
        label: selectedPack.label,
        expiresAt: result.expiresAt,
      };

      // Solo guardamos la referencia.
      // No guardamos el token privado.
      try {
        const previous = JSON.parse(
          sessionStorage.getItem('rb_ff_discount_refs') || '[]'
        );

        const list = Array.isArray(previous)
          ? previous
          : [];

        const updated = [
          ref,
          ...list.filter(
            (r) => r.requestId !== ref.requestId
          ),
        ].slice(0, 12);

        sessionStorage.setItem(
          'rb_ff_discount_refs',
          JSON.stringify(updated)
        );
      } catch {}

      setReceipt(ref);
      setSelected('');

      setData((previous) => {
        if (previous?.playerId !== requestedId) {
          return previous;
        }

        return {
          ...previous,
          packages: previous.packages.map((p) =>
            p.id === selectedPack.id
              ? { ...p, eligible: false }
              : p
          ),
        };
      });

      setMessage(
        result.fueraHorario
          ? 'Solicitud #' + result.requestId +
            ' registrada fuera del horario de atención. ' +
            'Te responderán cuando vuelvan a atender. ' +
            'No realices ningún pago todavía.'
          : 'Solicitud #' + result.requestId +
            ' registrada. Espera la aprobación antes de pagar.'
      );

      const text = [
        'Hola, solicité un descuento Free Fire en Flakito Gaming.',
        'Solicitud: #' + result.requestId,
        'ID del jugador: ' + requestedId,
        'Paquete: ' + selectedPack.label,
        'Precio solicitado: ' + bs(selectedPack.price),
        ...(result.fueraHorario
          ? [
              'Solicitud fuera del horario de atención.',
              'Espero respuesta cuando vuelvan a atender.',
            ]
          : []),
        'Entiendo que debo esperar aprobación antes de pagar.',
      ].join('\n');

      const whatsappLink =
        'https://wa.me/' + waNumber +
        '?text=' + encodeURIComponent(text);

      setReceipt({ ...ref, whatsappLink });

      try {
        const key = 'rb_ff_discount_refs';
        const saved = JSON.parse(
          sessionStorage.getItem(key) || '[]'
        );

        if (Array.isArray(saved)) {
          const updated = saved.map((entry) =>
            entry?.requestId === ref.requestId
              ? { ...entry, whatsappLink }
              : entry
          );

          sessionStorage.setItem(
            key, JSON.stringify(updated)
          );
        }
      } catch {}

      window.location.assign(whatsappLink);

    } catch {
      setMessage(
        'Sin conexión. Comprueba tu solicitud antes de intentar otra vez.'
      );
    } finally {
      setBusy(false);
    }
  }

  // Promoción apagada: no mostrar ofertas.
  if (current?.enabled !== true) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-yellow-300/30 bg-yellow-300/5 p-4">
      <div>
        <p className="font-display text-xl font-bold text-yellow-300">
          🎁 Descuento especial Free Fire
        </p>

        <p className="mt-1 text-xs text-white/70">
          Elige un paquete y solicita tu descuento.
          La tienda debe aprobarlo antes de que pagues.
        </p>
      </div>

      {receipt?.whatsappLink &&
        receipt.playerId === String(playerId).trim() &&
        receipt.whatsappLink.startsWith('https://wa.me/') &&
        new Date(receipt.expiresAt).getTime() > Date.now() && (
        <a
          href={receipt.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-yellow-300/40 px-4 py-3 text-center font-bold text-yellow-300"
        >
          Abrir WhatsApp nuevamente
        </a>
      )}

      {receipt && (
        <p className="rounded-xl bg-white/5 p-3 text-xs text-white/70">
          Referencia guardada: solicitud #{receipt.requestId}
          {' · '}{receipt.label}
        </p>
      )}

      {packages.length === 0 ? (
        <p className="text-sm text-white/60">
          No hay paquetes promocionales disponibles.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {packages.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={!p.eligible || busy}
              onClick={() => setSelected(p.id)}
              className={
                'rounded-xl border p-3 text-left transition ' +
                (selected === p.id
                  ? 'border-yellow-300 bg-yellow-300/15'
                  : 'border-white/15 bg-zinc-950/80') +
                (!p.eligible
                  ? ' opacity-40'
                  : '')
              }
            >
              <p className="text-sm font-bold text-white">
                {p.label}
              </p>

              <p className="mt-1 font-display text-xl font-bold text-yellow-300">
                {bs(p.price)}
              </p>

              <p className="mt-1 text-xs text-white/50">
                {p.eligible
                  ? selected === p.id
                    ? 'Seleccionado'
                    : 'Disponible'
                  : 'Ya solicitado o utilizado'}
              </p>
            </button>
          ))}
        </div>
      )}

      {!waReady && (
        <p className="text-xs text-red-300">
          WhatsApp de la tienda no configurado correctamente.
        </p>
      )}

      <button
        type="button"
        disabled={!chosen || busy || !waReady}
        onClick={solicitar}
        className="w-full rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 px-4 py-3 font-bold text-black disabled:opacity-40"
      >
        {busy
          ? 'Registrando solicitud...'
          : 'Solicitar descuento por WhatsApp'}
      </button>

      {message && (
        <p role="status" className="text-sm text-white/80">
          {message}
        </p>
      )}

      <p className="text-xs text-white/50">
        Una solicitud por paquete e ID. Sujeto a aprobación
        y disponibilidad. No realices ningún pago todavía.
      </p>
    </div>
  );
}
