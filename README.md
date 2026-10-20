# CARES Backend API Engine

Mesin server-side RESTful API tangguh untuk **CARES (Campus Facility Damage Reporting System)** Telkom University.

Layanan backend ini dibangun menggunakan **Express.js**, **TypeScript**, dan **Prisma ORM** dengan mengusung arsitektur berlapis (*layered architecture*), pemisahan tanggung jawab yang tegas, validasi skema ketat (*Zod*), serta perlindungan otentikasi berbasis *Role-Based Access Control* (RBAC).

---

## Daftar Isi
1. [Fitur Utama Sistem Backend](#fitur-utama-sistem-backend)
2. [Arsitektur dan Teknologi](#arsitektur-dan-teknologi)
3. [Struktur Direktori Proyek](#struktur-direktori-proyek)
4. [Skema Basis Data dan Model Relasi](#skema-basis-data-dan-model-relasi)
5. [Kredensial Akun Siap Uji](#kredensial-akun-siap-uji)
6. [Panduan Instalasi dan Menjalankan](#panduan-instalasi-dan-menjalankan)
7. [Dokumentasi API Interaktif (Swagger & Postman)](#dokumentasi-api-interaktif-swagger--postman)
8. [Rangkaian Pengujian Otomatis (Vitest)](#rangkaian-pengujian-otomatis-vitest)
9. [Panduan Persiapan Deployment & Checklist Produksi](#panduan-persiapan-deployment--checklist-produksi)

---

## Fitur Utama Sistem Backend

### 1. Modul Otentikasi dan Pengguna
- **Pendaftaran dan Masuk Akun**: Registrasi tervalidasi skema domain kampus, login stateless berbasis JSON Web Token (JWT), dan enkripsi kata sandi menggunakan Bcrypt.
- **Role-Based Access Control (RBAC)**: Pembatasan hak akses berbasis peran (`MAHASISWA`, `DOSEN`, `TENAGA_KEPENDIDIKAN`, dan `SARPRAS`).
- **Lupa dan Reset Kata Sandi**: Mekanisme pembuatan token pemulihan berbasis waktu (*expiration date*) dan integrasi pengiriman email via Nodemailer SMTP.
- **Preferensi Pengguna**: Pengelolaan pengaturan profil serta preferensi penerimaan notifikasi (*notification preference*).

### 2. Modul Pelaporan Kerusakan Fasilitas
- **Pembuatan Tiket Laporan**: Validasi masukan data kerusakan fasilitas, dukungan kategori lokasi Dalam Gedung maupun Area Luar.
- **Multi-Upload Bukti Foto**: Penanganan pengunggahan hingga 3 berkas gambar bukti kerusakan dengan batasan ukuran dan validasi tipe berkas (MIME type).
- **Aturan Bisnis Integritas Laporan**:
  - Pencegahan laporan duplikat pada fasilitas yang sedang dalam penanganan aktif (`PENDING` atau `DIPROSES`).
  - Pembatasan kuota pengiriman maksimal 3 laporan per pengguna dalam jendela waktu 1x24 jam.
  - Mode Laporan Anonim (*isAnonymous*) yang menyembunyikan identitas pelapor pada antarmuka publik dan SARPRAS.
- **Riwayat dan Detail Laporan**: Pengambilan riwayat tiket pengguna dengan filter status, paginasi aman, dan riwayat linimasa penanganan.

### 3. Modul Admin & Sarana Prasarana (SARPRAS)
- **Verifikasi dan Pembaruan Status**: Alur kerja pembaruan status laporan (`PENDING` -> `DIPROSES` -> `SELESAI` atau `DITOLAK`).
- **Integritas Penolakan & Penyelesaian**:
  - Penolakan tiket wajib menyertakan alasan penolakan resmi (*rejection reason*).
  - Penyelesaian tiket (`SELESAI`) wajib menyertakan unggahan bukti foto hasil perbaikan sarana.
- **Pembaruan Massal (Bulk Action)**: Dukungan pembaruan status untuk beberapa tiket sekaligus dalam satu operasi transaksi.
- **Agregasi Metrik dan Analitik**: Kalkulasi ringkasan metrik total laporan, status aktif, distribusi lokasi sarana, tren kerusakan berkala, serta identifikasi jam sibuk pelaporan.

### 4. Modul Notifikasi In-App
- **Pemicu Otomatis**: Pembuatan rekaman notifikasi sistem secara otomatis setiap kali tiket baru dibuat atau status laporan diperbarui oleh pihak SARPRAS.
- **Manajemen Notifikasi**: Mengambil daftar notifikasi pengguna, penandaan status baca (*mark as read*), dan penghitungan jumlah notifikasi belum dibaca.

---

## Arsitektur dan Teknologi

- **Runtime Engine**: Node.js (v18.x / v20.x ke atas)
- **Bahasa Pemrograman**: TypeScript 5
- **Web Framework**: Express.js 4
- **ORM & Database Engine**: Prisma ORM v5 dengan basis data PostgreSQL
- **Otentikasi & Enkripsi**: JSON Web Token (jsonwebtoken) & BcryptJS
- **Validasi Data**: Zod Schema Validation
- **Keamanan Jaringan**: CORS, Express Rate Limit
- **Manajemen Berkas**: Multer
- **Layanan Surel**: Nodemailer (SMTP Client)
- **Testing Framework**: Vitest & Supertest (15 Test Suites, 131 Unit & Integration Tests)
- **Dokumentasi API**: Swagger UI Express (OpenAPI 3.0) & Postman Collection

---

## Struktur Direktori Proyek

Arsitektur direktori backend mengadopsi pola modular *Controller-Service-Route* yang terstruktur rapi:

```
cares-be/
├── postman/                       # Koleksi dan lingkungan pengujian Postman resmi
│   ├── CARES_API_v1.postman_collection.json
│   └── CARES_Local.postman_environment.json
├── prisma/                        # Konfigurasi skema database dan seed data
│   ├── schema.prisma              # Definisi model data dan relasi PostgreSQL
│   └── seed.ts                    # Script seed akun dan master data fasilitas
├── src/
│   ├── controllers/               # Lapisan pengendali HTTP request dan response
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── facility.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── report.controller.ts
│   │   └── user.controller.ts
│   ├── docs/                      # Spesifikasi dokumentasi OpenAPI / Swagger
│   │   └── swagger.ts
│   ├── middlewares/               # Lapisan middleware (Auth JWT, Role, Multer, Validate)
│   │   ├── auth.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/                    # Definisi perutean RESTful endpoint v1
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── facility.routes.ts
│   │   ├── index.ts
│   │   ├── notification.routes.ts
│   │   ├── report.routes.ts
│   │   └── user.routes.ts
│   ├── services/                  # Lapisan logika bisnis murni
│   │   └── auth.service.ts
│   ├── utils/                     # Utilitas pendukung (Mail, Notification, Prisma Client)
│   │   ├── auth.ts
│   │   ├── mail.ts
│   │   ├── notification.ts
│   │   └── prisma.ts
│   ├── app.ts                     # Konfigurasi middleware utama Express dan routing
│   └── server.ts                  # Titik masuk eksekusi server listener
├── tests/                         # Rangkaian pengujian otomatis Vitest
│   ├── api/                       # Pengujian integrasi endpoint HTTP via Supertest
│   ├── fixtures/                  # Aset dummy pengujian
│   ├── helpers/                   # Fungsi bantu simulasi database dan auth token
│   ├── setup/                     # Inisialisasi lingkungan pengujian
│   └── unit/                      # Pengujian unit untuk service, util, dan middleware
├── uploads/                       # Direktori penyimpanan lokal berkas foto
├── package.json                   # Metadata dependensi dan skrip proyek
├── tsconfig.json                  # Konfigurasi kompiler TypeScript
└── vitest.config.mts              # Konfigurasi runner Vitest
```

---

## Skema Basis Data dan Model Relasi

Model relasional PostgreSQL dikelola menggunakan Prisma ORM:

- **User**: Menyimpan data akun pelapor dan administrator sarpras (`id`, `email`, `nim`, `password`, `nama`, `role`, `notificationPreference`, `resetPasswordToken`).
- **Facility**: Menyimpan daftar gedung, area luar, dan sarana kampus (`id`, `nama`, `lokasi`, `kategori`).
- **Report**: Menyimpan tiket pelaporan kerusakan (`id`, `judul`, `deskripsi`, `status`, `catatan`, `rejectionReason`, `isAnonymous`, relasi ke `User` dan `Facility`).
- **ReportPhoto**: Menyimpan URL foto bukti kerusakan dan bukti penyelesaian hasil perbaikan yang berelasi ke `Report`.
- **Notification**: Menyimpan riwayat log notifikasi status laporan untuk masing-masing `User`.

---

## Kredensial Akun Siap Uji

Database lokal dapat diisi secara otomatis dengan menjalankan seed data:

| Peran | Email | Kata Sandi | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Mahasiswa / Pelapor** | `pengguna1@telkomuniversity.ac.id` | `Password123` | Pelapor aktif dengan tiket aktif dan notifikasi |
| **Mahasiswa / Pelapor** | `pengguna2@telkomuniversity.ac.id` | `Password123` | Pelapor aktif dengan preferensi notifikasi |
| **Mahasiswa / Pelapor** | `pengguna3@telkomuniversity.ac.id` | `Password123` | Pelapor dengan sampel tiket anonim |
| **Admin SARPRAS** | `admin1@telkomuniversity.ac.id` | `Admin123` | Hak akses penuh verifikasi dan analitik statistik |
| **Admin SARPRAS** | `admin2@telkomuniversity.ac.id` | `Admin123` | Hak akses tindakan penolakan dan bukti perbaikan |
| **Admin SARPRAS** | `admin3@telkomuniversity.ac.id` | `Admin123` | Hak akses manajemen fasilitas dan monitoring |

---

## Panduan Instalasi dan Menjalankan

### 1. Prasyarat Lingkungan
- Node.js versi 18.x atau versi 20.x ke atas
- PostgreSQL Server aktif (port default 5432 atau 3307)
- Manajer paket npm

### 2. Konfigurasi Environment Variables
Salin berkas template konfigurasi:
```bash
cp .env.example .env
```
Sesuaikan nilai konfigurasi pada berkas `.env`:
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:password@localhost:5432/cares_db?schema=public"
JWT_SECRET="super_secret_jwt_key_cares_2026"

# Konfigurasi SMTP (Opsional untuk fitur reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="akun_email@domain.com"
SMTP_PASS="app_password_smtp"
SMTP_FROM="CARES Telkom University <noreply@telkomuniversity.ac.id>"
```

### 3. Pemasangan Dependensi
```bash
npm install
```

### 4. Sinkronisasi Skema Basis Data & Seeding
```bash
npx prisma db push
npx prisma db seed
```

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Server API akan aktif pada `http://localhost:5001`.

---

## Dokumentasi API Interaktif (Swagger & Postman)

### 1. Swagger UI (OpenAPI 3.0)
Dokumentasi interaktif dengan fitur uji langsung (*Try it out*) dapat diakses pada peramban web saat server aktif:
- URL: `http://localhost:5001/api-docs` atau `http://localhost:5001/docs`

### 2. Postman Collection
Tersedia berkas koleksi resmi dan environment pada direktori `postman/`:
- Koleksi: `postman/CARES_API_v1.postman_collection.json`
- Environment: `postman/CARES_Local.postman_environment.json`

### 3. Ringkasan Endpoint Utama RESTful API (v1)

| Kategori | Method | Endpoint | Akses | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Autentikasi** | `POST` | `/api/v1/auth/register` | Publik | Pendaftaran akun civitas baru |
| | `POST` | `/api/v1/auth/login` | Publik | Masuk akun dan penerbitan token JWT |
| | `POST` | `/api/v1/auth/forgot-password` | Publik | Permintaan tautan reset password via email |
| | `POST` | `/api/v1/auth/reset-password` | Publik | Eksekusi reset kata sandi menggunakan token |
| **Pengguna** | `GET` | `/api/v1/users/me` | User | Mengambil profil data diri pengguna aktif |
| | `PATCH` | `/api/v1/users/preferences` | User | Memperbarui toggle preferensi notifikasi |
| **Fasilitas** | `GET` | `/api/v1/facilities` | Publik | Mengambil daftar gedung dan fasilitas kampus |
| **Pelaporan** | `POST` | `/api/v1/reports` | User | Membuat tiket pelaporan kerusakan baru |
| | `GET` | `/api/v1/reports/my-reports` | User | Riwayat laporan pribadi pengguna |
| | `GET` | `/api/v1/reports/:id` | User/Admin | Detail lengkap tiket dan linimasa progres |
| **Admin Sarpras** | `GET` | `/api/v1/admin/reports` | SARPRAS | Mengambil antrean tiket (filter & paginasi) |
| | `PATCH` | `/api/v1/admin/reports/:id/status` | SARPRAS | Pembaruan status tiket laporan tunggal |
| | `PATCH` | `/api/v1/admin/reports/bulk-status` | SARPRAS | Pembaruan status massal beberapa tiket |
| | `GET` | `/api/v1/admin/stats` | SARPRAS | Rekapitulasi metrik dan data analitik |
| **Notifikasi** | `GET` | `/api/v1/notifications` | User | Daftar riwayat notifikasi in-app |
| | `PATCH` | `/api/v1/notifications/:id/read` | User | Menandai notifikasi telah dibaca |

---

## Rangkaian Pengujian Otomatis (Vitest)

Backend dilengkapi dengan rangkaian pengujian komprehensif mencakup 15 berkas uji dan 131 test case dengan hasil 100% lulus:

```bash
# Menjalankan seluruh pengujian unit dan integrasi
npm test

# Menjalankan pengujian khusus lapisan unit (services, utils, middlewares)
npm run test:unit

# Menjalankan pengujian khusus lapisan API (Supertest HTTP endpoints)
npm run test:api

# Menjalankan pengujian dengan kalkulasi cakupan kode (Code Coverage)
npm run test:coverage
```

---

## Panduan Persiapan Deployment & Checklist Produksi

### 1. Checklist Lingkungan Produksi
- [ ] Atur variabel `NODE_ENV=production`.
- [ ] Gunakan basis data PostgreSQL cloud terkelola (misalnya AWS RDS, Supabase, atau Neon).
- [ ] Ganti `JWT_SECRET` dengan string acak dengan entropi tinggi (minimal 64 karakter).
- [ ] Konfigurasi kredensial SMTP resmi kampus untuk pengiriman email pemulihan akun.
- [ ] Konfigurasi URL `CLIENT_URL` dengan domain web frontend resmi guna mencegah celah CORS.

### 2. Rencana Integrasi Cloud Storage (Cloudinary / AWS S3)
Untuk deployment lingkungan tanpa disk persisten (seperti Heroku, Render, atau container serverless), disarankan mengalihkan penyimpanan lokal `uploads/` ke penyedia object storage cloud (misalnya Cloudinary atau AWS S3) agar berkas foto bukti kerusakan tetap tersimpan permanen.

### 3. Rencana Kontainerisasi Docker & CI/CD
Siapkan berkas `Dockerfile` dan konfigurasi pipeline GitHub Actions untuk otomatisasi pengujian (*automated testing*) dan penyebaran berkas (*continuous deployment*) ke server target.