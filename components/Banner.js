'use client';
import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { QrCode, Zap, Headset } from 'lucide-react';

const slides = [
  { icon: QrCode, kicker: 'Recargas en Bolivia', title: 'Paga con QR y recibe tu recarga', bg: 'from-yellow-300 via-amber-400 to-orange-500', dark: true },
  { icon: Zap, kicker: 'Rápido y fácil', title: 'Elige tu juego, tu paquete y listo', bg: 'from-fuchsia-600 via-purple-700 to-indigo-800', dark: false },
  { icon: Headset, kicker: 'Soporte', title: 'Te atendemos por WhatsApp', bg: 'from-emerald-500 via-teal-600 to-cyan-700', dark: false },
];

export default function Banner() {
  const [ref, api] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
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
      <div className="overflow-hidden rounded-3xl" ref={ref}>
        <div className="flex">
          {slides.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="min-w-0 flex-[0_0_100%] pr-0">
                <div
                  className={`bg-gradient-to-r ${s.bg} ${s.dark ? 'text-black' : 'text-white'} h-44 sm:h-56 p-6 sm:p-10 flex items-center justify-between gap-4`}
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wide opacity-80">{s.kicker}</p>
                    <h1 className="text-2xl sm:text-4xl font-black italic leading-tight mt-1">{s.title}</h1>
                  </div>
                  <Icon className="shrink-0 opacity-30" size={84} strokeWidth={1.5} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Banner ${i + 1}`}
            onClick={() => api && api.scrollTo(i)}
            className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-yellow-300' : 'w-2 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}
