import { WHATSAPP } from '@/data/games';

export default function Soon({ icon, title, children }) {
  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase italic">
        <span className="h-7 w-1.5 rounded-full bg-yellow-300" />
        {title}
      </h2>
      <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 text-center">
        <div className="text-5xl">{icon}</div>
        <div className="mt-3 space-y-2 text-white/70">{children}</div>
        <a
          href={'https://wa.me/' + WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-2xl bg-green-500 px-5 py-3 font-bold text-white"
        >
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
