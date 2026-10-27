import LegalPage from '@/components/LegalPage';
import { SITE_NAME } from '@/data/games';
import { getSettings } from '@/lib/settings';

export const metadata = { title: `Ayuda | ${SITE_NAME}` };

const FAQ = [
  ['¿Cómo compro?', 'Elige tu juego, escribe tu ID, selecciona el paquete y toca COMPRAR AHORA. Luego paga el QR por el monto exacto y envía tu comprobante por WhatsApp.'],
  ['¿Cuánto tarda la entrega?', 'Entregamos en pocos minutos después de confirmar tu pago.'],
  ['¿Necesitan mi contraseña?', 'No. Solo usamos tu ID. Nunca te pediremos tu contraseña.'],
  ['¿Dónde encuentro mi ID?', 'Abre el juego y entra a tu perfil: ahí aparece tu ID. Cópialo para no equivocarte.'],
  ['Pagué y no llega mi recarga', 'Escríbenos por WhatsApp con tu código de pedido y la captura del pago.'],
];

export default async function Ayuda() {
  const { whatsapp } = await getSettings();
  return (
    <LegalPage title="Ayuda">
      <div className="-mx-5 -my-2 divide-y divide-white/10">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group px-5 py-3">
            <summary className="cursor-pointer list-none font-semibold text-white [&::-webkit-details-marker]:hidden">
              {q}
            </summary>
            <p className="pt-2">{a}</p>
          </details>
        ))}
      </div>
      <a
        href={'https://wa.me/' + whatsapp}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl bg-green-500 py-3 text-center font-bold text-white"
      >
        Escribir por WhatsApp
      </a>
    </LegalPage>
  );
}
