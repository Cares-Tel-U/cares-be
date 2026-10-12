import { PrismaClient, KategoriFasilitas, Role, StatusPelaporan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Memulai proses seeding data dummy CARES...');

  // 1. Data Dummy Pengguna (Users)
  const defaultPasswordMahasiswa = await hashPassword('password123');
  const defaultPasswordAdmin = await hashPassword('admin123');

  // Akun Mahasiswa 1 (Amba Ngawi)
  const userMhs1 = await prisma.user.upsert({
    where: { email: 'ambangawi@telkomuniversity.ac.id' },
    update: {
      nama: 'Amba Ngawi',
      password: defaultPasswordMahasiswa,
      role: Role.MAHASISWA,
    },
    create: {
      email: 'ambangawi@telkomuniversity.ac.id',
      nama: 'Amba Ngawi',
      password: defaultPasswordMahasiswa,
      role: Role.MAHASISWA,
    },
  });

  // Akun Mahasiswa 2 (Bintang Ridwan Pribadi)
  const userMhs2 = await prisma.user.upsert({
    where: { email: 'bintang@telkomuniversity.ac.id' },
    update: {
      nama: 'Bintang Ridwan Pribadi',
      password: defaultPasswordMahasiswa,
      role: Role.MAHASISWA,
    },
    create: {
      email: 'bintang@telkomuniversity.ac.id',
      nama: 'Bintang Ridwan Pribadi',
      password: defaultPasswordMahasiswa,
      role: Role.MAHASISWA,
    },
  });

  // Akun Petugas Sarpras / Admin 1
  const userAdmin1 = await prisma.user.upsert({
    where: { email: 'admin@telkomuniversity.ac.id' },
    update: {
      nama: 'Admin Sarpras Tel-U',
      password: defaultPasswordAdmin,
      role: Role.SARPRAS,
    },
    create: {
      email: 'admin@telkomuniversity.ac.id',
      nama: 'Admin Sarpras Tel-U',
      password: defaultPasswordAdmin,
      role: Role.SARPRAS,
    },
  });

  // Akun Petugas Sarpras 2
  const userAdmin2 = await prisma.user.upsert({
    where: { email: 'sarpras@telkomuniversity.ac.id' },
    update: {
      nama: 'Petugas Sarpras Lapangan',
      password: defaultPasswordAdmin,
      role: Role.SARPRAS,
    },
    create: {
      email: 'sarpras@telkomuniversity.ac.id',
      nama: 'Petugas Sarpras Lapangan',
      password: defaultPasswordAdmin,
      role: Role.SARPRAS,
    },
  });

  console.log('Seeding Pengguna Berhasil: 2 Akun Mahasiswa & 2 Akun Sarpras');

  // 2. Data Master Fasilitas Kampus
  const facilitiesData = [
    { nama: 'Kelas KU 302', lokasi: 'Gedung B Lt. 3', kategori: KategoriFasilitas.KELAS },
    { nama: 'Kelas TULT 0801', lokasi: 'Gedung TULT Lt. 8', kategori: KategoriFasilitas.KELAS },
    { nama: 'Lab Komputer IF.01', lokasi: 'Gedung Tokong Nanas Lt. 2', kategori: KategoriFasilitas.LABORATORIUM },
    { nama: 'Lab IoT & Multimedia', lokasi: 'Gedung A Lt. 2', kategori: KategoriFasilitas.LABORATORIUM },
    { nama: 'Toilet Pria Utama', lokasi: 'Gedung C Lt. 1', kategori: KategoriFasilitas.TOILET },
    { nama: 'Toilet Wanita', lokasi: 'Gedung TULT Lt. 5', kategori: KategoriFasilitas.TOILET },
    { nama: 'Area Parkir Motor Timur', lokasi: 'Samping Lapangan Basket', kategori: KategoriFasilitas.PARKIRAN },
    { nama: 'Kantin Asrama Pusat', lokasi: 'Kawasan Kantin Tel-U', kategori: KategoriFasilitas.KANTIN },
  ];

  const createdFacilities = [];
  for (const f of facilitiesData) {
    const existing = await prisma.facility.findFirst({
      where: { nama: f.nama, lokasi: f.lokasi },
    });
    if (existing) {
      createdFacilities.push(existing);
    } else {
      const created = await prisma.facility.create({ data: f });
      createdFacilities.push(created);
    }
  }

  console.log(`Seeding Fasilitas Berhasil: ${createdFacilities.length} Fasilitas Kampus Siap Digunakan`);

  // 3. Data Dummy Laporan Kerusakan (Reports) dengan 4 Status Berbeda
  const facLab = createdFacilities.find((f) => f.kategori === KategoriFasilitas.LABORATORIUM) || createdFacilities[0]!;
  const facKelas = createdFacilities.find((f) => f.kategori === KategoriFasilitas.KELAS) || createdFacilities[1]!;
  const facToilet = createdFacilities.find((f) => f.kategori === KategoriFasilitas.TOILET) || createdFacilities[2]!;
  const facParkir = createdFacilities.find((f) => f.kategori === KategoriFasilitas.PARKIRAN) || createdFacilities[3]!;

  // Cek apakah sudah ada laporan sejenis untuk menghindari duplikasi id
  const existingReports = await prisma.report.findMany();
  if (existingReports.length === 0) {
    // Laporan 1: Status PENDING
    const report1 = await prisma.report.create({
      data: {
        judul: 'AC Bocor dan Mengeluarkan Suara Bising',
        deskripsi: 'AC di ruangan Lab meneteskan air ke meja komputer dan suhu ruangan terasa panas.',
        status: StatusPelaporan.PENDING,
        facilityId: facLab.id,
        userId: userMhs1.id,
        isAnonymous: false,
        photos: {
          create: [{ url: '/uploads/ac_bocor_dummy.jpg' }],
        },
      },
    });

    // Laporan 2: Status DIPROSES
    const report2 = await prisma.report.create({
      data: {
        judul: 'Proyektor Mati Total dan Kabel HDMI Rusak',
        deskripsi: 'Proyektor di ruang kelas tidak menyala sama sekali saat dihubungkan ke sumber daya listrik.',
        status: StatusPelaporan.DIPROSES,
        catatan: 'Teknisi perlengkapan audio-visual telah ditugaskan ke lokasi untuk penggantian kabel.',
        facilityId: facKelas.id,
        userId: userMhs2.id,
        isAnonymous: false,
        photos: {
          create: [
            { url: '/uploads/proyektor_rusak_1.jpg' },
            { url: '/uploads/proyektor_rusak_2.jpg' },
          ],
        },
      },
    });

    // Laporan 3: Status SELESAI
    const report3 = await prisma.report.create({
      data: {
        judul: 'Kran Wastafel Toilet Patah dan Bocor',
        deskripsi: 'Kran air pada wastafel nomor 2 patah sehingga air menyembur ke lantai.',
        status: StatusPelaporan.SELESAI,
        catatan: 'Penggantian unit kran wastafel baru telah selesai dikerjakan oleh tim sarpras.',
        facilityId: facToilet.id,
        userId: userMhs1.id,
        isAnonymous: false,
        photos: {
          create: [
            { url: '/uploads/kran_patah.jpg' },
            { url: '/uploads/bukti_selesai_kran.jpg' },
          ],
        },
      },
    });

    // Laporan 4: Status DITOLAK (Mode Anonim)
    const report4 = await prisma.report.create({
      data: {
        judul: 'Lampu Penerangan Parkiran Mati Sebagian',
        deskripsi: 'Beberapa lampu sorot di area parkir bagian timur padam saat malam hari.',
        status: StatusPelaporan.DITOLAK,
        rejectionReason: 'Laporan duplikat dengan tiket penanganan sarpras nomor LAP-2026-004 yang sedang dikerjakan PLN kampus.',
        facilityId: facParkir.id,
        userId: userMhs1.id,
        isAnonymous: true,
        photos: {
          create: [{ url: '/uploads/lampu_parkir.jpg' }],
        },
      },
    });

    // 4. Data Dummy Notifikasi Pengguna
    await prisma.notification.createMany({
      data: [
        {
          userId: userMhs1.id,
          reportId: report1.id,
          pesan: `Laporan kerusakan untuk ${facLab.nama} berhasil dikirim dan menunggu verifikasi admin.`,
          isRead: false,
        },
        {
          userId: userMhs2.id,
          reportId: report2.id,
          pesan: `Status laporan Anda (#${report2.id.substring(0, 8)}) telah diperbarui menjadi DIPROSES.`,
          isRead: true,
        },
        {
          userId: userMhs1.id,
          reportId: report3.id,
          pesan: `Status laporan Anda (#${report3.id.substring(0, 8)}) telah diperbarui menjadi SELESAI.`,
          isRead: false,
        },
        {
          userId: userMhs1.id,
          reportId: report4.id,
          pesan: `Status laporan Anda (#${report4.id.substring(0, 8)}) telah diperbarui menjadi DITOLAK.`,
          isRead: false,
        },
      ],
    });

    console.log('Seeding Laporan & Notifikasi Berhasil: 4 Laporan & 4 Notifikasi Terpasang');
  } else {
    console.log(`Laporan sudah ada (${existingReports.length} laporan ditemukan), melewati pembuatan laporan dummy baru.`);
  }

  console.log('Seluruh proses seeding data dummy CARES selesai dengan sukses.');
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });