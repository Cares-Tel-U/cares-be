<div align="center">

# 🏛️ CARES Backend API

**Campus Facility Damage Reporting System — Server Side Engine**

 REST API backend modern, cepat, dan terstruktur untuk mengelola sistem pelaporan kerusakan fasilitas kampus secara *real-time*.

---

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=flat-square&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-v4.x-black?style=flat-square&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.x-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-512BD4?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-Authentication-black?style=flat-square&logo=jsonwebtokens)

</div>

<br />

## 📖 Deskripsi Singkat

**CARES Backend** merupakan layanan web/API yang memproses seluruh operasi logika bisnis sistem pelaporan fasilitas kampus. Layanan ini mencakup pengelolaan autentikasi pengguna berbasis JWT, manajemen CRUD fasilitas & laporan, dashboard analitik berbasis statistik mingguan/bulanan untuk pihak SARPRAS, hingga pemicu notifikasi otomatis saat status laporan diperbarui.

---

## 🛠️️ Arsitektur & Teknologi Backend

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

🚀 Panduan Memulai (Quick Start)
1. Prasyarat Sistem
Node.js (v18.x atau versi lebih baru)

PostgreSQL Database (Lokal/Cloud)

Package Manager (npm, yarn, atau pnpm)

2. Konfigurasi Environment Variable
Salin file .env.example menjadi .env di direktori utama backend:

PORT=5000
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/cares_db?schema=public"
JWT_SECRET="super_secret_jwt_key_cares_2026"

3. Instalasi Dependensi
Jalankan perintah berikut di terminal:
npm install

4. Setup Database & Prisma Migrations
Generate Prisma Client dan jalankan migrasi tabel ke PostgreSQL:

npx prisma migrate dev --name init
npx prisma generate

5. Jalankan Server Development
npm run dev

Server akan berjalan secara otomatis di: http://localhost:5000 🚀

## 📑 Dokumentasi API (Endpoints Reference)

### 🔐 1. Autentikasi (`/auth`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Publik | Mendaftarkan akun mahasiswa/civitas baru |
| `POST` | `/auth/login` | Publik | Autentikasi email & password untuk mendapatkan Token JWT |

### 👤 2. Pengguna (`/users`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Authenticated | Mengambil profil data diri pengguna yang sedang login |

### 🏢 3. Fasilitas Campus (`/facilities`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/facilities` | Authenticated | Mengambil daftar seluruh gedung/fasilitas kampus |
| `POST` | `/facilities` | Admin / SARPRAS | Menambahkan fasilitas kampus baru |

### 📋 4. Pelaporan Kerusakan (`/reports`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/reports` | Authenticated | Membuat dan mengirimkan laporan kerusakan baru |
| `GET` | `/reports/my-reports` | Authenticated | Mengambil daftar riwayat laporan milik pengguna sendiri |

### 📊 5. Panel Admin & Dashboard Stats (`/admin`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/reports` | Admin / SARPRAS | Mengambil seluruh daftar laporan masuk di sistem |
| `PATCH` | `/admin/reports/:id/status` | Admin / SARPRAS | Memperbarui status laporan (`PENDING`, `DIPROSES`, `SELESAI`, `DITOLAK`) |
| `GET` | `/admin/stats` | Admin / SARPRAS | Mengambil ringkasan statistik & data tren harian untuk grafik Figma |

### 🔔 6. Notifikasi (`/notifications`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | Mengambil daftar riwayat notifikasi status laporan pengguna |
| `PATCH` | `/notifications/:id/read` | Authenticated | Menandai notifikasi spesifik telah dibaca |

---

## 💡 Status Use Case Implemented

- [x] **UC-01**: Registrasi Akun Pengguna
- [x] **UC-02**: Login & Generasi JWT Token
- [x] **UC-04**: Buat Laporan Kerusakan Facilities
- [x] **UC-05**: Melihat Riwayat Laporan Kerusakan
- [x] **UC-06**: Memantau Dashboard & Visualisasi Grafik Admin
- [x] **UC-07**: Memperbarui Status Laporan & Trigger Notifikasi
- [x] **UC-08**: Logout Session Handling (Client-side token deletion)
- [x] **UC-09**: Notification Center System