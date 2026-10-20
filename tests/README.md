# CARES Backend Test Suite Documentation

Dokumentasi resmi infrastruktur pengujian otomatis (automated testing) untuk Project **CARES Backend**.

---

## 1. Arsitektur & Perangkat Pengujian

Pengujian dibangun menggunakan standar industri modern untuk TypeScript & Express.js:
- **Test Runner & Assertion Library**: [Vitest](https://vitest.dev/) (v5.x)
- **HTTP/API Testing Utility**: [Supertest](https://github.com/ladjs/supertest) (v7.x)
- **Code Coverage**: `@vitest/coverage-v8`
- **Mocking Strategy**: Isolated `@prisma/client` and domain module mocking via `vi.hoisted` dan `vi.mock()`.

Keunggulan arsitektur ini:
1. **Keamanan Data**: Pengujian berjalan sepenuhnya terisolasi dan **TIDAK PERNAH** memodifikasi, menghapus, atau menghubungkan ke basis data produksi/development.
2. **Kecepatan Tinggi**: Seluruh 131+ skenario pengujian berjalan selesai dalam kurun waktu kurang dari 2 detik.
3. **Deterministik**: Dapat dieksekusi secara konsisten di mesin lokal maupun pipeline CI/CD tanpa perlu dependensi PostgreSQL server yang menyala.

---

## 2. Struktur Direktori Pengujian

```
backend/
├── tests/
│   ├── unit/                     # Pengujian unit logic terisolasi
│   │   ├── utils/
│   │   │   ├── auth.util.test.ts         # Hash password, compare, generate/verify JWT
│   │   │   ├── mail.util.test.ts         # Transporter SMTP, HTML template, simulation
│   │   │   ├── notification.util.test.ts # Pembuatan notifikasi & error handling
│   │   │   └── prisma.util.test.ts       # Validasi instansiasi Prisma Client
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.test.ts     # authenticateToken & adminMiddleware
│   │   │   ├── upload.middleware.test.ts   # Multer fileFilter, size limit, error handler
│   │   │   └── validate.middleware.test.ts # Zod schema validation
│   │   └── services/
│   │       └── auth.service.test.ts        # AuthService register & login
│   ├── api/                      # Pengujian RESTful HTTP API (Supertest)
│   │   ├── root.api.test.ts      # Health check, metadata API, dan Swagger UI docs
│   │   ├── auth.api.test.ts      # Register, login, forgot & reset password, complexity
│   │   ├── user.api.test.ts      # Get profile, update avatar, notification prefs
│   │   ├── facility.api.test.ts  # Get facilities (publik), create (admin), validasi
│   │   ├── report.api.test.ts    # Create report, dynamic facility, duplicate check, feeds
│   │   ├── admin.api.test.ts     # Admin reports queue, pagination, bulk update, stats
│   │   └── notification.api.test.ts # User notifications & read status
│   ├── fixtures/                 # Data tiruan deterministik (Users, Facilities, Reports)
│   │   ├── users.fixture.ts
│   │   ├── facilities.fixture.ts
│   │   └── reports.fixture.ts
│   ├── helpers/                  # Token generator & mock utilities
│   │   ├── auth-helper.ts
│   │   └── mock-prisma.ts
│   ├── setup/                    # Inisialisasi env & lifecycle hooks
│   │   └── vitest.setup.ts
│   └── README.md
├── vitest.config.mts             # Konfigurasi Vitest & V8 Coverage
└── package.json
```

---

## 3. Perintah Eksekusi Pengujian (NPM Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm test` | Menjalankan seluruh test suite (unit + API). |
| `npm run test:watch` | Menjalankan Vitest dalam mode watch (interaktif saat coding). |
| `npm run test:unit` | Menjalankan pengujian level unit saja. |
| `npm run test:api` | Menjalankan pengujian level HTTP/API saja. |
| `npm run test:coverage` | Menghasilkan ringkasan dan laporan cakupan kode (Code Coverage report). |
| `npx vitest run tests/api/auth.api.test.ts` | Menjalankan berkas pengujian spesifik secara terisolasi. |

---

## 4. Cakupan Skenario Pengujian (Test Coverage Summary)

### A. Autentikasi (`tests/api/auth.api.test.ts` & `tests/unit/services/auth.service.test.ts`)
- Registrasi akun berhasil (`201 Created`).
- Pencegahan email duplikat (`400 Bad Request`).
- Login akun dengan kredensial valid dan pembentukan JWT Bearer token (`200 OK`).
- Penolakan login jika email tidak ditemukan (`401 Unauthorized`).
- Penolakan login jika kata sandi salah (`401 Unauthorized`).
- Permintaan token reset kata sandi melalui forgot password (`200 OK`, `400`, `404`).
- Konfirmasi reset kata sandi baru dengan validasi panjang minimal 8 karakter dan token kedaluwarsa (`200 OK`, `400`).

### B. Fasilitas (`tests/api/facility.api.test.ts`)
- Akses publik daftar fasilitas kampus terurut nama ascending (`200 OK`).
- Pembuatan fasilitas baru oleh pihak SARPRAS/ADMIN (`201 Created`).
- Penolakan otorisasi jika mahasiswa mencoba membuat fasilitas (`403 Forbidden`).
- Validasi nama, lokasi, dan enum kategori fasilitas (`400 Bad Request`).

### C. Pelaporan Fasilitas Kerusakan (`tests/api/report.api.test.ts`)
- Pembuatan laporan kerusakan baru dan pemicu notifikasi konfirmasi (`201 Created`).
- Dukungan pelaporan berstatus anonim (`isAnonymous: true`).
- Pencegahan laporan ganda untuk fasilitas yang masih berstatus `PENDING` atau `DIPROSES` (`400 Bad Request`).
- Pembatasan kuota maksimal 3 laporan per pengguna per hari (`400 Bad Request`).
- Validasi keberadaan fasilitas sebelum laporan dibuat (`404 Not Found`).
- Proteksi privasi pelapor anonim pada feed publik (nama disamarkan menjadi `Anonim` untuk pengguna reguler).
- Pengungkapan identitas pelapor anonim khusus bagi pihak SARPRAS.
- Riwayat laporan pribadi pengguna (`GET /api/v1/reports/my-reports`).

### D. Panel Admin Sarpras (`tests/api/admin.api.test.ts`)
- Pengambilan seluruh antrean laporan beserta filter status dan paginasi (`200 OK`).
- Pembaruan status tiket laporan (`PENDING` -> `DIPROSES` / `SELESAI`) disertai pengiriman notifikasi otomatis (`200 OK`).
- Validasi wajib menyertakan `rejectionReason` apabila status diubah menjadi `DITOLAK` (`400 Bad Request`).
- Pembaruan status secara massal / bulk update (`PATCH /api/v1/admin/reports/bulk-status`).
- Ringkasan statistik dasbor dan tren kerusakan harian/bulanan (`GET /api/v1/admin/stats`).
- Penolakan hak akses bagi peran non-Admin (`403 Forbidden`).

### E. Notifikasi Pengguna (`tests/api/notification.api.test.ts`)
- Pengambilan daftar notifikasi pengguna terurut waktu terbaru (`200 OK`).
- Penandaan satu notifikasi telah dibaca (`PATCH /api/v1/notifications/:id/read`).
- **Uji Keamanan Isolasi Kepemilikan**: Penolakan jika pengguna mencoba menandai notifikasi milik pengguna lain (`404 Not Found`).
- Penandaan seluruh notifikasi milik pengguna telah dibaca sekaligus (`PATCH /api/v1/notifications/read-all`).

---

## 5. Menambahkan Pengujian Baru

Saat menambahkan fitur baru pada backend:
1. Simpan fixture data deterministik di `tests/fixtures/`.
2. Gunakan helper autentikasi `getAuthHeaders('mahasiswa' | 'sarpras' | 'admin')` untuk endpoint terproteksi.
3. Manfaatkan pola `vi.hoisted` untuk mendefinisikan mock database Prisma agar tidak terjadi kebocoran ke database lokal.
4. Jalankan `npm test` sebelum melakukan commit untuk memastikan tidak ada regresi.
