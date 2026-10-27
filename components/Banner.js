'use client';
import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { MdQrCode2 as QrCode, MdFlashOn as Zap, MdHeadsetMic as Headset } from 'react-icons/md';

// Para usar tus propias imágenes: pon los archivos en public/banners/ (1.jpg, 2.jpg, 3.jpg).
// Si la imagen no existe se muestra el diseño de texto.
const slides = [
  { img: '/banners/1.jpg', icon: Zap, kicker: 'Tus recargas rápidas', title: '¡Diamantes y pases!', cta: '¡Compra ya!' },
  { img: '/banners/2.jpg', icon: QrCode, kicker: 'Paga con QR', title: 'Tu banco, sin complicarte', cta: 'Recarga aquí' },
  { img: '/banners/3.jpg', icon: Headset, kicker: 'Soporte real', title: 'Te atendemos por WhatsApp', cta: 'Escríbenos' },
];

function Slide({ s }) {
  const [fail, setFail] = useState(false);
  const [svg, setSvg] = useState(false);
  const Icon = s.icon;
  return (
    <div className="glow-pulse relative aspect-[8/3] overflow-hidden rounded-3xl border-2 border-yellow-300 bg-black">
      {!fail && (
        <img
          src={svg ? s.img.replace('.jpg', '.svg') : s.img}
          alt={s.title}
          onError={() => (svg ? setFail(true) : setSvg(true))}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {fail && (
        <div className="absolute inset-0 flex items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 via-orange-950 to-black p-4 sm:p-8">
          <div className="min-w-0">
            <p className="font-display text-xs font-bold uppercase italic tracking-wide text-white/80 sm:text-base">
              {s.kicker}
            </p>
            <h1 className="font-display text-2xl font-extrabold uppercase italic leading-none sm:text-5xl">
              {s.title}
            </h1>
            <span className="mt-2 inline-block -skew-x-12 rounded bg-white px-2.5 py-0.5 font-display text-xs font-bold uppercase italic text-black">
              {s.cta}
            </span>
          </div>
          <Icon className="shrink-0 text-yellow-300/40" size={56} />
        </div>
      )}
    </div>
  );
}

export default function Banner() {
  const [ref, api] = useEmblaCarousel({ loop: true, align: 'center' }, [Autoplay({ delay: 4000 })]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIdx(api.selectedScrollSnap());
    api.on('select', onSelect);
    onSelect();
    return () => api.off('select', onSelect);
  }, [api]);

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
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-12 bg-yellow-300' : 'w-10 bg-white/25'}`}
          />
        ))}
      </div>
    </div>
  );
}
