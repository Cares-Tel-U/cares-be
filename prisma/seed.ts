import { PrismaClient, KategoriFasilitas } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const facilities = [
    { nama: 'Lab Komputer 1', lokasi: 'Gedung A Lt. 2', kategori: KategoriFasilitas.LABORATORIUM },
    { nama: 'Kelas KU 302', lokasi: 'Gedung B Lt. 3', kategori: KategoriFasilitas.KELAS },
    { nama: 'Toilet Pria Utama', lokasi: 'Gedung C Lt. 1', kategori: KategoriFasilitas.TOILET },
    { nama: 'Area Parkir Motor', lokasi: 'Samping Lapangan', kategori: KategoriFasilitas.PARKIRAN },
  ];

  for (const facility of facilities) {
    await prisma.facility.create({
      data: facility,
    });
  }

  console.log('Seeding data fasilitas berhasil!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });