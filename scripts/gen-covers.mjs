import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Tonos 400..900 de Tailwind v3
const P = {
  orange: ['#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
  red: ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  blue: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  indigo: ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
  yellow: ['#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12'],
  amber: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  sky: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'],
  green: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
  emerald: ['#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  purple: ['#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87'],
  violet: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
  pink: ['#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'],
  rose: ['#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337'],
  cyan: ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
  teal: ['#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a'],
  lime: ['#a3e635', '#84cc16', '#65a30d', '#4d7c0f', '#3f6212', '#365314'],
  fuchsia: ['#e879f9', '#d946ef', '#c026d3', '#a21caf', '#86198f', '#701a75'],
  slate: ['#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'],
  zinc: ['#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b'],
  gray: ['#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'],
};

function hex(token) {
  const m = /^([a-z]+)-(\d{3})$/.exec(token || '');
  if (!m || !P[m[1]]) return '#f97316';
  const i = Math.min(5, Math.max(0, (Number(m[2]) - 400) / 100));
  return P[m[1]][i];
}

function colors(cls) {
  const from = /from-([a-z]+-\d{3})/.exec(cls || '');
  const to = /to-([a-z]+-\d{3})/.exec(cls || '');
  return [hex(from && from[1]), hex(to && to[1])];
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cover(g) {
  const [a, b] = colors(g.color);
  const e = esc(g.emoji || '🎮');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
<radialGradient id="r" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="24" height="48" fill="#fff" fill-opacity=".06"/></pattern>
</defs>
<rect width="600" height="800" fill="url(#g)"/>
<rect width="600" height="800" fill="url(#p)"/>
<circle cx="520" cy="90" r="150" fill="#fff" fill-opacity=".08"/>
<circle cx="60" cy="600" r="130" fill="#000" fill-opacity=".14"/>
<circle cx="300" cy="330" r="270" fill="url(#r)"/>
<text x="306" y="356" font-size="270" text-anchor="middle" dominant-baseline="middle" fill="#000" fill-opacity=".25">${e}</text>
<text x="300" y="344" font-size="270" text-anchor="middle" dominant-baseline="middle">${e}</text>
</svg>
`;
}

function wrap(text, max) {
  const lines = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

const BANNERS = [
  { a: '#f97316', b: '#7c2d12', emoji: '⚡', kicker: 'Tus recargas rápidas', title: '¡Diamantes y pases!', cta: '¡Compra ya!' },
  { a: '#2563eb', b: '#1e1b4b', emoji: '📲', kicker: 'Paga con QR', title: 'Tu banco, sin complicarte', cta: 'Recarga aquí' },
  { a: '#16a34a', b: '#052e16', emoji: '💬', kicker: 'Soporte real', title: 'Te atendemos por WhatsApp', cta: 'Escríbenos' },
];

function banner(s) {
  const lines = wrap(s.title.toUpperCase(), 14);
  const font = "font-family=\"'Arial Black', Impact, Arial, sans-serif\" font-weight=\"900\" font-style=\"italic\"";
  const tspans = lines
    .map((l, i) => `<text x="80" y="${270 + i * 105}" font-size="96" fill="#fff" ${font}>${esc(l)}</text>`)
    .join('\n');
  const ctaY = 270 + (lines.length - 1) * 105 + 55;
  const ctaW = s.cta.length * 26 + 70;
  const e = esc(s.emoji);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.a}"/><stop offset="1" stop-color="${s.b}"/></linearGradient>
<radialGradient id="r" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<pattern id="p" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="28" height="56" fill="#fff" fill-opacity=".05"/></pattern>
</defs>
<rect width="1600" height="600" fill="url(#g)"/>
<rect width="1600" height="600" fill="url(#p)"/>
<circle cx="1330" cy="300" r="330" fill="url(#r)"/>
<circle cx="1500" cy="80" r="170" fill="#fff" fill-opacity=".07"/>
<text x="80" y="165" font-size="42" fill="#fff" fill-opacity=".85" ${font}>${esc(s.kicker.toUpperCase())}</text>
${tspans}
<g transform="skewX(-12)"><rect x="110" y="${ctaY}" width="${ctaW}" height="76" rx="10" fill="#fff"/></g>
<text x="${80 + 30}" y="${ctaY + 52}" font-size="40" fill="#111" ${font}>${esc(s.cta.toUpperCase())}</text>
<text x="1340" y="340" font-size="340" text-anchor="middle" dominant-baseline="middle" fill="#000" fill-opacity=".25">${e}</text>
<text x="1330" y="326" font-size="340" text-anchor="middle" dominant-baseline="middle">${e}</text>
</svg>
`;
}

// data/games.js usa ESM; se importa desde una copia temporal .mjs
const tmp = path.join('scripts', '.games-tmp.mjs');
fs.copyFileSync('data/games.js', tmp);
const { games } = await import(pathToFileURL(path.resolve(tmp)).href);
fs.unlinkSync(tmp);

fs.mkdirSync('public/games', { recursive: true });
fs.mkdirSync('public/banners', { recursive: true });

for (const g of games) {
  fs.writeFileSync(path.join('public/games', g.slug + '.svg'), cover(g));
}
BANNERS.forEach((s, i) => {
  fs.writeFileSync(path.join('public/banners', i + 1 + '.svg'), banner(s));
});
console.log('Portadas: ' + games.length + ' | Banners: ' + BANNERS.length);
