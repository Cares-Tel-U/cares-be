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

<h2>🚀 Panduan Memulai (Quick Start)</h2>

<h3>1. Prasyarat Sistem</h3>
<ul>
  <li><strong>Node.js</strong> (v18.x atau versi lebih baru)</li>
  <li><strong>PostgreSQL Database</strong> (Lokal / Cloud)</li>
  <li><strong>Package Manager</strong> (<code>npm</code>, <code>yarn</code>, atau <code>pnpm</code>)</li>
</ul>

<h3>2. Konfigurasi Environment Variable</h3>
<p>Salin file <code>.env.example</code> menjadi <code>.env</code> di direktori utama backend:</p>
<pre><code>PORT=5000
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/cares_db?schema=public"
JWT_SECRET="super_secret_jwt_key_cares_2026"</code></pre>

3. Instalasi Dependensi</h3>
<p>Jalankan perintah berikut di terminal:</p>
<pre><code>npm install</code></pre>

<h3>4. Setup Database & Prisma Migrations</h3>
<p>Generate Prisma Client dan jalankan migrasi tabel ke PostgreSQL:</p>
<pre><code>npx prisma migrate dev --name init
npx prisma generate</code></pre>

<h3>5. Jalankan Server Development</h3>
<pre><code>npm run dev</code></pre>
<p>Server akan berjalan secara otomatis di: <code>http://localhost:5000</code> 🚀</p>