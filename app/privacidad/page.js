import LegalPage from '@/components/LegalPage';
import { SITE_NAME } from '@/data/games';

export const metadata = { title: `Política de privacidad | ${SITE_NAME}` };

export default function Privacidad() {
  return (
    <LegalPage title="Privacidad">
      <p>En {SITE_NAME} guardamos solo lo necesario para entregar tu recarga.</p>
      <h2>Qué datos guardamos</h2>
      <ul>
        <li>Juego y paquete que compras, monto y código de pedido.</li>
        <li>Tu ID de jugador (y el nombre de usuario si el juego permite verificarlo).</li>
        <li>Fecha y estado del pedido.</li>
      </ul>
      <h2>Qué no pedimos</h2>
      <p>Nunca te pedimos contraseñas, códigos de verificación ni datos de tu tarjeta o banca móvil. El pago se hace en tu propia app del banco.</p>
      <h2>Para qué los usamos</h2>
      <p>Para procesar y entregar tu pedido, resolver problemas de soporte y mostrar ventas recientes con el usuario parcialmente oculto.</p>
      <h2>Con quién los compartimos</h2>
      <p>No vendemos tus datos. Solo se usan los servicios necesarios para operar la tienda (alojamiento, base de datos y avisos internos).</p>
      <h2>Contacto</h2>
      <p>Si quieres que revisemos o eliminemos tus datos de pedidos, escríbenos por WhatsApp.</p>
    </LegalPage>
  );
}
