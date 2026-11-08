'use client';
import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { MdQrCode2 as QrCode, MdFlashOn as Zap, MdHeadsetMic as Headset } from 'react-icons/md';

// Ejemplos: se usan solo si no hay banners cargados en /admin/banners.
const defaults = [
  { img: '/banners/1.jpg', icon: Zap, kicker: 'Tus recargas rápidas', title: '¡Diamantes y pases!', cta: '¡Compra ya!' },
  { img: '/banners/2.jpg', icon: QrCode, kicker: 'Paga con QR', title: 'Tu banco, sin complicarte', cta: 'Recarga aquí' },
  { img: '/banners/3.jpg', icon: Headset, kicker: 'Soporte real', title: 'Te atendemos por WhatsApp', cta: 'Escríbenos' },
];

function Slide({ s }) {
  const [fail, setFail] = useState(false);
  const [svg, setSvg] = useState(false);
  const Icon = s.icon || Zap;
  const local = s.img.startsWith('/');
  return (
    <div className="glow-pulse relative aspect-[8/3] overflow-hidden rounded-3xl border-2 border-yellow-300 bg-black">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        <span className="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-tl-lg border-l-2 border-t-2 border-yellow-300/90" />
        <span className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-tr-lg border-r-2 border-t-2 border-yellow-300/90" />
        <span className="absolute bottom-1.5 left-1.5 h-3.5 w-3.5 rounded-bl-lg border-b-2 border-l-2 border-yellow-300/90" />
        <span className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-br-lg border-b-2 border-r-2 border-yellow-300/90" />
      </span>
      {!fail && (
        <img
          src={svg ? s.img.replace(/\.jpg$/, '.svg') : s.img}
          alt={s.title || 'Promoción'}
          onError={() => (svg || !local ? setFail(true) : setSvg(true))}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {fail && (
        <div className="absolute inset-0 flex items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 via-orange-950 to-black p-4 sm:p-8">
          <div className="min-w-0">
            <p className="font-display text-xs font-bold uppercase italic tracking-wide text-white/80 sm:text-base">
              {s.kicker}
            </p>
            <p className="font-display text-2xl font-extrabold uppercase italic leading-none sm:text-5xl">
              {s.title}
            </p>
            {s.cta && (
              <span className="mt-2 inline-block -skew-x-12 rounded bg-white px-2.5 py-0.5 font-display text-xs font-bold uppercase italic text-black">
                {s.cta}
              </span>
            )}
          </div>
          <Icon className="shrink-0 text-yellow-300/40" size={56} />
        </div>
      )}
    </div>
  );
}

export default function Banner() {
  const [slides, setSlides] = useState(null);
  const [ref, api] = useEmblaCarousel({ loop: true, align: 'center' }, [Autoplay({ delay: 4000 })]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch('/api/banners', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list = Array.isArray(d.banners) ? d.banners : [];
        setSlides(list.length ? list.map((b) => ({ img: b.url, title: 'Promoción' })) : defaults);
      })
      .catch(() => alive && setSlides(defaults));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIdx(api.selectedScrollSnap());
    api.on('select', onSelect);
    onSelect();
    return () => api.off('select', onSelect);
  }, [api]);

  if (!slides) return <div className="aspect-[8/3] w-full animate-pulse rounded-3xl bg-white/5" />;

  return (
    <div>
      <div className="-mx-4 overflow-hidden" ref={ref}>
        <div className="flex">
          {slides.map((s, i) => (
            <div key={i} className="min-w-0 flex-[0_0_88%] pl-3 first:pl-0 sm:flex-[0_0_70%]">
              <Slide s={s} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Banner ${i + 1}`}
            onClick={() => api && api.scrollTo(i)}
            className={`h-1.5 -skew-x-12 rounded-sm transition-all ${i === idx ? 'w-12 bg-yellow-300 shadow-[0_0_10px_rgb(var(--accent)/0.8)]' : 'w-10 bg-white/25'}`}
          />
        ))}
      </div>
    </div>
  );
}
