# CARES Backend API

Campus Facility Damage Reporting System — Server Side Engine

REST API backend modern, cepat, dan terstruktur untuk mengelola sistem pelaporan kerusakan fasilitas kampus secara real-time.

---

## Deskripsi Singkat

CARES Backend merupakan layanan web/API yang memproses seluruh operasi logika bisnis sistem pelaporan fasilitas kampus. Layanan ini mencakup pengelolaan autentikasi pengguna berbasis JWT, manajemen CRUD fasilitas dan laporan, dashboard analitik berbasis statistik untuk pihak SARPRAS, hingga pemicu notifikasi otomatis saat status laporan diperbarui.

---

## Dokumentasi API Interaktif & Testing Tools

### 1. Swagger UI (OpenAPI 3.0)
Dokumentasi interaktif dapat diakses langsung melalui peramban web saat server berjalan:
* URL: `http://localhost:5001/api-docs` atau `http://localhost:5001/docs`
* Fitur: Try-it-out langsung, skema request/response, dan otentikasi Bearer JWT.

### 2. Postman Collection & Environment
Berkas koleksi Postman lengkap dengan contoh dummy payload siap uji telah disediakan di direktori `postman/`:
* Koleksi: `postman/CARES_API_v1.postman_collection.json`
* Environment: `postman/CARES_Local.postman_environment.json`

---

## Data Dummy Siap Uji (Pre-Seeded Accounts)

Database telah dilengkapi dengan data dummy lengkap sehingga pengujian dapat dilakukan langsung tanpa membuat data baru:

| Peran | Nama Akun | Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Mahasiswa** | Amba Ngawi | `ambangawi@telkomuniversity.ac.id` | `password123` | Pelapor reguler (memiliki laporan & notifikasi) |
| **Mahasiswa** | Bintang Ridwan Pribadi | `bintang@telkomuniversity.ac.id` | `password123` | Pelapor reguler |
| **Admin Sarpras** | Admin Sarpras Tel-U | `admin@telkomuniversity.ac.id` | `admin123` | Hak akses penuh verifikasi laporan |
| **Admin Sarpras** | Petugas Sarpras Lapangan | `sarpras@telkomuniversity.ac.id` | `sarpras123` | Hak akses teknisi lapangan |

---

## Arsitektur & Teknologi Backend

* Runtime & Framework: Node.js & Express.js (TypeScript)
* ORM & Database: Prisma ORM dengan basis data PostgreSQL
* Autentikasi: JWT (JSON Web Token) Stateless & Bcrypt Hashing
* Dokumentasi: Swagger UI Express (OpenAPI 3.0)
* Development Tools: tsx untuk auto-reload cepat

---

## Panduan Memulai (Quick Start)

### 1. Prasyarat Sistem
* Node.js (v18.x atau versi lebih baru)
* PostgreSQL Database (Lokal / Cloud port 3307 atau 5432)
* Package Manager (npm)

### 2. Konfigurasi Environment Variable
Konfigurasikan file `.env` di direktori utama backend:
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres@localhost:3307/cares_db?schema=public"
JWT_SECRET="super_secret_jwt_key_cares_2026"
```

### 3. Instalasi Dependensi & Database Seed
```bash
npm install
npx prisma db push
npx prisma db seed
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Server berjalan di: `http://localhost:5001`

---

## Referensi Standar Endpoint RESTful API (v1)

Semua endpoint mendukung awalan versi `/api/v1` serta backward-compatible tanpa prefix:

| Kategori | Method | Endpoint Standard | Akses | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **Autentikasi** | `POST` | `/api/v1/auth/register` | Publik | Mendaftarkan akun mahasiswa/civitas baru |
| | `POST` | `/api/v1/auth/login` | Publik | Autentikasi email dan password untuk mendapatkan Token JWT |
| **Pengguna** | `GET` | `/api/v1/users/me` | Authenticated | Mengambil profil data diri pengguna yang sedang login |
| **Fasilitas** | `GET` | `/api/v1/facilities` | Publik | Mengambil daftar seluruh gedung/fasilitas kampus |
| **Pelaporan** | `POST` | `/api/v1/reports` | Authenticated | Membuat dan mengirimkan tiket laporan kerusakan baru |
| | `GET` | `/api/v1/reports/my-reports` | Authenticated | Mengambil riwayat laporan milik pengguna sendiri (mendukung paginasi & filter status) |
| **Panel Admin** | `GET` | `/api/v1/admin/reports` | Admin / SARPRAS | Mengambil seluruh daftar antrean laporan (mendukung paginasi & filter status) |
| | `PATCH` | `/api/v1/admin/reports/:id/status` | Admin / SARPRAS | Memperbarui status laporan (`PENDING`, `DIPROSES`, `SELESAI`, `DITOLAK`) |
| | `GET` | `/api/v1/admin/stats` | Admin / SARPRAS | Mengambil ringkasan statistik dan tren data kerusakan |
| **Notifikasi** | `GET` | `/api/v1/notifications` | Authenticated | Mengambil daftar riwayat notifikasi status laporan pengguna |
| | `PATCH` | `/api/v1/notifications/:id/read` | Authenticated | Menandai notifikasi spesifik telah dibaca |

---

Developed for CARES Campus Facility System 2026