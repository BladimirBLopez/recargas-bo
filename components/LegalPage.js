import Link from 'next/link';
import { MdChevronRight } from 'react-icons/md';

export default function LegalPage({ title, children }) {
  return (
    <article className="mx-auto max-w-2xl space-y-5 pb-28">
      <nav className="flex items-center gap-1 text-sm text-white/60">
        <Link href="/" className="hover:text-white">Inicio</Link>
        <MdChevronRight size={18} />
        <span className="text-white">{title}</span>
      </nav>
      <h1 className="font-display text-4xl font-extrabold uppercase italic leading-none">
        <span className="mr-3 inline-block h-7 w-1.5 rounded-full bg-yellow-300 align-middle" />
        {title}
      </h1>
      <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/80 p-5 text-sm leading-relaxed text-white/75 [&_b]:text-white [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-yellow-300 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
