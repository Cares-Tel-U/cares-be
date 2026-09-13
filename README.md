# CARES Backend API

Backend service untuk sistem pelaporan kerusakan fasilitas kampus **CARES (Campus Facility Damage Reporting System)**.

Dibangun dengan **Express.js**, **TypeScript**, dan dirancang untuk integrasi database PostgreSQL.

---

## Prasyarat

- Node.js (v18 atau lebih baru disarankan)
- npm / yarn / pnpm

---

## Panduan Instalasi & Menjalankan

### 1. Salin Environment Variables
```bash
cp .env.example .env
```
Sesuaikan konfigurasi port dan origin URL jika diperlukan.

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Menjalankan Mode Development
```bash
npm run dev
```
Server akan berjalan di `http://localhost:5000` dengan fitur live-reload via `tsx watch`.

### 4. Build untuk Production
```bash
npm run build
npm start
```

---

## Arsitektur & Struktur Proyek

```
cares-be/
├── src/
│   ├── app.ts         # Konfigurasi Express middleware & routes
│   └── server.ts      # Entry point server listener
├── .env.example       # Template konfigurasi environment
├── .gitignore         # File yang diabaikan Git
├── package.json       # Metadata & dependensi proyek
├── tsconfig.json      # Konfigurasi TypeScript compiler
└── README.md          # Dokumentasi proyek
```

---

## Endpoint Tersedia

| Method | Endpoint | Deskripsi | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Health check & API status | `200 OK` |
