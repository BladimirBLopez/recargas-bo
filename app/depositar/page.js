import Soon from '@/components/Soon';
import { MdAccountBalanceWallet } from 'react-icons/md';

export const metadata = { title: 'Depositar saldo' };

export default function Depositar() {
  return (
    <Soon
      icon={MdAccountBalanceWallet}
      title="Depositar"
      soon={['Carga saldo con QR', 'Paga tus recargas con un toque', 'Consulta tu saldo en tu cuenta']}
    >
      <p>Muy pronto podrás cargar saldo y pagar tus recargas con un toque.</p>
      <p>Por ahora paga cada pedido con QR bancario.</p>
    </Soon>
  );
}
