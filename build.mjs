// Build statis untuk Vercel: src/ -> dist/, isi meta SEO, buat manifest, robots.txt, sitemap.xml.
// Jalankan: node build.mjs   (Vercel menjalankannya otomatis lewat vercel.json)
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src'), DIST = join(ROOT, 'dist');
const cfg = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));

/* ---------- Alamat situs ----------
   Urutan: SITE_URL (isi sendiri bila memakai domain custom) → domain produksi Vercel → URL deployment → localhost. */
const env = process.env;
const tanpaGaris = s => String(s).replace(/\/+$/, '');
const SITE_URL = tanpaGaris(
    env.SITE_URL ? env.SITE_URL
        : env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + env.VERCEL_PROJECT_PRODUCTION_URL
        : env.VERCEL_URL ? 'https://' + env.VERCEL_URL
        : 'http://localhost:3000'
);
const APP_URL = env.APPS_SCRIPT_URL || cfg.appsScriptUrl;
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(APP_URL)) {
    throw new Error('appsScriptUrl tidak valid. Harus berbentuk https://script.google.com/macros/s/<ID>/exec — sekarang: ' + APP_URL);
}
// Preview deployment Vercel tidak boleh terindeks (konten ganda dengan produksi)
const INDEX = cfg.indexable !== false && (!env.VERCEL_ENV || env.VERCEL_ENV === 'production');

/* ---------- Salin src -> dist ---------- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(SRC, DIST, { recursive: true });
copyFileSync(join(SRC, 'assets/favicon.ico'), join(DIST, 'favicon.ico')); // browser meminta /favicon.ico di root

const hash = buf => createHash('sha256').update(buf).digest('hex').slice(0, 10);
const ogBuf = readFileSync(join(SRC, 'assets/og-image.jpg'));
const OG_IMAGE = `${SITE_URL}/assets/og-image.jpg?v=${hash(ogBuf)}`; // versi berubah bila gambar diganti → cache WhatsApp ikut baru
const BUILD_ID = hash(readFileSync(join(SRC, 'app.js')));
const logoBuf = readFileSync(join(SRC, 'assets/logo.png'));
const LOGO_W = logoBuf.readUInt32BE(16), LOGO_H = logoBuf.readUInt32BE(20); // ukuran dari header PNG
const TANGGAL = new Date().toISOString().slice(0, 10);

/* ---------- Data terstruktur (JSON-LD) ---------- */
const org = {
    '@type': 'Organization', '@id': `${SITE_URL}/#organisasi`, name: cfg.company, url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/logo.png`, width: LOGO_W, height: LOGO_H },
    address: { '@type': 'PostalAddress', addressLocality: cfg.locality, addressRegion: cfg.region, addressCountry: cfg.country }
};
const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        org,
        { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: cfg.name, description: cfg.description,
            inLanguage: cfg.lang, publisher: { '@id': org['@id'] } },
        { '@type': 'WebApplication', '@id': `${SITE_URL}/#aplikasi`, name: cfg.title, url: `${SITE_URL}/`, description: cfg.description,
            applicationCategory: 'BusinessApplication', applicationSubCategory: 'Inventory Management', operatingSystem: 'Web',
            browserRequirements: 'Requires JavaScript', inLanguage: cfg.lang, image: OG_IMAGE, screenshot: OG_IMAGE,
            isAccessibleForFree: false, provider: { '@id': org['@id'] }, publisher: { '@id': org['@id'] } }
    ]
};

/* ---------- Isi template ---------- */
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NILAI = {
    LANG: cfg.lang, LOCALE: cfg.locale, TITLE: cfg.title, DESCRIPTION: cfg.description, KEYWORDS: cfg.keywords.join(', '),
    NAME: cfg.name, SHORT_NAME: cfg.shortName, COMPANY: cfg.company, LOCALITY: cfg.locality, REGION_CODE: cfg.regionCode,
    THEME: cfg.themeColor, BG_LIGHT: cfg.backgroundLight, BG_DARK: cfg.backgroundDark, OG_IMAGE_ALT: cfg.ogImageAlt,
    SITE_URL, APP_URL, OG_IMAGE, BUILD_ID, LOGO_W, LOGO_H,
    ROBOTS: INDEX ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow'
};
const MENTAH = { JSON_LD: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }; // tidak di-escape HTML
function isi(teks, file) {
    return teks.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
        if (k in MENTAH) return MENTAH[k];
        if (k in NILAI) return escHtml(NILAI[k]);
        throw new Error(`Placeholder {{${k}}} tidak dikenal di ${file}`);
    });
}
(function jelajah(dir) {
    for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) jelajah(p);
        else if (extname(f) === '.html') writeFileSync(p, isi(readFileSync(p, 'utf8'), f));
    }
})(DIST);

/* ---------- Manifest, robots, sitemap ---------- */
writeFileSync(join(DIST, 'site.webmanifest'), JSON.stringify({
    id: '/', name: cfg.title, short_name: cfg.shortName, description: cfg.description, lang: cfg.lang,
    start_url: '/', scope: '/', display: 'standalone', orientation: 'any',
    theme_color: cfg.backgroundLight, background_color: cfg.backgroundLight, categories: ['business', 'productivity'],
    icons: [
        { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/assets/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
}, null, 2));
writeFileSync(join(DIST, 'robots.txt'), INDEX
    ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${TANGGAL}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image><image:loc>${escHtml(OG_IMAGE)}</image:loc></image:image>
  </url>
</urlset>
`);

console.log(`Build selesai → dist/
  SITE_URL : ${SITE_URL}
  APP_URL  : ${APP_URL}
  og:image : ${OG_IMAGE} (${Math.round(ogBuf.length / 1024)} KB)
  robots   : ${NILAI.ROBOTS}`);
