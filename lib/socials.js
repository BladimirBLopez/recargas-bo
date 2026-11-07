export const NETWORKS = [
  { key: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.com'], ph: 'https://facebook.com/tu-pagina' },
  { key: 'instagram', label: 'Instagram', hosts: ['instagram.com'], ph: 'https://instagram.com/tu-usuario' },
  { key: 'tiktok', label: 'TikTok', hosts: ['tiktok.com'], ph: 'https://tiktok.com/@tu-usuario' },
  { key: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be'], ph: 'https://youtube.com/@tu-canal' },
  { key: 'telegram', label: 'Telegram', hosts: ['t.me', 'telegram.me'], ph: 'https://t.me/tu-canal' },
];

// '' = vacio, null = invalido, texto = enlace limpio
export function cleanUrl(net, value) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  if (v.length > 200) return null;
  const full = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : 'https://' + v;
  let u;
  try {
    u = new URL(full);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  const okHost = net.hosts.some((h) => host === h || host.endsWith('.' + h));
  if (u.protocol !== 'https:' || u.username || u.password || !okHost) return null;
  return u.href;
}

export function cleanSocials(input) {
  const src = input && typeof input === 'object' ? input : {};
  const clean = {};
  let bad = '';
  for (const n of NETWORKS) {
    const r = cleanUrl(n, src[n.key]);
    if (r === null) {
      if (!bad) bad = n.key;
    } else if (r) {
      clean[n.key] = r;
    }
  }
  return { clean, bad };
}
