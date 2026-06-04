# NextA-API (PuruBoy API)

Project API Publik yang modular, modern, dan kaya fitur, dibangun menggunakan **Next.js**. Project ini menyediakan berbagai layanan REST API gratis mulai dari **AI Tools** (Text-to-Image, Chat, TTS), **Downloader** (YouTube, TikTok, IG), hingga **Anime Streaming** dan **Tools** utilitas lainnya.

Dilengkapi dengan antarmuka dokumentasi otomatis (Swagger-like) yang ramah pengguna dan fitur komunitas (Chat Room).

## 🚀 Fitur Utama

### 🤖 Artificial Intelligence (AI)
- **Text to Image**: Vheer, Flux, Ghibli Style, Brat Generator.
- **ChatBot**: Grok-4, GPT-4 (Typli), Custom Agents (Llama, DeepSeek).
- **Vision**: Analisis gambar menggunakan Gemini (ScreenApp).
- **Text to Speech (TTS)**: Svara, Aitwo (Bahasa Indonesia).
- **Text Processing**: Translapp (Translate, Paraphrase, Summarize).

### 📥 Downloader
- **YouTube**: Download Video/Audio.
- **TikTok**: Download No Watermark.
- **Instagram**: Video, Reels, Foto.
- **Facebook**: Video SD/HD.
- **SoundCloud**: Download Lagu MP3.

### 🎬 Anime & Hiburan
- **Oploverz**: Search, Detail, Stream, Download.
- **MyAnimeList**: Search, Popular, Ongoing, Genre.
- **SoundCloud Search**: Cari & Play musik.

### 🛠️ Tools
- **Image Editing**: Remove Background, Upscale (Peningkatan Kualitas), Colorize (Pewarnaan Foto Lama).
- **System**: Fast Update via AI, Blog System.

## 🛠️ Teknologi yang Digunakan

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via `pg`)
- **Dokumentasi**: Auto-generated dari JSDoc Controller.
- **HTTP Client**: Axios & Fetch.

## ⚙️ Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (Versi 18 atau terbaru disarankan)
- [Git](https://git-scm.com/)
- Database PostgreSQL (Bisa menggunakan layanan gratis seperti Neon.tech atau Supabase).

## 📦 Instalasi & Menjalankan Lokal

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di komputer Anda:

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/NextA-API.git
    cd NextA-API
    ```

2.  **Instal Dependencies**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment Variable**
    Buat file `.env.local` di root folder proyek dan isi dengan konfigurasi berikut:

    ```env
    # Koneksi Database PostgreSQL
    PURUBOY_PG_URL="postgres://user:password@host:port/database?sslmode=require"

    # Password untuk Admin (Blog Posting & Delete)
    PURUBOY_ADMIN_KEY="password_rahasia_anda"
    ```

4.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```

    Buka browser dan akses [http://localhost:3000](http://localhost:3000).

## 📂 Struktur Proyek

Agar mudah dipahami, berikut adalah struktur folder utama:

- **`app/`**: Halaman frontend dan API Routes (Next.js App Router).
  - `app/api/`: Endpoint API (Route Handlers).
  - `app/docs/`: Halaman dokumentasi.
- **`components/`**: Komponen React UI (Card, Navbar, dll).
- **`lib/`**: Logika bisnis dan helper.
  - `lib/controllers/`: Logika utama untuk setiap endpoint (sumber dokumentasi).
  - `lib/xxx.js`: Helper function (scraper, external api wrapper).
- **`public/`**: Aset statis (gambar, favicon).

## 🚀 Deployment

Cara termudah untuk men-deploy adalah menggunakan **Vercel**:

1.  Push kode ke GitHub/GitLab.
2.  Buka [Vercel](https://vercel.com) dan "Import Project".
3.  Masukkan Environment Variables (`PURUBOY_PG_URL`, `PURUBOY_ADMIN_KEY`) di pengaturan Vercel.
4.  Deploy!

## 🤝 Kontribusi

Kami sangat terbuka untuk kontribusi! Silakan lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap cara menambahkan fitur atau memperbaiki bug.

## 📝 Lisensi

Proyek ini bersifat open-source. Silakan gunakan untuk pembelajaran atau pengembangan lebih lanjut.

---
**Author**: PuruBoy