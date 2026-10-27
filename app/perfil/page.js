import Soon from '@/components/Soon';
import { MdPerson } from 'react-icons/md';

export const metadata = { title: 'Perfil' };

export default function Perfil() {
  return (
    <Soon
      icon={MdPerson}
      title="Perfil"
      soon={['Crea tu cuenta con correo y PIN', 'Historial de todas tus compras', 'Guarda tus IDs de juego']}
    >
      <p>Muy pronto podrás crear tu cuenta para guardar tu historial y tus IDs.</p>
      <p>Por ahora puedes comprar sin registrarte.</p>
    </Soon>
  );
}
