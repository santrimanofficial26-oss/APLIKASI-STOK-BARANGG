# Innara Craft — Sistem Inventory Dekorasi (wrapper Vercel)

Situs statis kecil yang menampilkan web app Google Apps Script *Sistem Inventory Innara Craft* di dalam iframe layar penuh. Tujuannya agar aplikasi punya alamat sendiri, ikon di HP, dan preview link yang rapi saat dibagikan di WhatsApp atau media sosial.

Kode aplikasi (backend dan tampilan) tetap di Google Apps Script. Repo ini **tidak** berisi data atau kode Apps Script.

## Isi

| Path | Fungsi |
|---|---|
| `site.config.json` | URL Apps Script, judul, deskripsi, kata kunci, warna. **Edit di sini.** |
| `src/index.html` | Halaman utama: meta SEO, Open Graph, Twitter Card, JSON-LD, iframe, layar pembuka |
| `src/app.js` | Memuat iframe, menyembunyikan layar pembuka, menangani offline |
| `src/assets/` | Logo, favicon, ikon HP (Apple/Android/PWA), gambar preview `og-image.jpg` 1200×630 |
| `build.mjs` | Mengisi meta dengan alamat situs, membuat `site.webmanifest`, `robots.txt`, `sitemap.xml` ke `dist/` |
| `vercel.json` | Perintah build dan header keamanan (CSP hanya mengizinkan iframe dari Google Apps Script) |

## Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new) dan impor repo ini.
2. Biarkan semua pengaturan default (Framework: *Other*). Build dan output sudah diatur di `vercel.json`.
3. Klik **Deploy**.

Alamat situs untuk meta Open Graph diambil otomatis dari domain produksi Vercel. Deployment *preview* diberi `noindex` agar tidak terindeks Google.

### Memakai domain sendiri

Tambahkan domain di **Project → Settings → Domains**. Lalu isi **Settings → Environment Variables**: `SITE_URL` = `https://domainanda.com` (tanpa garis miring di akhir). Setelah itu jalankan **Redeploy**.

### Mengganti URL Apps Script

Ubah `appsScriptUrl` di `site.config.json`, lalu commit dan push. Cara lain: isi environment variable `APPS_SCRIPT_URL` di Vercel.

Deploy Apps Script harus memakai pengaturan **Execute as: Me** dan **Who has access: Anyone**. `doGet()` sudah memanggil `setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` sehingga bisa ditampilkan di iframe.

## Preview link WhatsApp

- WhatsApp membaca tag `og:*`: judul, deskripsi, dan gambar `og-image.jpg` (± 97 KB, di bawah batas aman 300 KB).
- Cek atau segarkan preview lewat [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/): tempel URL, lalu klik **Scrape Again**. WhatsApp memakai data yang sama.
- WhatsApp menyimpan preview lama cukup lama. Bila preview belum berubah, kirim link dengan tambahan `?v=2`.
- Setiap kali `og-image.jpg` diganti, URL gambarnya otomatis mendapat versi baru (`?v=<hash>`).

## Coba di komputer

```bash
npm run preview
```

Buka http://localhost:3000. Header keamanan dari `vercel.json` ikut dipakai.

## Catatan

- Login di dalam iframe disimpan per situs. Pengguna yang sebelumnya membuka link `script.google.com` langsung perlu login sekali lagi di alamat Vercel.
- Pratinjau dan cetak PDF membuka tab baru. Izinkan pop-up untuk alamat ini bila browser memblokirnya.
- Foto latar `og-image.jpg` berasal dari [Unsplash](https://unsplash.com) (Lisensi Unsplash, bebas dipakai komersial).
