import LegalPage from '@/components/LegalPage';
import { SITE_NAME } from '@/data/games';

export const metadata = { title: `Garantías y reembolsos | ${SITE_NAME}` };

export default function Garantias() {
  return (
    <LegalPage title="Garantías">
      <p>Queremos que tu compra salga bien. Esto es lo que cubrimos.</p>
      <h2>Te ayudamos si</h2>
      <ul>
        <li>Pagaste y tu recarga no llegó dentro del tiempo esperado.</li>
        <li>Pagaste y tu pedido aparece cancelado o expirado.</li>
        <li>Recibiste un paquete distinto al que compraste.</li>
      </ul>
      <h2>Cómo reclamar</h2>
      <p>Escríbenos por WhatsApp con tu <b>código de pedido</b> y la captura de tu pago. Revisamos el caso y te damos la entrega o la devolución que corresponda.</p>
      <h2>No cubrimos</h2>
      <ul>
        <li>Recargas enviadas a un ID mal escrito por el cliente.</li>
        <li>Cuentas suspendidas o con restricciones del propio juego.</li>
      </ul>
    </LegalPage>
  );
}
