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
  const [tick, setTick] = useState(0);

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
      setTick((n) => n + 1);
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
      <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-yellow-300/40 bg-zinc-950/95 p-3 shadow-[0_8px_30px_-8px_rgb(var(--accent)/0.6)] backdrop-blur">
        <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-300 to-orange-500" />
        <div className="flex items-center gap-3 pl-1.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-yellow-300 to-orange-500 text-black shadow-[0_0_14px_rgb(var(--accent)/0.6)]">
            <MdFlashOn size={22} />
          </span>
          <div className="min-w-0 flex-1 text-xs leading-tight">
            <div className="flex items-center gap-1.5 truncate text-white/60">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="truncate">
                {cur.user} · {ago(cur.ts)}
              </span>
            </div>
            <div className="truncate font-bold">
              compró: {cur.pkg} - {cur.game}
            </div>
            <div className="font-display text-sm font-bold text-green-400">Bs {cur.price}</div>
          </div>
          <button aria-label="Cerrar" onClick={() => setHidden(true)} className="self-start text-white/40">
            <MdClose size={16} />
          </button>
        </div>
        <span
          key={tick}
          className="absolute bottom-0 left-0 h-0.5 bg-yellow-300/70"
          style={{ width: show ? '0%' : '100%', transition: show ? 'width 5s linear' : 'none' }}
        />
      </div>
    </div>
  );
}
