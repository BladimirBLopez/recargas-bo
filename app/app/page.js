import Soon from '@/components/Soon';

export const metadata = { title: 'Instalar app' };

export default function InstalarApp() {
  return (
    <Soon icon="📲" title="Instalar app">
      <p>Agrega la tienda a tu pantalla de inicio y ábrela como una app.</p>
      <p>
        En Chrome: toca los <b>tres puntos ⋮</b> y elige <b>“Agregar a la pantalla de inicio”</b>.
      </p>
    </Soon>
  );
}
