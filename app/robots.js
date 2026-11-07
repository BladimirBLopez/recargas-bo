const SITE_URL = 'https://flakitogaming.store';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/perfil', '/depositar', '/historial'] }],
    sitemap: SITE_URL + '/sitemap.xml',
  };
}
