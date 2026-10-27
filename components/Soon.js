import { WHATSAPP } from '@/data/games';
import { FaWhatsapp } from 'react-icons/fa';

export default function Soon({ icon: Icon, title, soon = [], children }) {
  return (
    <div className="space-y-6 pb-28">
      <h2 className="flex items-center gap-3 font-display text-3xl font-extrabold uppercase italic">
        <span className="h-7 w-1.5 -skew-x-12 rounded-sm bg-yellow-300 shadow-[0_0_10px_rgb(var(--accent)/0.8)]" />
        {title}
      </h2>
      <div className="rounded-3xl border border-yellow-300/25 bg-zinc-950/80 p-6 text-center shadow-[0_0_40px_-14px_rgb(var(--accent)/0.6)]">
        <span className="clip-corner mx-auto grid h-20 w-20 place-items-center bg-gradient-to-br from-yellow-300 to-red-500 text-black shadow-lg">
          {Icon && <Icon size={44} />}
        </span>
        <span className="mt-4 inline-block rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-0.5 font-display text-xs font-bold uppercase tracking-wide text-yellow-300">
          Muy pronto
        </span>
        <div className="mt-3 space-y-2 text-white/70">{children}</div>
        {soon.length > 0 && (
          <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm">
            {soon.map((t) => (
              <li key={t} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-white/80">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300 shadow-[0_0_8px_rgb(var(--accent))]" />
                {t}
              </li>
            ))}
          </ul>
        )}
        <a
          href={'https://wa.me/' + WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-green-500 px-5 py-3 font-bold text-white shadow-lg shadow-green-500/20 transition active:scale-95"
        >
          <FaWhatsapp size={20} /> Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
