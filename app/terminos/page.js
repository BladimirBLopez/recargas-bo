import LegalPage from '@/components/LegalPage';
import { SITE_NAME } from '@/data/games';

export const metadata = { title: `Términos y condiciones | ${SITE_NAME}` };

export default function Terminos() {
  return (
    <LegalPage title="Términos y condiciones">
      <p>Al comprar en {SITE_NAME} aceptas estas condiciones. Vendemos recargas y códigos digitales para juegos y servicios en Bolivia.</p>
      <h2>Tu pedido</h2>
      <ul>
        <li>Debes escribir correctamente tu ID o número. La recarga se entrega a la cuenta que indiques.</li>
        <li>Pagas el monto exacto que muestra tu pedido, mediante el QR bancario.</li>
        <li>Tu pedido se procesa cuando confirmamos tu pago.</li>
      </ul>
      <h2>Entrega</h2>
      <p>Entregamos en pocos minutos después de confirmar el pago. En horas de mucha demanda puede tardar un poco más. Si pasa mucho tiempo, escríbenos por WhatsApp con tu código de pedido.</p>
      <h2>Errores de ID</h2>
      <p>Si la recarga se envió a un ID mal escrito por el cliente, no podemos revertirla, porque ya fue acreditada en esa cuenta.</p>
      <h2>Precios</h2>
      <p>Los precios están en bolivianos (Bs) y pueden cambiar sin previo aviso. El precio válido es el que ves al crear tu pedido.</p>
      <h2>Uso del servicio</h2>
      <p>No usamos tu contraseña ni la pedimos nunca. Podemos cancelar pedidos sospechosos o con pagos que no podamos confirmar.</p>
    </LegalPage>
  );
}
