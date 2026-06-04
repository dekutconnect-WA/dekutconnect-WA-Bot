# Panduan Kontribusi NextA-API

Terima kasih telah tertarik untuk berkontribusi pada **NextA-API**! Kami senang Anda ingin membantu membuat proyek API modular ini menjadi lebih baik.

Dokumen ini berisi panduan untuk membantu Anda memulai kontribusi, mulai dari setup lingkungan pengembangan lokal hingga cara menambahkan endpoint baru agar terdeteksi otomatis oleh sistem dokumentasi.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Instalasi & Setup Lokal](#instalasi--setup-lokal)
- [Struktur Proyek](#struktur-proyek)
- [Panduan Pengembangan](#panduan-pengembangan)
  - [Menambah Endpoint Baru](#menambah-endpoint-baru-penting)
  - [Standar Dokumentasi (JSDoc)](#standar-dokumentasi-jsdoc)
  - [Frontend & Komponen](#frontend--komponen)
- [Pengiriman Pull Request](#pengiriman-pull-request)

---

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- **Node.js** (Versi 18+ direkomendasikan)
- **PostgreSQL** (Untuk database fitur Chat, Blog, dan Temp Storage)
- **Git**

## Instalasi & Setup Lokal

1. **Fork** repositori ini ke akun GitHub Anda.
2. **Clone** repositori fork tersebut ke komputer lokal Anda:
   ```bash
   git clone https://github.com/USERNAME-ANDA/NextA-API.git
   cd NextA-API
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Konfigurasi Environment Variables**:
   Buat file `.env.local` di root folder dan isi variabel berikut:
   ```env
   # Koneksi Database PostgreSQL
   PURUBOY_PG_URL="postgres://user:password@host:port/database"

   # Password Admin untuk Blog/CMS
   PURUBOY_ADMIN_KEY="password_rahasia_anda"
   ```
5. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Akses di `http://localhost:3000`.

---

## Struktur Proyek

Proyek ini menggunakan struktur Next.js App Router dengan pemisahan logika bisnis yang ketat:

- **`app/api/`**: Hanya berisi *Route Handlers* (entry point). Hindari menulis logika bisnis yang kompleks di sini.
- **`lib/controllers/`**: Berisi logika utama endpoint. **Setiap endpoint baru wajib memiliki controller di sini.**
- **`lib/`**: Helper functions, koneksi database, dan utilitas (scraper, third-party API wrapper).
- **`components/`**: Komponen React untuk Frontend/Dokumentasi.
- **`public/`**: Aset statis.
- **`scripts/`**: Skript utilitas (seperti `generate-docs.js`).

---

## Panduan Pengembangan

### Menambah Endpoint Baru (PENTING)

Sistem dokumentasi (`/docs`) di proyek ini dibuat secara **otomatis** dengan memindai file di dalam `lib/controllers`. Agar endpoint Anda muncul di dokumentasi, ikuti langkah ini:

1. **Buat Controller**:
   Buat file baru di `lib/controllers/<kategori>/<nama-fitur>.js`.
   Contoh: `lib/controllers/tools/myFeature.js`.

2. **Tulis Logika & JSDoc**:
   Anda **WAJIB** menambahkan komentar JSDoc khusus di atas fungsi controller. Sistem akan membaca tag ini untuk membuat file `docs.json`.

   ```javascript
   /**
    * @title Nama Fitur
    * @summary Ringkasan singkat.
    * @description Penjelasan detail tentang apa yang dilakukan endpoint ini.
    * @method GET
    * @path /api/tools/my-feature
    * @response json
    * @param {string} query.text - Parameter text yang dibutuhkan.
    * @example
    * async function test() {
    *   const res = await fetch('/api/tools/my-feature?text=halo');
    *   console.log(await res.json());
    * }
    */
   const myFeatureController = async (req) => {
       // Logika Anda di sini
       return { success: true, message: "Hello World" };
   };

   module.exports = myFeatureController;
   ```

3. **Buat Route Handler**:
   Buat file di `app/api/tools/my-feature/route.js`:
   ```javascript
   import { NextResponse } from 'next/server';
   import myFeatureController from '../../../../lib/controllers/tools/myFeature';

   export async function GET(req) {
       try {
           const { searchParams } = new URL(req.url);
           const query = Object.fromEntries(searchParams);

           // Mock request object
           const mockReq = { query };

           const result = await myFeatureController(mockReq);
           return NextResponse.json(result);
       } catch (error) {
           return NextResponse.json({ error: error.message }, { status: 500 });
       }
   }
   ```

### Standar Dokumentasi (JSDoc)

Tag yang didukung oleh `lib/docsService.js`:
- `@title`: Judul endpoint.
- `@summary`: Deskripsi singkat (muncul di kartu endpoint).
- `@description`: Deskripsi lengkap (muncul di modal info).
- `@method`: GET, POST, PUT, DELETE.
- `@path`: URL path endpoint.
- `@param`: Definisi parameter. Format: `{tipe} lokasi.nama - deskripsi`.
  - Lokasi: `query`, `body`, `path`.
  - Opsional: Gunakan kurung siku `[query.page]`.
- `@example`: Contoh kode penggunaan.

### Frontend & Komponen

- Gunakan **Tailwind CSS** untuk styling.
- Ikuti tema warna yang ada di `globals.css` (gunakan variabel CSS `--accent-color`, `--bg-card`, dll) agar mendukung tema dinamis jika diterapkan nanti.
- Komponen reusable ada di folder `components/` (misal: `EndpointCard.jsx`, `InfoModal.jsx`).

---

## Pengiriman Pull Request

1. Pastikan kode Anda berjalan dengan baik di lokal.
2. Jalankan perintah build untuk memastikan script dokumentasi berjalan tanpa error:
   ```bash
   npm run build
   ```
   *Langkah ini akan menjalankan `scripts/generate-docs.js` dan memastikan `public/docs.json` ter-generate dengan benar.*
3. Buat branch baru untuk fitur/perbaikan Anda:
   ```bash
   git checkout -b fitur/nama-fitur-anda
   ```
4. Commit perubahan Anda dengan pesan yang jelas:
   ```bash
   git commit -m "feat: menambah endpoint downloader baru"
   ```
5. Push ke repositori fork Anda dan buat **Pull Request** ke branch `main` repositori utama.

---

**Terima kasih telah berkontribusi!** 🚀
