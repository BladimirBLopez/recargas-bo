// Cambia aquí tu número de WhatsApp (con código de país, sin +)
export const WHATSAPP = '59169356292';
export const SITE_NAME = 'Recargas BO';

export const games = [
  {
    slug: 'free-fire',
    name: 'Free Fire',
    kind: 'directa',
    popular: true,
    badge: 'promo',
    emoji: '🔥',
    color: 'from-orange-500 to-red-600',
    idLabel: 'ID de jugador',
    packages: [
      { id: 'ff-100', label: '100 💎', price: 8 },
      { id: 'ff-310', label: '310 💎', price: 25 },
      { id: 'ff-520', label: '520 💎', price: 40 },
      { id: 'ff-1060', label: '1060 💎', price: 80 },
      { id: 'ff-pase', label: 'Pase Booyah', price: 45 },
    ],
  },
  {
    slug: 'mobile-legends',
    name: 'Mobile Legends',
    kind: 'directa',
    popular: true,
    emoji: '⚔️',
    color: 'from-blue-500 to-indigo-700',
    idLabel: 'ID de usuario (Zona)',
    packages: [
      { id: 'ml-86', label: '86 💎', price: 12 },
      { id: 'ml-172', label: '172 💎', price: 24 },
      { id: 'ml-343', label: '343 💎', price: 47 },
      { id: 'ml-pase', label: 'Pase Semanal', price: 14 },
    ],
  },
  {
    slug: 'pubg-mobile',
    name: 'PUBG Mobile',
    kind: 'directa',
    popular: true,
    emoji: '🎯',
    color: 'from-yellow-500 to-amber-700',
    idLabel: 'ID de jugador',
    packages: [
      { id: 'pubg-60', label: '60 UC', price: 10 },
      { id: 'pubg-325', label: '325 UC', price: 50 },
      { id: 'pubg-660', label: '660 UC', price: 100 },
    ],
  },
  {
    slug: 'credito-entel',
    name: 'Crédito Entel',
    kind: 'directa',
    emoji: '📱',
    color: 'from-sky-500 to-blue-700',
    idLabel: 'Número de celular',
    packages: [
      { id: 'en-10', label: 'Bs 10', price: 10 },
      { id: 'en-20', label: 'Bs 20', price: 20 },
      { id: 'en-50', label: 'Bs 50', price: 50 },
    ],
  },
  // ---- Próximamente: se muestran con la franja MANTENIMIENTO (sin link). ----
  // Para activarlos: quita `maintenance`, agrega `packages` y la imagen en public/games/<slug>.jpg
  {
    slug: 'blood-strike',
    name: 'Blood Strike',
    emoji: '🩸',
    color: 'from-zinc-600 to-red-900',
    kind: 'directa',
    popular: true,
    maintenance: true,
    idLabel: 'ID de jugador',
    packages: [],
  },
  {
    slug: 'steam-wallet',
    name: 'Steam Wallet',
    emoji: '🎮',
    color: 'from-slate-600 to-slate-900',
    kind: 'tarjeta',
    badge: 'nuevo',
    maintenance: true,
    idLabel: 'Correo',
    packages: [],
  },
  {
    slug: 'razer-gold',
    name: 'Razer Gold',
    emoji: '🪙',
    color: 'from-green-700 to-black',
    kind: 'tarjeta',
    badge: 'nuevo',
    maintenance: true,
    idLabel: 'Correo',
    packages: [],
  },
  {
    slug: 'roblox',
    name: 'Roblox',
    emoji: '🧱',
    color: 'from-zinc-500 to-zinc-800',
    kind: 'tarjeta',
    maintenance: true,
    idLabel: 'Usuario',
    packages: [],
  },
];

export function getGame(slug) {
  return games.find((g) => g.slug === slug);
}
