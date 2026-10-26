'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MdFlashOn, MdClose } from 'react-icons/md';

function ago(iso) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export default function SalesToast() {
  const path = usePathname() || '/';
  const [list, setList] = useState([]);
  const [cur, setCur] = useState(null);
  const [show, setShow] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch('/api/ventas-recientes')
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d.ventas) ? d.ventas : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!list.length || hidden) return;
    let i = 0;
    let t1;
    let t2;
    const cycle = () => {
      setCur(list[i % list.length]);
      setShow(true);
      t1 = setTimeout(() => setShow(false), 5000);
      t2 = setTimeout(() => {
        i += 1;
        cycle();
      }, 14000);
    };
    const first = setTimeout(cycle, 4000);
    return () => {
      clearTimeout(first);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [list, hidden]);

  if (path.startsWith('/admin') || hidden || !cur) return null;

  return (
    <div
      className={
        'pointer-events-none fixed right-3 top-[72px] z-20 w-[min(88vw,300px)] transition-all duration-500 ' +
        (show ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0')
      }
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-zinc-950/95 p-3 shadow-lg backdrop-blur">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-300 text-black">
          <MdFlashOn size={22} />
        </span>
        <div className="min-w-0 flex-1 text-xs leading-tight">
          <div className="truncate text-white/60">
            {cur.user} · {ago(cur.ts)}
          </div>
          <div className="truncate font-bold">
            compró: {cur.pkg} - {cur.game}
          </div>
          <div className="font-bold text-green-400">Bs {cur.price}</div>
        </div>
        <button aria-label="Cerrar" onClick={() => setHidden(true)} className="self-start text-white/40">
          <MdClose size={16} />
        </button>
      </div>
    </div>
  );
}
