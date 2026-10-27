'use client';
import { MdFlashOn, MdFileDownload, MdCheckCircle } from 'react-icons/md';
import { useInstall } from '@/components/useInstall';
import { SITE_NAME } from '@/data/games';

export default function InstallCard() {
  const { canInstall, installed, ios, install } = useInstall();

  return (
    <div className="mx-auto max-w-md space-y-5 pb-28 text-center">
      <div className="rounded-3xl border border-yellow-300/30 bg-zinc-950/80 p-6 shadow-[0_0_40px_-12px_rgb(var(--accent)/0.6)]">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-yellow-300 to-red-500 text-black shadow-lg">
          <MdFlashOn size={48} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase italic">Instala {SITE_NAME}</h1>
        <p className="mt-2 text-sm text-white/70">
          Ten la tienda en tu pantalla de inicio: abre más rápido, sin barra del navegador y como una app.
        </p>

        {installed ? (
          <p className="mt-5 flex items-center justify-center gap-2 font-semibold text-green-400">
            <MdCheckCircle size={22} /> Ya tienes {SITE_NAME} instalada
          </p>
        ) : canInstall ? (
          <button
            onClick={install}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-3.5 font-display text-lg font-extrabold uppercase text-black shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.8)] transition active:scale-95"
          >
            <MdFileDownload size={22} /> Instalar {SITE_NAME}
          </button>
        ) : (
          <div className="mt-5 space-y-2 rounded-2xl bg-white/5 p-4 text-left text-sm text-white/80">
            {ios ? (
              <>
                <p className="font-semibold text-white">En iPhone (Safari):</p>
                <p>1. Toca el botón Compartir (cuadro con flecha).</p>
                <p>2. Elige &quot;Agregar a pantalla de inicio&quot;.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-white">En Android (Chrome):</p>
                <p>1. Toca el menú ⋮ de arriba a la derecha.</p>
                <p>2. Elige &quot;Instalar app&quot; o &quot;Agregar a pantalla principal&quot;.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
