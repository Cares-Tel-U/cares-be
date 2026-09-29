# CARES Backend

Backend REST API untuk sistem pelaporan kerusakan fasilitas kampus CARES (Campus Facility Damage Reporting System).
Dibangun menggunakan Node.js, Express, TypeScript, Prisma ORM, dan PostgreSQL.

## Prasyarat

- Node.js (v18 atau lebih baru)
- PostgreSQL (Database lokal/cloud yang aktif)
- npm / yarn / pnpm

## Panduan Memulai

### 1. Salin Environment Variables

Buat file `.env` di direktori utama backend dan atur variabel berikut:

```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/cares_db?schema=public"
JWT_SECRET="your_jwt_secret_key"
