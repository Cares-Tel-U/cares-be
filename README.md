# 🏛️ CARES Backend API

**Campus Facility Damage Reporting System — Server Side Engine**

REST API backend modern, cepat, dan terstruktur untuk mengelola sistem pelaporan kerusakan fasilitas kampus secara real-time.

---

## 📖 Deskripsi Singkat

**CARES Backend** merupakan layanan web/API yang memproses seluruh operasi logika bisnis sistem pelaporan fasilitas kampus. Layanan ini mencakup pengelolaan autentikasi pengguna berbasis JWT, manajemen CRUD fasilitas & laporan, dashboard analitik berbasis statistik mingguan/bulanan untuk pihak SARPRAS, hingga pemicu notifikasi otomatis saat status laporan diperbarui.

---

## 🛠 Arsitektur & Teknologi Backend

* **Runtime & Framework**: Node.js & Express.js (TypeScript)
* **ORM & Database**: Prisma ORM dengan basis data PostgreSQL
* **Autentikasi & Keamanan**: JWT (*JSON Web Token*) Stateless & CORS
* **Development Tools**: `tsx` / `ts-node-dev` untuk auto-reload cepat

---

## 📁 Struktur Proyek

```text
backend/
├── prisma/
│   └── schema.prisma         # Skema tabel database & enum Prisma ORM
├── postman/
│   └── collections/          # Koleksi API Postman untuk testing
├── src/
│   ├── controllers/          # Logika bisnis endpoint (Auth, User, Facility, Report, Admin, Notification)
│   ├── middlewares/          # Middleware JWT Verification & Role Authorization (Admin/Sarpras)
│   ├── routes/               # Pemetaan rute Express API
│   ├── utils/                # Utility helpers (Notification trigger & Auth helpers)
│   ├── app.ts                # Express app entry & route registration
│   └── server.ts             # HTTP Server initializer
├── .env.example              # Template variabel lingkungan
├── package.json              # Metadata, skrip build, & dependensi
├── tsconfig.json             # Konfigurasi compiler TypeScript
└── README.md                 # Dokumentasi utama proyek
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat Sistem
* **Node.js** (v18.x atau versi lebih baru)
* **PostgreSQL Database** (Lokal / Cloud)
* **Package Manager** (`npm`, `yarn`, atau `pnpm`)

### 2. Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env` di direktori utama backend:

```env
PORT=5000
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/cares_db?schema=public"
JWT_SECRET="super_secret_jwt_key_cares_2026"
```

### 3. Instalasi Dependensi
Jalankan perintah berikut di terminal:
```bash
npm install
```

### 4. Setup Database & Prisma Migrations
Generate Prisma Client dan jalankan migrasi tabel ke PostgreSQL:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Server akan berjalan secara otomatis di: `http://localhost:5000` 🚀

---

## 📑 Dokumentasi API (Endpoints Reference)

| Kategori | Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **Autentikasi** | `POST` | `/auth/register` | Publik | Mendaftarkan akun mahasiswa/civitas baru |
| | `POST` | `/auth/login` | Publik | Autentikasi email & password untuk mendapatkan Token JWT |
| **Pengguna** | `GET` | `/users/me` | Authenticated | Mengambil profil data diri pengguna yang sedang login |
| **Fasilitas** | `GET` | `/facilities` | Authenticated | Mengambil daftar seluruh gedung/fasilitas kampus |
| | `POST` | `/facilities` | Admin / SARPRAS | Menambahkan fasilitas kampus baru |
| **Pelaporan** | `POST` | `/reports` | Authenticated | Membuat dan mengirimkan laporan kerusakan baru |
| | `GET` | `/reports/my-reports` | Authenticated | Mengambil daftar riwayat laporan milik pengguna sendiri |
| **Panel Admin**| `GET` | `/admin/reports` | Admin / SARPRAS | Mengambil seluruh daftar laporan masuk di sistem |
| | `PATCH` | `/admin/reports/:id/status` | Admin / SARPRAS | Memperbarui status laporan (`PENDING`, `DIPROSES`, `SELESAI`, `DITOLAK`) |
| | `GET` | `/admin/stats` | Admin / SARPRAS | Mengambil ringkasan statistik & data tren harian untuk grafik Figma |
| **Notifikasi** | `GET` | `/notifications` | Authenticated | Mengambil daftar riwayat notifikasi status laporan pengguna |
| | `PATCH` | `/notifications/:id/read` | Authenticated | Menandai notifikasi spesifik telah dibaca |

---

## 💡 Status Use Case Implemented

| Kode Use Case | Nama Use Case | Status |
| :--- | :--- | :---: |
| **UC-01** | Registrasi Akun Pengguna | `SELESAI` |
| **UC-02** | Login & Generasi JWT Token | `SELESAI` |
| **UC-04** | Buat Laporan Kerusakan Facilities | `SELESAI` |
| **UC-05** | Melihat Riwayat Laporan Kerusakan | `SELESAI` |
| **UC-06** | Memantau Dashboard & Visualisasi Grafik Admin | `SELESAI` |
| **UC-07** | Memperbarui Status Laporan & Trigger Notifikasi | `SELESAI` |
| **UC-08** | Logout Session Handling (Client-side token deletion) | `SELESAI` |
| **UC-09** | Notification Center System | `SELESAI` |

---

Developed for **CARES Campus Facility System** © 2026