// Avisos Telegram para nuevas funciones.
// No modifica los avisos existentes de pagos.

export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chat) {
    return { ok: false, error: 'sin_config' };
  }

  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'texto_invalido' };
  }

  try {
    const res = await fetch(
      'https://api.telegram.org/bot' +
        token + '/sendMessage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chat,
          text: text.slice(0, 3500),
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      console.error('telegram status', res.status);
      return { ok: false, error: 'envio_fallido' };
    }

    const data = await res.json().catch(() => null);

    if (!data?.ok) {
      return { ok: false, error: 'respuesta_invalida' };
    }

    return { ok: true };
  } catch (e) {
    console.error('telegram fetch error');
    return { ok: false, error: 'conexion' };
  }
}
