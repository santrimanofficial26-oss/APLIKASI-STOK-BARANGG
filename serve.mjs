// Server lokal sederhana untuk melihat hasil build: npm run preview → http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3000;
// Header keamanan sama seperti di Vercel (aturan "/(.*)" di vercel.json), agar CSP ikut teruji di lokal
const HEADER = Object.fromEntries(JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8')).headers
    .find(h => h.source === '/(.*)').headers.filter(h => h.key !== 'Strict-Transport-Security').map(h => [h.key, h.value]));
const TIPE = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

createServer(async (req, res) => {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    if (p === '' || p === '.') p = 'index.html';
    try {
        const isi = await readFile(join(DIST, p));
        res.writeHead(200, { ...HEADER, 'Content-Type': TIPE[extname(p)] || 'application/octet-stream' });
        res.end(isi);
    } catch {
        res.writeHead(404, { ...HEADER, 'Content-Type': TIPE['.html'] });
        res.end(await readFile(join(DIST, '404.html')).catch(() => 'Not found'));
    }
}).listen(PORT, () => console.log(`Pratinjau: http://localhost:${PORT}`));
